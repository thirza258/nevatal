"""
Several provider keys in one session.

A key is only ever held encrypted in an httpOnly cookie — the same treatment
the single-key session gives it, applied to a list — so keeping a spare does
not weaken the first one. Nothing goes to localStorage, and the browser is only
ever shown masked values.

`nevatal_api_key` stays the active key, which is what every view already reads,
so nothing downstream has to know that slots exist.
"""

import json
import logging
from typing import Any, Optional

from ai_service import normalize_provider

from core.helper import (
    API_KEY_COOKIE_MAX_AGE,
    decrypt_text,
    encrypt_api_key,
    encrypt_text,
    set_api_key_cookie,
)
from nevatal_settings import settings

logger = logging.getLogger(__name__)

API_KEYS_COOKIE_NAME = "nevatal_api_keys"

# Enough for a spare and a couple of project keys. The cookie holds them all,
# and cookies are capped at about 4KB.
KEY_SLOT_LIMIT = 5

LABEL_MAX_LENGTH = 40


def mask_key(api_key: str) -> str:
    """
    A key the way it is safe to show: enough to recognise, not enough to use.
    """
    stripped = (api_key or "").strip()
    if len(stripped) <= 12:
        return "…" * bool(stripped)

    return f"{stripped[:10]}…{stripped[-4:]}"


def clean_label(label: Any, fallback: str) -> str:
    if not isinstance(label, str):
        return fallback

    cleaned = " ".join(label.split())[:LABEL_MAX_LENGTH]
    return cleaned or fallback


def load_slots(request) -> tuple[list[dict[str, str]], int]:
    """
    Read the session's key slots, oldest first, with the active index.

    A cookie that cannot be read is treated as no slots rather than an error:
    the session still has its active key, and the slot list can be rebuilt by
    adding keys again.
    """
    raw = decrypt_text(request.COOKIES.get(API_KEYS_COOKIE_NAME))
    if not raw:
        return [], 0

    try:
        payload = json.loads(raw)
    except ValueError:
        logger.info("Discarding an unreadable key slot cookie.")
        return [], 0

    if not isinstance(payload, dict):
        return [], 0

    slots = []
    for entry in payload.get("slots") or []:
        if not isinstance(entry, dict):
            continue
        key = entry.get("key")
        if not isinstance(key, str) or not key.strip():
            continue
        slots.append(
            {
                "key": key.strip(),
                "label": clean_label(entry.get("label"), mask_key(key)),
            }
        )

    slots = slots[:KEY_SLOT_LIMIT]

    try:
        active_index = int(payload.get("active_index") or 0)
    except (TypeError, ValueError):
        active_index = 0

    if not slots:
        return [], 0

    return slots, max(0, min(active_index, len(slots) - 1))


def store_slots(response, slots: list[dict[str, str]], active_index: int):
    """
    Write the slot list and point the session's active key cookie at one of it.
    """
    if not slots:
        response.delete_cookie(API_KEYS_COOKIE_NAME, path="/")
        return response

    active_index = max(0, min(active_index, len(slots) - 1))
    payload = json.dumps(
        {
            "slots": [{"key": slot["key"], "label": slot["label"]} for slot in slots],
            "active_index": active_index,
        }
    )

    response.set_cookie(
        API_KEYS_COOKIE_NAME,
        encrypt_text(payload),
        max_age=API_KEY_COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/",
    )

    return set_api_key_cookie(response, encrypt_api_key(slots[active_index]["key"]))


def describe_slots(slots: list[dict[str, str]], active_index: int) -> list[dict[str, Any]]:
    """
    The slot list as the browser is allowed to see it.
    """
    return [
        {
            "index": index,
            "label": slot["label"],
            "masked": mask_key(slot["key"]),
            "provider": normalize_provider(None, slot["key"]),
            "active": index == active_index,
        }
        for index, slot in enumerate(slots)
    ]


def slots_with_key(
    slots: list[dict[str, str]],
    api_key: str,
    label: Optional[str] = None,
) -> tuple[list[dict[str, str]], int]:
    """
    Add a key, or move to the one already there.

    Adding the same key twice is a no-op that selects it, which is what someone
    pasting a key they already have almost certainly meant.
    """
    for index, slot in enumerate(slots):
        if slot["key"] == api_key:
            if label:
                slots[index]["label"] = clean_label(label, slot["label"])
            return slots, index

    if len(slots) >= KEY_SLOT_LIMIT:
        raise ValueError(f"A session holds at most {KEY_SLOT_LIMIT} keys.")

    slots = slots + [{"key": api_key, "label": clean_label(label, mask_key(api_key))}]
    return slots, len(slots) - 1

