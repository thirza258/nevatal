"""
Provider behaviour that needs no request: the OpenRouter model catalogue, and
what the providers without one report instead.
"""

from unittest.mock import Mock, patch

import requests
from django.test import SimpleTestCase

from ai_service import list_models
from ai_service.openrouter_service import OpenRouterService, clear_models_cache

# Three entries in the shape `GET /models` answers with: one priced, one free,
# and one with no id, which is not a model anyone can be pointed at.
CATALOGUE = {
    "data": [
        {
            "id": "openai/gpt-4o-mini",
            "name": "OpenAI: GPT-4o mini",
            "description": "A paragraph of prose a picker has no room for.",
            "context_length": 128000,
            "architecture": {"modality": "text+image->text"},
            "pricing": {
                "prompt": "0.00000015",
                "completion": "0.0000006",
                "web_search": "0.008",
            },
            "top_provider": {"context_length": 128000},
        },
        {
            "id": "meta-llama/llama-3.3-8b-instruct:free",
            "name": "Meta: Llama 3.3 8B Instruct (free)",
            "context_length": None,
            "architecture": {"modality": "text->text"},
            "pricing": {"prompt": "0", "completion": "0"},
            "top_provider": {"context_length": 8192},
        },
        {"id": "", "name": "Not a model", "pricing": {}},
    ]
}


def catalogue_response(payload=None):
    response = Mock()
    response.json.return_value = CATALOGUE if payload is None else payload
    response.raise_for_status.return_value = None
    return response


class OpenRouterCatalogueTests(SimpleTestCase):
    """`GET /models` is public, so the catalogue needs no key of its own."""

    def setUp(self):
        # The catalogue is cached for the whole process; a leftover entry would
        # let one test answer another's request.
        clear_models_cache()
        self.addCleanup(clear_models_cache)

    @patch("ai_service.openrouter_service.requests.get")
    def test_an_openrouter_key_gets_the_whole_catalogue(self, mock_get):
        mock_get.return_value = catalogue_response()

        catalogue = list_models(api_key="sk-or-v1-not-a-real-key")

        self.assertEqual(catalogue["provider"], "openrouter")
        self.assertEqual(catalogue["default_model"], OpenRouterService.default_model)

        url = mock_get.call_args.args[0]
        self.assertEqual(url, "https://openrouter.ai/api/v1/models")
        self.assertIn("timeout", mock_get.call_args.kwargs)

        # Ids read vendor/model, so sorting by id groups a vendor together.
        self.assertEqual(
            [model["id"] for model in catalogue["models"]],
            ["meta-llama/llama-3.3-8b-instruct:free", "openai/gpt-4o-mini"],
        )

    @patch("ai_service.openrouter_service.requests.get")
    def test_prices_are_converted_to_dollars_per_million_tokens(self, mock_get):
        mock_get.return_value = catalogue_response()

        models = {model["id"]: model for model in list_models(api_key="sk-or-key")["models"]}

        paid = models["openai/gpt-4o-mini"]
        # The catalogue quotes per token: "0.00000015" is 15c per million.
        self.assertEqual(paid["prompt_price_per_million"], 0.15)
        self.assertEqual(paid["completion_price_per_million"], 0.6)
        self.assertFalse(paid["is_free"])

        free = models["meta-llama/llama-3.3-8b-instruct:free"]
        self.assertEqual(free["prompt_price_per_million"], 0.0)
        self.assertTrue(free["is_free"])

    @patch("ai_service.openrouter_service.requests.get")
    def test_entries_are_trimmed_and_unusable_ones_dropped(self, mock_get):
        mock_get.return_value = catalogue_response()

        models = list_models(api_key="sk-or-key")["models"]

        self.assertEqual(len(models), 2, "the entry with no id is not a model")
        self.assertNotIn(
            "description",
            models[1],
            "prose is the bulk of a 700KB catalogue and no use to a picker",
        )
        self.assertEqual(
            models[1]["context_length"],
            128000,
        )
        self.assertEqual(
            models[0]["context_length"],
            8192,
            "a missing context length falls back to the top provider's",
        )
        self.assertEqual(models[1]["modality"], "text+image->text")

    @patch("ai_service.openrouter_service.requests.get")
    def test_the_catalogue_is_fetched_once_for_the_process(self, mock_get):
        mock_get.return_value = catalogue_response()

        first = list_models(api_key="sk-or-key")["models"]
        second = list_models(api_key="sk-or-another-key")["models"]

        self.assertEqual(mock_get.call_count, 1)
        self.assertEqual(first, second)

    @patch("ai_service.openrouter_service.requests.get")
    def test_an_unreachable_catalogue_raises_rather_than_reporting_none(self, mock_get):
        mock_get.side_effect = requests.RequestException("openrouter is down")

        # An empty list would read as "this provider has no models"; the view
        # turns the failure into a "list unavailable" response instead.
        with self.assertRaises(requests.RequestException):
            list_models(api_key="sk-or-key")

    @patch("ai_service.openrouter_service.requests.get")
    def test_a_gemini_key_has_no_catalogue_to_offer(self, mock_get):
        catalogue = list_models(api_key="AIza-not-a-real-gemini-key")

        self.assertEqual(catalogue["provider"], "gemini")
        self.assertEqual(catalogue["models"], [])
        self.assertEqual(catalogue["default_model"], "gemini-2.5-flash-lite")
        mock_get.assert_not_called()
