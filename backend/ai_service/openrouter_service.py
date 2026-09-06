import logging
import os
import time
from typing import Any, Optional

import requests
from langchain_openai import ChatOpenAI

from .ai_service import BaseAIService, PROVIDER_OPENROUTER
from .langchain_messages import build_messages

logger = logging.getLogger(__name__)

try:
    from langchain_openrouter import ChatOpenRouter
except Exception:  # pragma: no cover - fallback for environments without the package
    ChatOpenRouter = None

# `GET /models` is a ~700KB response listing every model OpenRouter can route
# to, and it changes a few times a day at most. One fetch is shared by every
# session in this process for the length of the TTL.
MODELS_CACHE_TTL_SECONDS = 600
MODELS_REQUEST_TIMEOUT_SECONDS = 15

_models_cache: Optional[tuple[float, list[dict[str, Any]]]] = None


def clear_models_cache() -> None:
    """Forget the cached catalogue so the next call fetches it again."""
    global _models_cache
    _models_cache = None


def _price_per_million(value: Any) -> Optional[float]:
    """
    Convert one of OpenRouter's per-token prices to dollars per million tokens.

    The catalogue quotes prices per token, as strings: "0.00001" is $10 per
    million, which is the unit anyone comparing models actually thinks in.
    A missing or unparseable price becomes None, so it can be shown as unknown
    rather than as free.
    """
    try:
        price = float(value)
    except (TypeError, ValueError):
        return None

    if price < 0:
        return None

    return round(price * 1_000_000, 4)


def _summarize_model(entry: Any) -> Optional[dict[str, Any]]:
    """
    Reduce one catalogue entry to what a model picker needs.

    A full entry carries a paragraph of prose, benchmark scores, per-endpoint
    links and pricing overrides; 431 of those is most of a megabyte to send to
    a browser that only has to render a name, a context size and a price.
    """
    if not isinstance(entry, dict):
        return None

    model_id = str(entry.get("id") or "").strip()
    if not model_id:
        return None

    pricing = entry.get("pricing") or {}
    prompt_price = _price_per_million(pricing.get("prompt"))
    completion_price = _price_per_million(pricing.get("completion"))
    top_provider = entry.get("top_provider") or {}

    return {
        "id": model_id,
        "name": str(entry.get("name") or model_id),
        "context_length": entry.get("context_length") or top_provider.get("context_length"),
        "prompt_price_per_million": prompt_price,
        "completion_price_per_million": completion_price,
        "modality": str((entry.get("architecture") or {}).get("modality") or ""),
        "is_free": prompt_price == 0 and completion_price == 0,
    }


