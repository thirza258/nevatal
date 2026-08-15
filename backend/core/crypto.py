"""
Transport encryption for the provider API key.

The key a user types is theirs, not ours, and it travels in an Authorization
header through a reverse proxy and a tunnel before Django ever sees it. So the
browser wraps it first:

    1. GET /api/v1/public-key/      → the backend's RSA public key (SPKI, base64)
    2. WebCrypto RSA-OAEP encrypt   → Authorization: rsa:<key_id>:<base64>
    3. decrypt_transport_value()    → the raw key, in the backend only

Only the backend holds the private key, so nothing between the two ends can
read the credential — TLS-terminating proxies and request logs included. This
sits on top of HTTPS rather than replacing it: it does nothing about a
compromised frontend, which sees the key before it is wrapped.

The private key is read from settings.API_KEY_PRIVATE_KEY when set. Otherwise
one is generated on first use and kept in MEDIA_ROOT/.keys/, which is a volume
in the deployed stack, so it survives restarts and redeploys.
"""

import base64
import hashlib
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from django.conf import settings

logger = logging.getLogger(__name__)

TRANSPORT_PREFIX = "rsa:"
ALGORITHM = "RSA-OAEP-SHA256"

# 3072 bits leaves room for the longest provider keys (OAEP-SHA256 caps the
# payload at key_size/8 - 66 bytes, so 318 here against 190 for 2048).
KEY_SIZE = 3072
KEY_FILENAME = "api_key_rsa.pem"

_OAEP = padding.OAEP(
    mgf=padding.MGF1(algorithm=hashes.SHA256()),
    algorithm=hashes.SHA256(),
    label=None,
)


def _key_path() -> Path:
    return Path(settings.MEDIA_ROOT) / ".keys" / KEY_FILENAME


def _load_configured_key():
    """Read the PEM from settings, accepting a base64 blob for env friendliness."""
    configured = getattr(settings, "API_KEY_PRIVATE_KEY", "") or ""
    configured = configured.strip()
    if not configured:
        return None

    material = configured.encode("utf-8")
    if "-----BEGIN" not in configured:
        try:
            material = base64.b64decode(configured, validate=True)
        except Exception:
            logger.error("API_KEY_PRIVATE_KEY is neither PEM nor base64 — ignoring it.")
            return None

    try:
        return serialization.load_pem_private_key(material, password=None)
    except Exception as e:
        logger.error(f"API_KEY_PRIVATE_KEY could not be loaded: {e}")
        return None


def _load_stored_key(path: Path):
    try:
        return serialization.load_pem_private_key(path.read_bytes(), password=None)
    except FileNotFoundError:
        return None
    except Exception as e:
        logger.error(f"Stored transport key at {path} is unreadable: {e}")
        return None


def _generate_and_store_key(path: Path):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=KEY_SIZE)
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        # O_EXCL decides the race: if another worker created the file first,
        # its key is the one browsers have already been handed, so adopt that
        # one instead of serving a public key nothing can decrypt for.
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as f:
            f.write(pem)
        logger.info(f"Generated a new API key transport key at {path}")
    except FileExistsError:
        existing = _load_stored_key(path)
        if existing is not None:
            return existing
    except Exception as e:
        # Failing to persist only means the browser fetches a new public key
        # after the next restart, so this is not fatal.
        logger.warning(f"Could not persist the transport key to {path}: {e}")

    return private_key


@lru_cache(maxsize=1)
def get_private_key():
    """The RSA private key this backend decrypts wrapped API keys with."""
    return _load_configured_key() or _load_stored_key(_key_path()) or _generate_and_store_key(_key_path())


def get_public_key_payload() -> dict:
    """What the browser needs in order to wrap a key for this backend."""
    public_der = get_private_key().public_key().public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    return {
        "algorithm": ALGORITHM,
        "key_id": hashlib.sha256(public_der).hexdigest()[:16],
        "public_key": base64.b64encode(public_der).decode("ascii"),
    }


def is_transport_encrypted(value: Optional[str]) -> bool:
    return bool(value) and value.startswith(TRANSPORT_PREFIX)


def decrypt_transport_value(value: str) -> str:
    """
    Unwrap `rsa:<key_id>:<base64 ciphertext>` back into the raw provider key.

    Returns "" when the value cannot be decrypted — a stale public key, a
    truncated header, or simply not our ciphertext. Callers treat that the same
    way they treat a missing key, so a rotated key reads as "not signed in"
    rather than as a server error.
    """
    parts = value[len(TRANSPORT_PREFIX):].split(":", 1)
    if len(parts) != 2:
        return ""

    key_id, encoded = parts
    try:
        ciphertext = base64.b64decode(encoded, validate=True)
    except Exception:
        return ""

    if key_id and key_id != get_public_key_payload()["key_id"]:
        logger.info("API key was wrapped with a public key this backend no longer holds.")
        return ""

    try:
        return get_private_key().decrypt(ciphertext, _OAEP).decode("utf-8")
    except Exception as e:
        logger.warning(f"Could not unwrap an encrypted API key: {e}")
        return ""
