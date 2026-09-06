import json
from abc import ABC, abstractmethod
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)

PROVIDER_GEMINI = "gemini"
PROVIDER_OPENAI = "openai"
PROVIDER_OPENROUTER = "openrouter"

SUPPORTED_PROVIDERS = {
    PROVIDER_GEMINI,
    PROVIDER_OPENAI,
    PROVIDER_OPENROUTER,
}

# The browser sends the whole thread with every message, because the backend
# keeps no conversation state. These caps are what stops a long thread from
# quietly multiplying someone's token bill on every turn.
CONVERSATION_TURN_LIMIT = 20
CONVERSATION_CHARACTER_LIMIT = 24_000

# What "give me CSV" means to a model. Unknown formats fall through to no
# directive at all, so a stale or hand-written value never breaks a request.
OUTPUT_FORMAT_DIRECTIVES = {
    "markdown": (
        "Write the answer as Markdown, using headings, lists and emphasis "
        "where they genuinely help."
    ),
    "text": (
        "Write the answer as plain prose: no Markdown, no bullet characters, "
        "no code fences."
    ),
    "json": (
        "Write the answer as a single valid JSON document and nothing else. "
        "No prose around it and no code fence."
    ),
    "csv": (
        "Write the answer as CSV: one header row, then one row per record, "
        "comma separated, quoting any value that contains a comma. No prose "
        "around it and no code fence."
    ),
    "table": (
        "Write the answer as a single Markdown table with a header row, and "
        "nothing else."
    ),
}

SUPPORTED_OUTPUT_FORMATS = frozenset(OUTPUT_FORMAT_DIRECTIVES)


def get_ai_service(provider: Optional[str] = None, api_key: Optional[str] = None):
    """
    Resolve a provider-specific service class.
    """
    normalized_provider = normalize_provider(provider, api_key)
    logger.debug("Resolved provider: %s", normalized_provider)

    if normalized_provider == PROVIDER_OPENAI:
        from .openai_service import OpenAIService
        return OpenAIService(api_key=api_key)

    if normalized_provider == PROVIDER_OPENROUTER:
        from .openrouter_service import OpenRouterService
        return OpenRouterService(api_key=api_key)

    from .gemini_service import GeminiService
    return GeminiService(api_key=api_key)


def _resolve_service(api_key: Optional[str], provider: Optional[str] = None):
    return get_ai_service(provider=provider, api_key=api_key)


def test_api_key(api_key: str, provider: Optional[str] = None):
    try:
        service = _resolve_service(api_key, provider)
        return service.test_api_key(api_key)
    except Exception as e:
        logger.error(f"API key validation failed: {e}")
        return False


def generate_response(
    api_key: str,
    prompt: str,
    model: str = None,
    system_instruction_string: str = "Answer this prompt make sure answer that",
    response_schema_param: Optional[list[str]] = None,
    response_mime_type_param: str = "application/json",
    provider: Optional[str] = None,
    conversation: Optional[list[dict[str, str]]] = None,
    output_format: str = "",
) -> str:
    """
    Generate an answer and return just the text.

    Callers that record what a request consumed want
    `generate_response_with_usage` instead; this stays for the ones that do not.
    """
    text, _usage = generate_response_with_usage(
        api_key=api_key,
        prompt=prompt,
        model=model,
        system_instruction_string=system_instruction_string,
        response_schema_param=response_schema_param,
        response_mime_type_param=response_mime_type_param,
        provider=provider,
        conversation=conversation,
        output_format=output_format,
    )
    return text


def generate_response_with_usage(
    api_key: str,
    prompt: str,
    model: str = None,
    system_instruction_string: str = "Answer this prompt make sure answer that",
    response_schema_param: Optional[list[str]] = None,
    response_mime_type_param: str = "application/json",
    provider: Optional[str] = None,
    conversation: Optional[list[dict[str, str]]] = None,
    output_format: str = "",
) -> tuple[str, dict[str, Any]]:
    """
    Generate an answer, and describe what it consumed.

    The usage record is `{model, tokens_in, tokens_out, cost}`, read off the
    service immediately after the call it belongs to — same function, same
    thread, no request boundary in between. Token counts are the provider's own;
    `cost` is this app's estimate from the provider's published prices, and is
    None for a provider that publishes none.
    """
    service = _resolve_service(api_key, provider)
    schema_fields = response_schema_param or ["response"]

    text = service.generate_response(
        prompt=prompt,
        api_key=api_key,
        model=model,
        system_instruction_string=system_instruction_string,
        response_schema_param=schema_fields,
        response_mime_type_param=response_mime_type_param,
        conversation=normalize_conversation(conversation),
        output_format=output_format,
    )

    return text, service.describe_usage(model)