class OpenRouterService(BaseAIService):
    provider_name = PROVIDER_OPENROUTER
    default_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    def list_models(self) -> list[dict[str, Any]]:
        """
        Every model OpenRouter can route to, from `GET /models`.

        The endpoint is public: a key pays for generation, not for reading the
        catalogue. So this needs no key of its own, and an OpenRouter session
        sees the whole list rather than a curated subset.

        Failures are raised, not swallowed — the caller turns them into a
        "catalogue unavailable" response instead of an empty list, which would
        read as "this provider has no models to choose from".
        """
        global _models_cache

        if _models_cache is not None:
            fetched_at, cached_models = _models_cache
            if time.monotonic() - fetched_at < MODELS_CACHE_TTL_SECONDS:
                return cached_models

        response = requests.get(
            f"{self.base_url.rstrip('/')}/models",
            timeout=MODELS_REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        payload = response.json()
        entries = payload.get("data") if isinstance(payload, dict) else None
        models = [
            summary
            for summary in (_summarize_model(entry) for entry in entries or [])
            if summary is not None
        ]

        # Ids read `vendor/model`, so sorting by id groups a vendor's models
        # together — what someone scanning a list of 400 expects to find.
        models.sort(key=lambda model: model["id"])

        _models_cache = (time.monotonic(), models)
        return models

    def describe_account(self, api_key: Optional[str] = None) -> Optional[dict[str, Any]]:
        """
        Read the key's own credit and spend from `GET /key`.

        Unlike the catalogue this does need the key, and it is the only figure
        here that comes from the provider rather than from our own arithmetic —
        which makes it the right thing for a spending alert to watch.
        """
        try:
            key = self.resolve_api_key(api_key)
            response = requests.get(
                f"{self.base_url.rstrip('/')}/key",
                headers={"Authorization": f"Bearer {key}"},
                timeout=MODELS_REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception as e:
            logger.info(f"Could not read the OpenRouter key's account: {e}")
            return None

        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            return None

        return {
            "provider": self.provider_name,
            "label": data.get("label") or "",
            "spend": data.get("usage"),
            "limit": data.get("limit"),
            "remaining": data.get("limit_remaining"),
            "is_free_tier": data.get("is_free_tier"),
        }

    def estimate_cost(
        self,
        model: str,
        tokens_in: Optional[int],
        tokens_out: Optional[int],
    ) -> Optional[float]:
        """
        Price a call from the catalogue's own per-million figures.

        The catalogue is normally already cached — the model picker fetches it
        when the workspace loads — so this costs nothing in the usual case. A
        cold cache fetches once; a failure means no price rather than a wrong
        one, and never breaks the generation it is describing.
        """
        if tokens_in is None and tokens_out is None:
            return None

        try:
            entry = next(
                (model_entry for model_entry in self.list_models() if model_entry["id"] == model),
                None,
            )
        except Exception as e:
            logger.info(f"Could not price {model}, the catalogue is unavailable: {e}")
            return None

        if not entry:
            return None

        prompt_price = entry.get("prompt_price_per_million")
        completion_price = entry.get("completion_price_per_million")
        if prompt_price is None or completion_price is None:
            return None

        cost = (
            (tokens_in or 0) / 1_000_000 * prompt_price
            + (tokens_out or 0) / 1_000_000 * completion_price
        )
        return round(cost, 10)

    def _build_llm(self, api_key: str, model: Optional[str] = None):
        model_name = self.normalize_model(model)

        if ChatOpenRouter is not None:
            for key_name in ("api_key", "openai_api_key"):
                try:
                    return ChatOpenRouter(
                        model=model_name,
                        temperature=0,
                        **{key_name: api_key},
                    )
                except Exception:
                    continue

        base_kwargs = {
            "model": model_name,
            "temperature": 0,
        }

        for base_url_key in ("base_url", "openai_api_base"):
            for key_name in ("api_key", "openai_api_key"):
                try:
                    return ChatOpenAI(
                        **base_kwargs,
                        **{base_url_key: self.base_url, key_name: api_key},
                    )
                except Exception:
                    continue

        return ChatOpenAI(**base_kwargs)

    def test_api_key(self, api_key: Optional[str] = None) -> str:
        key = self.resolve_api_key(api_key)
        return self.generate_response(
            prompt="test",
            api_key=key,
            system_instruction_string="Reply with a short confirmation message.",
            response_schema_param=None,
            response_mime_type_param="text/plain",
        )

    def generate_response(
        self,
        prompt: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        system_instruction_string: str = "Answer this prompt make sure answer that",
        response_schema_param: Optional[list[str]] = None,
        response_mime_type_param: str = "application/json",
        conversation: Optional[list[dict[str, str]]] = None,
        output_format: str = "",
    ) -> str:
        try:
            key = self.resolve_api_key(api_key)
            llm = self._build_llm(key, model)
            instruction = self.build_response_instruction(
                system_instruction_string,
                response_schema_param,
                output_format,
            )
            response = llm.invoke(build_messages(instruction, conversation, prompt))
            self.remember_message_usage(response)
            response_text = self.coerce_text(response)
            return self.ensure_json_response(response_text, response_schema_param)
        except Exception as e:
            logger.error(f"An error occurred during OpenRouter API call: {e}")
            raise
