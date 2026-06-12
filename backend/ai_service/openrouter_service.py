import logging
import os
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from .ai_service import BaseAIService, PROVIDER_OPENROUTER

logger = logging.getLogger(__name__)

try:
    from langchain_openrouter import ChatOpenRouter
except Exception:  # pragma: no cover - fallback for environments without the package
    ChatOpenRouter = None


class OpenRouterService(BaseAIService):
    provider_name = PROVIDER_OPENROUTER
    default_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

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
    ) -> str:
        try:
            key = self.resolve_api_key(api_key)
            llm = self._build_llm(key, model)
            instruction = self.build_response_instruction(
                system_instruction_string,
                response_schema_param,
            )
            response = llm.invoke(
                [
                    SystemMessage(content=instruction),
                    HumanMessage(content=prompt),
                ]
            )
            response_text = self.coerce_text(response)
            return self.ensure_json_response(response_text, response_schema_param)
        except Exception as e:
            logger.error(f"An error occurred during OpenRouter API call: {e}")
            raise
