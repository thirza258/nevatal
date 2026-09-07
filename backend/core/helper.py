import base64
import hashlib
import io
import logging
from functools import lru_cache
from typing import Optional
import os
import PyPDF2
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken

from core.crypto import decrypt_transport_value, is_transport_encrypted

logger = logging.getLogger(__name__)

API_KEY_COOKIE_NAME = "nevatal_api_key"
API_KEY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

# The model the browser picked for this session, as sent with every generation.
# A model id is not a secret, so it rides a plain header rather than the
# encrypted key path.
AI_MODEL_HEADER = "X-AI-Model"

# Long enough for any real provider model id, short enough that a junk header
# cannot be used to push a wall of text into an outbound request.
AI_MODEL_MAX_LENGTH = 200

# A batch run makes one request per item, and those belong in the usage figures
# but not in the sidebar, where fifty rows of "translate line 37" would bury
# the work someone actually wants to find again.
BATCH_HEADER = "X-Nevatal-Batch"

# Which shape the answer should come back in. Validated in ai_service, which
# owns the directives; an unknown value there simply adds no directive.
OUTPUT_FORMAT_FIELD = "output_format"
OUTPUT_FORMAT_MAX_LENGTH = 20

# The thread the browser is carrying. The backend keeps no conversation state,
# so context retention means the client resends the turns and ai_service caps
# how many of them are replayed.
CONVERSATION_FIELD = "conversation"

def strip_authentication_header(header: str) -> str:
    try:
        if header.startswith("Bearer "):
            return header[7:]
        return header
    except Exception as e:
        return header


def _normalize_api_key_value(api_key: Optional[str]) -> str:
    if not api_key:
        return ""
    return strip_authentication_header(api_key).strip()


