"""Exercise tool routing through the real providers, faking only SDK calls."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.urls import reverse

from ai_service import empty_usage
from core.models import ChatRecord


class ToolContextTests(TestCase):
    def test_each_text_endpoint_sends_its_own_system_context_to_every_provider(self):
        cases = [
            ("prompt", "Prompt", {}),
            ("explainer", "Explainer", {}),
            ("writer", "Writer", {}),
            ("rewriter", "Rewriter", {}),
            ("proofreader", "Proofreader", {}),
            ("summarizer", "Summarizer", {}),
            ("translator", "Translator", {"source_language": "English", "target_language": "French"}),
            ("sentiment-analyzer", "Sentiment Analysis", {}),
            ("copywriting", "Copywriting", {}),
            ("email", "Email Builder", {"context": "Launch on Monday", "recipients": "Team", "sender": "Alex"}),
            ("social-media-post-generator", "Social Caption", {"platform": "LinkedIn", "tone": "professional", "include_emojis": False, "hashtag_count": 0}),
            ("idea-generator", "Idea Generator", {"kind": "names", "count": 3}),
            ("data-formatter", "Data Formatter", {"mode": "validate"}),
            ("data-analysis", "Data Analysis", {"text": "region,units\nNorth,10\nSouth,4"}),
        ]
        source = "CURRENT SOURCE: keep the deadline Monday and use the selected formal tone."
        reply = '{"response":"Current tool result"}'

        for key, provider in (("AIza-test-key", "gemini"), ("sk-test-key", "openai"), ("sk-or-v1-test-key", "openrouter")):
            llm = MagicMock()
            llm.invoke.return_value = SimpleNamespace(content=reply, usage_metadata={}, response_metadata={})
            with (
                patch("ai_service.gemini_service.genai.Client") as gemini,
                patch("ai_service.openai_service.OpenAIService._build_llm", return_value=llm),
                patch("ai_service.openrouter_service.OpenRouterService._build_llm", return_value=llm),
            ):
                generate = gemini.return_value.models.generate_content
                generate.return_value = SimpleNamespace(text=reply, usage_metadata=None)
                for endpoint, name, options in cases:
                    with self.subTest(provider=provider, tool=name):
                        response = self.client.post(
                            reverse(endpoint), {"prompt": source, **options},
                            content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {key}",
                        )
                        self.assertEqual(response.status_code, 200, response.data)
                        if provider == "gemini":
                            call = generate.call_args.kwargs
                            instruction = call["config"].system_instruction[0].text
                            prompt = call["contents"][-1].parts[0].text
                        else:
                            messages = llm.invoke.call_args.args[0]
                            instruction, prompt = messages[0].content, messages[-1].content
                            self.assertEqual(messages[0].type, "system")
                            self.assertEqual(messages[-1].type, "human")

                        self.assertTrue(instruction.startswith(f"You are the {name} tool in Nevatal."))
                        self.assertIn(source, prompt)
                        self.assertNotIn(source, instruction, "source text was promoted into a system instruction")
                        self.assertIn("current settings and source content", instruction)
                        self.assertIn("Do not invent", instruction)
                        if endpoint == "rewriter":
                            self.assertIn("persuasive only when requested", instruction)
                        if endpoint == "proofreader":
                            self.assertIn("Leave correct text unchanged", instruction)
                        if endpoint == "translator":
                            self.assertIn("into French from English", instruction)
                        if endpoint == "data-formatter":
                            self.assertIn("Do not return a corrected copy", instruction)

    @patch("ai_service.ai_service.get_ai_service")
    def test_batch_uses_the_selected_tool_and_does_not_replay_other_jobs(self, get_service):
        service = get_service.return_value
        service.generate_response.return_value = '{"response":"rewritten"}'
        service.describe_usage.return_value = empty_usage("test-model")
        for source in ("First source", "Second source"):
            response = self.client.post(
                reverse("rewriter"), {"prompt": source}, content_type="application/json",
                HTTP_AUTHORIZATION="Bearer sk-test-key", HTTP_X_NEVATAL_BATCH="1",
            )
            self.assertEqual(response.status_code, 200)
            call = service.generate_response.call_args.kwargs
            self.assertIn("Rewriter tool", call["system_instruction_string"])
            self.assertEqual(call["prompt"], source)
            self.assertEqual(call["conversation"], [])
        self.assertEqual(ChatRecord.objects.filter(batch=True, method="rewriter").count(), 2)

    @patch("document_function.views.RAGIndex")
    @patch("ai_service.ai_service.get_ai_service")
    def test_document_answers_are_bound_to_current_passages_and_real_document_ids(self, get_service, index):
        index.return_value.retrieve_chunks.return_value = [
            {"document_id": 7, "source": "current.pdf", "text": "The deadline is Monday."},
            {"document_id": 7, "source": "current.pdf", "text": "The budget is 50."},
        ]
        service = get_service.return_value
        service.generate_response.return_value = '{"response":"Monday (current.pdf, document 7)"}'
        service.describe_usage.return_value = empty_usage("test-model")
        response = self.client.post(
            reverse("rag-chat"), {
                "prompt": "What is the deadline?", "document_ids": [7],
                "conversation": [{"role": "assistant", "content": "Old answer said Friday."}],
            }, content_type="application/json", HTTP_AUTHORIZATION="Bearer AIza-test-key",
        )
        self.assertEqual(response.status_code, 200)
        index.return_value.retrieve_chunks.assert_called_once_with("What is the deadline?", k=3, document_ids=[7])
        call = service.generate_response.call_args.kwargs
        self.assertIn("Document 7 (current.pdf): The deadline is Monday.", call["prompt"])
        self.assertNotIn("Document 1", call["prompt"])
        self.assertIn("Earlier assistant replies are not evidence", call["system_instruction_string"])
        self.assertIn("do not provide enough information", call["system_instruction_string"])
        self.assertEqual(response.data["sources"], [{"document_id": 7, "source": "current.pdf"}])

    @patch("document_function.views.RAGIndex")
    @patch("ai_service.ai_service.get_ai_service")
    def test_empty_document_selection_does_not_generate_an_ungrounded_answer(self, get_service, index):
        index.return_value.retrieve_chunks.return_value = []
        response = self.client.post(
            reverse("rag-chat"), {"prompt": "What is the deadline?", "document_ids": []},
            content_type="application/json", HTTP_AUTHORIZATION="Bearer AIza-test-key",
        )
        self.assertEqual(response.status_code, 422)
        get_service.assert_not_called()