def generate_image(prompt: str, api_key: str, provider: Optional[str] = None):
    service = _resolve_service(api_key, provider)
    return service.generate_image(prompt=prompt, api_key=api_key)


def list_models(api_key: Optional[str] = None, provider: Optional[str] = None) -> dict[str, Any]:
    """
    Describe the models the session's key can be pointed at.

    Only a provider that publishes a catalogue returns anything: OpenRouter
    routes to hundreds of models and lists them all, so a key belonging to it
    gets a model to choose. The rest report an empty list, which reads as "this
    key has no choice to make" rather than as an error.
    """
    service = _resolve_service(api_key, provider)
    return {
        "provider": service.provider_name,
        "default_model": service.default_model,
        "models": service.list_models(),
    }


def describe_account(api_key: str, provider: Optional[str] = None) -> Optional[dict[str, Any]]:
    """
    What the provider says about this key's own spend and remaining credit.

    None unless the provider publishes it — OpenRouter does, and it is the
    number a spending alert most wants to compare against.
    """
    service = _resolve_service(api_key, provider)
    return service.describe_account(api_key)


def normalize_conversation(conversation: Any) -> list[dict[str, str]]:
    """
    Clean a client-supplied thread into role-tagged turns the services can map.

    Only `user` and `assistant` turns with real text survive. The result is
    capped at the most recent `CONVERSATION_TURN_LIMIT` turns and trimmed from
    the oldest end until it fits `CONVERSATION_CHARACTER_LIMIT`, so a thread
    that grows all afternoon stops growing the bill.
    """
    if not conversation:
        return []

    turns: list[dict[str, str]] = []
    for entry in conversation:
        if not isinstance(entry, dict):
            continue

        role = str(entry.get("role") or "").strip().lower()
        if role not in {"user", "assistant"}:
            continue

        content = entry.get("content")
        if content is None:
            content = entry.get("text")
        if not isinstance(content, str) or not content.strip():
            continue

        turns.append({"role": role, "content": content.strip()})

    turns = turns[-CONVERSATION_TURN_LIMIT:]

    budget = CONVERSATION_CHARACTER_LIMIT
    kept: list[dict[str, str]] = []
    for turn in reversed(turns):
        budget -= len(turn["content"])
        if budget < 0:
            break
        kept.append(turn)

    kept.reverse()
    return kept


def apply_output_format(instruction: str, output_format: str = "") -> str:
    """
    Append the directive for a requested output format, if it is one we know.
    """
    directive = OUTPUT_FORMAT_DIRECTIVES.get((output_format or "").strip().lower())
    if not directive:
        return instruction

    return f"{instruction}\n{directive}"


def empty_usage(model: str = "") -> dict[str, Any]:
    """A usage record for a call that reported nothing."""
    return {"model": model or "", "tokens_in": None, "tokens_out": None, "cost": None}


def sum_usage(first: dict[str, Any], second: dict[str, Any]) -> dict[str, Any]:
    """
    Add two usage records, for a tool that makes several calls per request.

    None means "the provider did not say", which is not zero: adding a number
    to it keeps the number, and adding two Nones keeps None.
    """
    def add(left: Any, right: Any) -> Any:
        if left is None and right is None:
            return None
        return (left or 0) + (right or 0)

    return {
        "model": second.get("model") or first.get("model") or "",
        "tokens_in": add(first.get("tokens_in"), second.get("tokens_in")),
        "tokens_out": add(first.get("tokens_out"), second.get("tokens_out")),
        "cost": add(first.get("cost"), second.get("cost")),
    }


def normalize_provider(provider: Optional[str], api_key: Optional[str] = None) -> str:
    """
    Normalize a provider hint or infer it from an API key prefix.
    """
    normalized = (provider or "").strip().lower()
    aliases = {
        "google": PROVIDER_GEMINI,
        "gemini": PROVIDER_GEMINI,
        "openai": PROVIDER_OPENAI,
        "openrouter": PROVIDER_OPENROUTER,
        "langchain": PROVIDER_OPENROUTER,
        "langchain-openai": PROVIDER_OPENAI,
        "langchain-openrouter": PROVIDER_OPENROUTER,
    }

    if normalized in aliases:
        return aliases[normalized]

    if api_key:
        stripped = api_key.strip()
        if stripped.startswith("sk-or-"):
            return PROVIDER_OPENROUTER
        if stripped.startswith("sk-"):
            return PROVIDER_OPENAI
        if stripped.startswith("AIza"):
            return PROVIDER_GEMINI

    return PROVIDER_GEMINI


