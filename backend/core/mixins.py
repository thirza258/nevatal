import json
import logging

from django.conf import settings

from ai_service import generate_image, generate_response, test_api_key

logger = logging.getLogger(__name__)


class AIServiceMixin:
    """
    Compatibility helpers for tests and internal reuse.

    Lives outside views.py because views in every function app use it, and
    importing one app's views module from another only to reach a mixin ties
    the apps together for no reason.
    """

    default_provider = "gemini"

    def _default_api_key(self):
        return getattr(settings, "GEMINI_API_KEY", "")

    def generate_response(self, *args, **kwargs):
        kwargs.setdefault("api_key", self._default_api_key())
        kwargs.setdefault("provider", self.default_provider)
        kwargs.setdefault(
            "system_instruction_string",
            getattr(self, "default_system_instruction_string", "Answer this prompt make sure answer that"),
        )
        response = generate_response(*args, **kwargs)
        try:
            parsed = json.loads(response)
        except (TypeError, ValueError):
            return response

        if isinstance(parsed, dict) and set(parsed.keys()) == {"response"}:
            return parsed["response"]

        return response

    def test_api_key(self, *args, **kwargs):
        kwargs.setdefault("api_key", self._default_api_key())
        kwargs.setdefault("provider", self.default_provider)
        return test_api_key(*args, **kwargs)

    def generate_image(self, *args, **kwargs):
        kwargs.setdefault("api_key", self._default_api_key())
        kwargs.setdefault("provider", self.default_provider)
        return generate_image(*args, **kwargs)
