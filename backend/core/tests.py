import json
from unittest.mock import patch, MagicMock

from django.test import TestCase, Client, override_settings
from django.urls import reverse
from django.conf import settings

from core.helper import API_KEY_COOKIE_NAME, encrypt_api_key
from core.views import SummarizerView
from google.genai import types  # real types

import os
import unittest
from rest_framework.test import APITestCase
from django.urls import reverse

@override_settings(GEMINI_API_KEY="test-gemini-key")
class SummarizerViewTests(TestCase):

    def setUp(self):
        self.client = Client()
        self.url = reverse('summarizer')

    @patch('ai_service.gemini_service.genai.Client')  # only patch the Client class
    def test_generate_response_success(self, mock_client_class):
        """Test that generate_response correctly calls the Gemini API and returns text."""

        # Mock client instance and its method
        mock_client_instance = mock_client_class.return_value
        mock_generate_content = mock_client_instance.models.generate_content

        # Fake API response
        mock_response = MagicMock()
        mock_response.text = 'This is a mocked summary response.'
        mock_generate_content.return_value = mock_response

        # Run the method under test
        view = SummarizerView()
        prompt_text = "This is a long text to summarize."
        response_text = view.generate_response(prompt=prompt_text)

        # Assert Client is created with correct key
        mock_client_class.assert_called_once_with(api_key=settings.GEMINI_API_KEY)

        # Build expected arguments using real types
        expected_contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt_text)],
            )
        ]

        expected_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
            response_mime_type="application/json",
            response_schema=types.Schema(
                type=types.Type.OBJECT,
                required=["response"],
                properties={"response": types.Schema(type=types.Type.STRING)},
            ),
            system_instruction=[
                types.Part.from_text(
                    text="You are a highly skilled summarizer. Your task is to distill complex information into clear and concise insights."
                ),
            ],
        )

        mock_generate_content.assert_called_once_with(
            model="gemini-2.5-flash-lite",
            contents=expected_contents,
            config=expected_config,
        )

        self.assertEqual(response_text, 'This is a mocked summary response.')

@override_settings(GEMINI_API_KEY="test-gemini-key")
class SummarizerIntegrationTests(TestCase):

    def setUp(self):
        self.client = Client()
        self.url = reverse('summarizer')

    @patch('ai_service.gemini_service.genai.Client')
    def test_generate_response_string_return(self, mock_client_class):
        """Integration test: actually call Gemini and ensure response is a string."""
        mock_client_instance = mock_client_class.return_value
        mock_generate_content = mock_client_instance.models.generate_content

        mock_response = MagicMock()
        mock_response.text = 'This is a mocked summary response.'
        mock_generate_content.return_value = mock_response

        view = SummarizerView()
        prompt_text = "This is a long text to summarize."
        response_text = view.generate_response(prompt=prompt_text)

        self.assertIsInstance(response_text, str)
        self.assertGreater(len(response_text), 0, "Response should not be empty")

    @unittest.skipUnless(os.getenv("RUN_GEMINI_TESTS") == "1", "Integration test skipped")
    def test_post_summary_returns_string(self):
        """
        Integration test: send POST to SummarizerView and ensure response contains a string.
        """
        url = reverse("summarizer")  # make sure your urls.py has name="summarizer"
        data = {"prompt": "This is a long text to summarize."}

        response = self.client.post(url, data, format="json")

        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "success")
        self.assertIn("data", response.data)
        self.assertIsInstance(response.data["data"], str)
        self.assertGreater(len(response.data["data"]), 0, "Summary should not be empty")

    def test_missing_prompt_returns_400(self):
        """If 'prompt' is missing, should return 400 with error message."""
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "A 'prompt' is required in the request body.")

    @patch("core.views.generate_response", side_effect=Exception("Boom"))
    def test_ai_error_returns_500(self, mock_generate_response):
        """If Gemini API raises exception, should return 500 with generic error."""

        response = self.client.post(self.url, {"prompt": "Cause error"}, format="json")

        self.assertEqual(response.status_code, 500)
        self.assertIn("error", response.data)
        self.assertEqual(
            response.data["error"],
            "An unexpected error occurred while processing your request."
        )


class ApiKeyCookieTests(TestCase):
    def setUp(self):
        self.client = Client()

    @patch("core.views.test_api_key", return_value="valid")
    def test_api_key_check_sets_http_only_cookie(self, mock_test_api_key):
        response = self.client.get(
            reverse("api-key-check"),
            HTTP_AUTHORIZATION="Bearer raw-key",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies.get(API_KEY_COOKIE_NAME))
        self.assertTrue(response.cookies[API_KEY_COOKIE_NAME]["httponly"])
        self.assertTrue(mock_test_api_key.called)

    @patch("core.views.generate_response", return_value='{"response": "cookie auth works"}')
    @patch("core.views.test_api_key", return_value="valid")
    def test_cookie_auth_allows_prompt_requests(self, mock_test_api_key, mock_generate_response):
        self.client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key("raw-key")

        response = self.client.post(
            reverse("prompt"),
            {"prompt": "Hello"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "success")
        self.assertEqual(response.data["data"], '{"response": "cookie auth works"}')
        self.assertTrue(mock_generate_response.called)

    def test_api_key_clear_deletes_cookie(self):
        response = self.client.post(reverse("api-key-clear"))

        self.assertEqual(response.status_code, 200)
        self.assertIn(API_KEY_COOKIE_NAME, response.cookies)
        self.assertEqual(response.cookies[API_KEY_COOKIE_NAME]["max-age"], 0)