def _as_token_count(value: Any) -> Optional[int]:
    """Coerce a provider's token figure to a count, or None if it is not one."""
    try:
        count = int(value)
    except (TypeError, ValueError):
        return None

    return count if count >= 0 else None


class BaseAIService(ABC):
    """
    Base service for provider-specific implementations.
    """

    provider_name = PROVIDER_GEMINI
    default_model = ""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        # Filled in by generate_response and read by describe_usage, both
        # within one call. A service instance never outlives its request.
        self.last_usage: dict[str, Any] = {}

    def resolve_api_key(self, api_key: Optional[str] = None) -> str:
        resolved = api_key or self.api_key
        if not resolved:
            raise ValueError("API key is required.")
        return resolved

    def normalize_model(self, model: Optional[str]) -> str:
        return model or self.default_model

    def build_response_instruction(
        self,
        system_instruction_string: str,
        response_schema_param: Optional[list[str]],
        output_format: str = "",
    ) -> str:
        instruction = apply_output_format(system_instruction_string, output_format)

        if not response_schema_param:
            return instruction

        schema_keys = ", ".join(response_schema_param)
        return (
            f"{instruction}\n"
            "Return the answer as a JSON object. "
            f"The JSON object must contain these string keys: {schema_keys}."
        )

    def ensure_json_response(
        self,
        response_text: str,
        response_schema_param: Optional[list[str]],
    ) -> str:
        if not response_schema_param:
            return response_text

        stripped = response_text.strip()
        if stripped.startswith("{") or stripped.startswith("["):
            return response_text

        if len(response_schema_param) == 1:
            return json.dumps({response_schema_param[0]: response_text})

        return json.dumps({key: response_text for key in response_schema_param})

    def coerce_text(self, response: Any) -> str:
        if response is None:
            return ""

        if isinstance(response, str):
            return response

        if isinstance(response, dict):
            if "content" in response:
                return self.coerce_text(response["content"])
            if "text" in response:
                return self.coerce_text(response["text"])
            return json.dumps(response)

        text = getattr(response, "text", None)
        if text is not None:
            return self.coerce_text(text)

        content = getattr(response, "content", None)
        if content is not None:
            return self.coerce_text(content)

        if hasattr(response, "model_dump"):
            return json.dumps(response.model_dump())

        return str(response)

    def remember_usage(
        self,
        tokens_in: Any = None,
        tokens_out: Any = None,
    ) -> None:
        """
        Record what the call that just returned consumed.
        """
        self.last_usage = {
            "tokens_in": _as_token_count(tokens_in),
            "tokens_out": _as_token_count(tokens_out),
        }

    def remember_message_usage(self, response: Any) -> None:
        """
        Record usage from a LangChain reply, whose `usage_metadata` carries it.
        """
        metadata = getattr(response, "usage_metadata", None) or {}
        if not isinstance(metadata, dict):
            metadata = {}

        self.remember_usage(
            tokens_in=metadata.get("input_tokens"),
            tokens_out=metadata.get("output_tokens"),
        )

    def describe_usage(self, model: Optional[str] = None) -> dict[str, Any]:
        """
        The usage record for the last generation on this service instance.
        """
        tokens = self.last_usage or {}
        model_name = self.normalize_model(model)
        tokens_in = tokens.get("tokens_in")
        tokens_out = tokens.get("tokens_out")

        return {
            "model": model_name,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "cost": self.estimate_cost(model_name, tokens_in, tokens_out),
        }

    def estimate_cost(
        self,
        model: str,
        tokens_in: Optional[int],
        tokens_out: Optional[int],
    ) -> Optional[float]:
        """
        What the call cost, as far as this app can tell.

        None unless the provider publishes prices this app can read, because a
        guessed number on a spend screen is worse than an honest blank.
        """
        return None

    def describe_account(self, api_key: Optional[str] = None) -> Optional[dict[str, Any]]:
        """
        The provider's own view of this key: credit, spend, limits.

        None unless the provider exposes it.
        """
        return None

    def build_conversation_roles(
        self,
        conversation: Optional[list[dict[str, str]]],
    ) -> list[dict[str, str]]:
        """The turns to replay before the current prompt, oldest first."""
        return list(conversation or [])

    @abstractmethod
    def test_api_key(self, api_key: Optional[str] = None) -> str:
        raise NotImplementedError

    @abstractmethod
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
        raise NotImplementedError

    def generate_image(self, prompt: str, api_key: Optional[str] = None):
        raise NotImplementedError(
            f"Image generation is not supported by {self.provider_name}."
        )

    def list_models(self) -> list[dict[str, Any]]:
        """
        The models this provider can be pointed at.

        Empty unless the provider publishes a catalogue this app reads, in
        which case the session stays on `default_model`.
        """
        return []
