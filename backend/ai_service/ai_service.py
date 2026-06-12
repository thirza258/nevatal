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

def get_ai_service(provider: Optional[str] = None, api_key: Optional[str] = None):
    """
    Resolve a provider-specific service class.
    """
    normalized_provider = normalize_provider(provider, api_key)
    print(f"Resolved provider: {normalized_provider}") 
    if normalized_provider == PROVIDER_OPENAI:
        from .openai_service import OpenAIService
        print("Returning OpenAIService")
        return OpenAIService(api_key=api_key)

    if normalized_provider == PROVIDER_OPENROUTER:
        from .openrouter_service import OpenRouterService
        print("Returning OpenRouterService")

        return OpenRouterService(api_key=api_key)

    from .gemini_service import GeminiService
    print("Returning GeminiService")
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
) -> str:
    service = _resolve_service(api_key, provider)
    schema_fields = response_schema_param or ["response"]
    return service.generate_response(
        prompt=prompt,
        api_key=api_key,
        model=model,
        system_instruction_string=system_instruction_string,
        response_schema_param=schema_fields,
        response_mime_type_param=response_mime_type_param,
    )


def generate_image(prompt: str, api_key: str, provider: Optional[str] = None):
    service = _resolve_service(api_key, provider)
    return service.generate_image(prompt=prompt, api_key=api_key)



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


class BaseAIService(ABC):
    """
    Base service for provider-specific implementations.
    """

    provider_name = PROVIDER_GEMINI
    default_model = ""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

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
    ) -> str:
        if not response_schema_param:
            return system_instruction_string

        schema_keys = ", ".join(response_schema_param)
        return (
            f"{system_instruction_string}\n"
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
    ) -> str:
        raise NotImplementedError

    def generate_image(self, prompt: str, api_key: Optional[str] = None):
        raise NotImplementedError(
            f"Image generation is not supported by {self.provider_name}."
        )