@lru_cache(maxsize=1)
def _get_fernet() -> Fernet:
    """
    Build a symmetric cipher from Django's SECRET_KEY.

    This is server-side only. The frontend receives opaque tokens and never
    learns the secret used to decrypt them.
    """
    secret = getattr(settings, "SECRET_KEY", "")
    if not secret:
        raise ValueError("SECRET_KEY is required for API key encryption.")

    derived_key = hashlib.sha256(secret.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(derived_key)
    return Fernet(fernet_key)


def encrypt_text(value: str) -> str:
    """
    Encrypt any server-side value into an opaque `enc:` token.

    Used for the provider key and for the key slot list, which is a JSON
    document rather than a single key but deserves the same treatment.
    """
    if not value:
        return ""

    token = _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")
    return f"enc:{token}"


def decrypt_text(token: Optional[str]) -> str:
    """
    Read back a value written by `encrypt_text`, or "" if it cannot be read.
    """
    if not token or not token.startswith("enc:"):
        return ""

    try:
        return _get_fernet().decrypt(token[4:].encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt a raw provider key into an opaque token.

    The returned value is prefixed so the backend can distinguish encrypted
    values from legacy raw keys during a migration period.
    """
    normalized = _normalize_api_key_value(api_key)
    if not normalized:
        return ""

    return encrypt_text(normalized)


def decrypt_api_key(api_key: Optional[str]) -> str:
    """
    Convert an Authorization header value into a raw provider key.

    Three forms arrive here: `rsa:` values wrapped by the browser with the
    backend's public key, `enc:` values from the session cookie, and legacy raw
    keys, still accepted for backwards compatibility.
    """
    normalized = _normalize_api_key_value(api_key)
    if not normalized:
        return ""

    if is_transport_encrypted(normalized):
        return decrypt_transport_value(normalized)

    if not normalized.startswith("enc:"):
        return normalized

    token = normalized[4:]
    try:
        return _get_fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""


def fingerprint_api_key(api_key: Optional[str]) -> str:
    """
    Create a stable non-reversible identifier for a provider key.
    """
    normalized = _normalize_api_key_value(api_key)
    if not normalized:
        return ""

    # Salted with API_KEY_FINGERPRINT_SALT rather than SECRET_KEY directly, so
    # that rotating a compromised SECRET_KEY does not change every fingerprint
    # and cut users off from their own history and documents. The salt defaults
    # to SECRET_KEY, so nothing changes until it is set deliberately.
    salt = getattr(settings, "API_KEY_FINGERPRINT_SALT", "") or settings.SECRET_KEY

    return hashlib.sha256(
        f"{salt}:{normalized}".encode("utf-8")
    ).hexdigest()


def resolve_api_key_header(api_key: Optional[str]) -> str:
    """
    Resolve an Authorization header to the raw provider key.
    """
    return decrypt_api_key(api_key)


def resolve_api_key_from_request(request) -> str:
    """
    Resolve an API key from an Authorization header or httpOnly cookie.

    The cookie value is expected to be the encrypted token returned by the
    validation endpoint.
    """
    header_value = request.headers.get("Authorization")
    if header_value:
        return decrypt_api_key(header_value)

    cookie_value = request.COOKIES.get(API_KEY_COOKIE_NAME)
    return decrypt_api_key(cookie_value)


def resolve_model_from_request(request) -> str:
    """
    Resolve the model this request should be generated with.

    The browser sends the id it picked from the provider's catalogue — see
    `/api/v1/models/`. An empty result means "use the provider default", which
    is what every service does with a falsy model, so a session that never
    picked one is unaffected.

    Anything that cannot be a model id is dropped rather than rejected: the
    request is still a valid one, it just runs on the default.
    """
    model = (request.headers.get(AI_MODEL_HEADER) or "").strip()

    if not model or len(model) > AI_MODEL_MAX_LENGTH:
        return ""

    if any(character.isspace() for character in model):
        return ""

    return model


def _request_field(request, field: str):
    """Read one field from a request body, whatever the parser produced."""
    try:
        return request.data.get(field)
    except (AttributeError, TypeError):
        return None


def resolve_output_format_from_request(request) -> str:
    """
    Resolve the output format this request asked for.

    Unlike the model, this belongs to the request rather than the session: JSON
    from a data extractor and Markdown from a writer, in the same sitting.
    """
    value = (_request_field(request, OUTPUT_FORMAT_FIELD) or "")
    if not isinstance(value, str):
        return ""

    value = value.strip().lower()
    return value if len(value) <= OUTPUT_FORMAT_MAX_LENGTH else ""


def resolve_conversation_from_request(request) -> list:
    """
    Resolve the thread this request should be answered in the context of.

    Returned as-is: `ai_service.normalize_conversation` is what decides which
    turns are usable and how many of them fit the budget.
    """
    value = _request_field(request, CONVERSATION_FIELD)
    return value if isinstance(value, list) else []


def resolve_batch_from_request(request) -> bool:
    """
    Whether this request is one item of a batch run.

    Batch rows still count towards usage and spend — they cost real tokens —
    but they stay out of the history sidebar.
    """
    return (request.headers.get(BATCH_HEADER) or "").strip().lower() in {
        "1",
        "true",
        "yes",
    }


def set_api_key_cookie(response, api_key_token: str):
    """
    Store the encrypted API key token in an httpOnly cookie.
    """
    response.set_cookie(
        API_KEY_COOKIE_NAME,
        api_key_token,
        max_age=API_KEY_COOKIE_MAX_AGE,
        httponly=True,
        secure=getattr(settings, "SECURE_COOKIES", not settings.DEBUG),
        # Strict because DRF exempts these endpoints from CSRF checks: this
        # attribute is what stops another site POSTing as the visitor and
        # spending their provider credit. Do not relax it.
        #
        # Strict does not break arriving from a link elsewhere, which is the
        # usual reason people downgrade it to Lax. That navigation fetches
        # index.html, a static file needing no cookie; the session is then
        # decided by an XHR the loaded page makes to its own origin, which is
        # same-site whatever the user clicked to get here.
        samesite="Strict",
        path="/",
    )
    return response


def clear_api_key_cookie(response):
    """
    Remove the API key cookie from the browser.
    """
    response.delete_cookie(API_KEY_COOKIE_NAME, path="/")
    return response

def extract_text_from_pdf(pdf_file) -> Optional[str]:
    """
    Extract text content from a PDF file.

    Args:
        pdf_file: Django UploadedFile or file-like object

    Returns:
        str: Extracted text from PDF, or None if extraction fails
    """
    try:
        pdf_file.seek(0)
        

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))

        text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text() or ""
            text += extracted

        text = text.strip()
        if not text:
            print("⚠️ No text extracted — PDF may be scanned or image-based.")
            return None

        print("✅ Text extracted successfully.")
        return text

    except Exception as e:
        print(f"❌ Error extracting text from PDF: {e}")
        return None

# What an upload is allowed to be, and how big. Nothing here streams: a PDF is
# read into memory by PyPDF2 and a CSV by pandas, so an unbounded upload is an
# unbounded allocation.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

UPLOAD_KINDS = {
    "pdf": {"application/pdf", "application/x-pdf", "application/octet-stream", ""},
    "csv": {
        "text/csv",
        "application/csv",
        "text/plain",
        "application/vnd.ms-excel",
        "application/octet-stream",
        "",
    },
}

# Characters allowed in a stored filename. Anything else becomes an underscore,
# which keeps shell metacharacters, newlines and unicode direction marks out of
# paths and out of log lines.
_SAFE_FILENAME_CHARS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._- "
)

# The RAG store keeps its own files beside the upload it was built from. An
# upload is never allowed to be named like one of them.
RESERVED_UPLOAD_NAMES = {"index.pkl", "meta.json"}


def upload_extension(filename: Optional[str]) -> str:
    """The lowercase extension of an upload, without the dot."""
    name = os.path.basename(filename or "")
    _, _, extension = name.rpartition(".")
    return extension.lower() if extension and extension != name else ""


def validate_upload(file, kinds, max_bytes: int = MAX_UPLOAD_BYTES) -> Optional[str]:
    """
    Check an upload before anything parses it. Returns an error message, or
    None when the file is acceptable.

    Both halves matter. The size check is what stops a single request from
    exhausting memory, since PyPDF2 and pandas both load the whole file. The
    extension check is what stops the parsers being handed something they were
    not written for. The declared content type is advisory — a browser gets it
    from the OS and a script can claim anything — so it is checked loosely and
    never on its own.
    """
    if file is None:
        return "A file is required."

    kinds = [kinds] if isinstance(kinds, str) else list(kinds)

    size = getattr(file, "size", None)
    if size is None:
        return "The upload has no readable size."
    if size <= 0:
        return "The uploaded file is empty."
    if size > max_bytes:
        limit_mb = max_bytes / (1024 * 1024)
        return f"The file is larger than the {limit_mb:.0f} MB limit."

    extension = upload_extension(getattr(file, "name", ""))
    if extension not in kinds:
        return f"Only {' or '.join(sorted(kinds)).upper()} files are supported."

    allowed_types = UPLOAD_KINDS.get(extension, set())
    declared = (getattr(file, "content_type", "") or "").split(";")[0].strip().lower()
    if allowed_types and declared not in allowed_types:
        return f"The file does not look like a {extension.upper()} file."

    return None


def safe_upload_name(filename: Optional[str], fallback: str = "upload") -> str:
    """
    Reduce an uploaded filename to something safe to write to disk.

    `os.path.basename` alone is not enough. It stops a path escaping the
    directory, but it happily returns "index.pkl" — and the RAG store unpickles
    a file by that name from the very folder uploads are written to, so a name
    collision there would mean loading attacker-supplied bytes through
    `pickle.load`. Reserved names get a prefix, and so does anything that would
    otherwise start with a dot.
    """
    name = os.path.basename(filename or "").strip()
    name = "".join(character if character in _SAFE_FILENAME_CHARS else "_" for character in name)
    name = name.strip(". ") or fallback

    # Keep well inside the 255-byte limit most filesystems impose, leaving room
    # for the prefix below.
    if len(name) > 120:
        stem, _, extension = name.rpartition(".")
        name = f"{stem[:100]}.{extension}" if stem and len(extension) <= 12 else name[:120]

    if name.lower() in RESERVED_UPLOAD_NAMES:
        name = f"source_{name}"

    return name


def save_file(file, directory=None) -> Optional[str]:
    """
    Save a file to the media directory, or to `directory` when one is given.

    The RAG store passes the numbered folder it just reserved so the upload
    ends up next to the index built from it.
    """
    try:
        target_dir = directory or settings.MEDIA_ROOT
        os.makedirs(target_dir, exist_ok=True)

        # Never join a caller-supplied path: "../../etc/passwd" would escape
        # MEDIA_ROOT entirely, and "index.pkl" would land on top of a file the
        # store later unpickles.
        safe_name = safe_upload_name(getattr(file, "name", ""))
        file_path = os.path.join(target_dir, safe_name)

        # The resolved path must still be inside the directory we meant to
        # write to; a belt-and-braces check against a future change to the
        # sanitiser above.
        resolved = os.path.realpath(file_path)
        if os.path.commonpath([resolved, os.path.realpath(target_dir)]) != os.path.realpath(target_dir):
            raise ValueError("Refusing to write outside the upload directory.")

        with open(file_path, "wb") as f:
            for chunk in file.chunks() if hasattr(file, "chunks") else [file.read()]:
                f.write(chunk)
        return file_path
    except Exception as e:
        logger.warning(f"Error saving file: {e}")
        return None
