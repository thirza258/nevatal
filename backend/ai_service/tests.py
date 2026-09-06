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


class ConversationTests(SimpleTestCase):
    """
    A thread is replayed to the provider, but not without limit: the browser
    resends it on every turn, so this is where the token bill is bounded.
    """

    def test_only_usable_turns_survive(self):
        from ai_service import normalize_conversation

        turns = normalize_conversation(
            [
                {"role": "user", "content": " hello "},
                {"role": "system", "content": "not a turn this app sends"},
                {"role": "assistant", "content": ""},
                {"role": "assistant", "text": "an older client's key"},
                "not a dict at all",
                {"role": "user", "content": 42},
            ]
        )

        self.assertEqual(
            turns,
            [
                {"role": "user", "content": "hello"},
                {"role": "assistant", "content": "an older client's key"},
            ],
        )

    def test_a_long_thread_keeps_its_most_recent_turns(self):
        from ai_service import normalize_conversation
        from ai_service.ai_service import CONVERSATION_TURN_LIMIT

        turns = normalize_conversation(
            [{"role": "user", "content": f"turn {index}"} for index in range(60)]
        )

        self.assertEqual(len(turns), CONVERSATION_TURN_LIMIT)
        self.assertEqual(turns[-1]["content"], "turn 59")

    def test_a_thread_is_trimmed_to_a_character_budget(self):
        from ai_service import normalize_conversation
        from ai_service.ai_service import CONVERSATION_CHARACTER_LIMIT

        turns = normalize_conversation(
            [{"role": "user", "content": "x" * 20_000} for _ in range(5)]
        )

        self.assertEqual(len(turns), 1)
        self.assertLessEqual(
            sum(len(turn["content"]) for turn in turns),
            CONVERSATION_CHARACTER_LIMIT,
        )


class OutputFormatTests(SimpleTestCase):
    def test_a_known_format_adds_a_directive(self):
        from ai_service.ai_service import apply_output_format

        instruction = apply_output_format("Summarise this.", "csv")

        self.assertIn("Summarise this.", instruction)
        self.assertIn("CSV", instruction)

    def test_an_unknown_format_changes_nothing(self):
        from ai_service.ai_service import apply_output_format

        self.assertEqual(apply_output_format("Summarise this.", "xml"), "Summarise this.")
        self.assertEqual(apply_output_format("Summarise this.", ""), "Summarise this.")

    def test_the_format_survives_the_json_envelope(self):
        from ai_service.openrouter_service import OpenRouterService

        instruction = OpenRouterService().build_response_instruction(
            "Summarise this.", ["response"], "table"
        )

        self.assertIn("Markdown table", instruction)
        self.assertIn("must contain these string keys: response", instruction)


class UsageTests(SimpleTestCase):
    def setUp(self):
        clear_models_cache()
        self.addCleanup(clear_models_cache)

    @patch("ai_service.openrouter_service.requests.get")
    def test_a_call_is_priced_from_the_catalogue(self, mock_get):
        mock_get.return_value = catalogue_response()
        service = OpenRouterService(api_key="sk-or-key")

        # 1M in at $0.15/M and 1M out at $0.60/M.
        cost = service.estimate_cost("openai/gpt-4o-mini", 1_000_000, 1_000_000)

        self.assertAlmostEqual(cost, 0.75)

    @patch("ai_service.openrouter_service.requests.get")
    def test_an_unknown_model_is_not_priced_as_free(self, mock_get):
        mock_get.return_value = catalogue_response()
        service = OpenRouterService(api_key="sk-or-key")

        self.assertIsNone(service.estimate_cost("someone/unlisted", 1000, 1000))

    def test_a_provider_without_prices_reports_no_cost(self):
        from ai_service.gemini_service import GeminiService

        self.assertIsNone(GeminiService().estimate_cost("gemini-2.5-flash-lite", 10, 10))

    def test_usage_adds_up_across_the_calls_of_one_request(self):
        from ai_service import empty_usage, sum_usage

        first = {"model": "m", "tokens_in": 100, "tokens_out": 20, "cost": 0.001}
        second = {"model": "m", "tokens_in": 50, "tokens_out": 10, "cost": 0.0005}

        total = sum_usage(sum_usage(empty_usage("m"), first), second)

        self.assertEqual(total["tokens_in"], 150)
        self.assertEqual(total["tokens_out"], 30)
        self.assertAlmostEqual(total["cost"], 0.0015)

    def test_nothing_reported_stays_nothing_rather_than_zero(self):
        from ai_service import empty_usage, sum_usage

        total = sum_usage(empty_usage("m"), empty_usage("m"))

        self.assertIsNone(total["tokens_in"])
        self.assertIsNone(total["cost"])
