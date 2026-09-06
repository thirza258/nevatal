import logging
import os
from typing import Optional

from langchain_openai import ChatOpenAI

from .ai_service import BaseAIService, PROVIDER_OPENAI
from .langchain_messages import build_messages

logger = logging.getLogger(__name__)


class OpenAIService(BaseAIService):
    provider_name = PROVIDER_OPENAI
    default_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def _build_llm(self, api_key: str, model: Optional[str] = None):
        model_name = self.normalize_model(model)
        base_kwargs = {
            "model": model_name,
            "temperature": 0,
        }

        for key_name in ("api_key", "openai_api_key"):
            try:
                return ChatOpenAI(**base_kwargs, **{key_name: api_key})
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
            logger.error(f"An error occurred during OpenAI API call: {e}")
            raise
