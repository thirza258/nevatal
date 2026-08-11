import base64
import hashlib
import io
from functools import lru_cache
from typing import Optional
import os
import PyPDF2
from nevatal_settings import settings
from cryptography.fernet import Fernet, InvalidToken

API_KEY_COOKIE_NAME = "nevatal_api_key"
API_KEY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

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


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt a raw provider key into an opaque token.

    The returned value is prefixed so the backend can distinguish encrypted
    values from legacy raw keys during a migration period.
    """
    normalized = _normalize_api_key_value(api_key)
    if not normalized:
        return ""

    token = _get_fernet().encrypt(normalized.encode("utf-8")).decode("utf-8")
    return f"enc:{token}"


def decrypt_api_key(api_key: Optional[str]) -> str:
    """
    Convert an Authorization header value into a raw provider key.

    Legacy raw keys are still accepted for backwards compatibility. Encrypted
    values must use the `enc:` prefix returned by `encrypt_api_key`.
    """
    normalized = _normalize_api_key_value(api_key)
    if not normalized:
        return ""

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

    return hashlib.sha256(
        f"{settings.SECRET_KEY}:{normalized}".encode("utf-8")
    ).hexdigest()


def resolve_api_key_header(api_key: Optional[str]) -> str:
    """
    Resolve an Authorization header to the raw provider key.
    """
    return decrypt_api_key(api_key)


def build_api_key_payload(api_key: Optional[str]) -> dict[str, str]:
    """
    Build encrypted storage values for a raw provider key.
    """
    normalized = _normalize_api_key_value(api_key)
    return {
        "api_key": encrypt_api_key(normalized),
        "api_key_hash": fingerprint_api_key(normalized),
    }


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


def set_api_key_cookie(response, api_key_token: str):
    """
    Store the encrypted API key token in an httpOnly cookie.
    """
    response.set_cookie(
        API_KEY_COOKIE_NAME,
        api_key_token,
        max_age=API_KEY_COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
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

def save_file(file) -> Optional[str]:
    """
    Save a file to the media directory.
    """
    try:
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)

        # Never join a caller-supplied path: "../../etc/passwd" would escape
        # MEDIA_ROOT entirely.
        safe_name = os.path.basename(file.name or "").strip() or "upload"
        file_path = os.path.join(settings.MEDIA_ROOT, safe_name)
        with open(file_path, "wb") as f:
            for chunk in file.chunks() if hasattr(file, "chunks") else [file.read()]:
                f.write(chunk)
        return file_path
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        return None
