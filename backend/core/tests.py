import base64
import tempfile
from unittest.mock import patch

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from django.test import TestCase, Client, override_settings
from django.urls import reverse

from ai_service import empty_usage
from core.crypto import get_private_key, get_public_key_payload
from core.helper import API_KEY_COOKIE_NAME, decrypt_api_key, encrypt_api_key
from core.models import ChatRecord


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

    @patch(
        "core.views.generate_response_with_usage",
        return_value=('{"response": "cookie auth works"}', empty_usage("a-model")),
    )
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


OAEP = padding.OAEP(
    mgf=padding.MGF1(algorithm=hashes.SHA256()),
    algorithm=hashes.SHA256(),
    label=None,
)


class ApiKeyTransportEncryptionTests(TestCase):
    """The provider key is wrapped in the browser and only opened here."""

    def setUp(self):
        self.client = Client()

        # A generated key must land in a temp directory, never in the repo's
        # media/, and must not leak between tests through the lru_cache.
        self._media = tempfile.TemporaryDirectory()
        self.addCleanup(self._media.cleanup)
        media_root = override_settings(MEDIA_ROOT=self._media.name, API_KEY_PRIVATE_KEY="")
        media_root.enable()
        self.addCleanup(media_root.disable)

        get_private_key.cache_clear()
        self.addCleanup(get_private_key.cache_clear)

    def wrap(self, api_key):
        """Do what the browser does: fetch the public key, encrypt, prefix."""
        payload = self.client.get(reverse("public-key")).data["data"]

        public_key = serialization.load_der_public_key(
            base64.b64decode(payload["public_key"])
        )
        ciphertext = public_key.encrypt(api_key.encode("utf-8"), OAEP)

        return f"rsa:{payload['key_id']}:{base64.b64encode(ciphertext).decode('ascii')}"

    def test_public_key_endpoint_publishes_an_importable_key(self):
        response = self.client.get(reverse("public-key"))

        self.assertEqual(response.status_code, 200)
        payload = response.data["data"]
        self.assertEqual(payload["algorithm"], "RSA-OAEP-SHA256")
        self.assertEqual(payload["key_id"], get_public_key_payload()["key_id"])

        public_key = serialization.load_der_public_key(
            base64.b64decode(payload["public_key"])
        )
        self.assertGreaterEqual(public_key.key_size, 3072)

    def test_a_wrapped_key_unwraps_to_the_original(self):
        raw = "AIzaSy-not-a-real-gemini-key"

        header = self.wrap(raw)

        self.assertNotIn(raw, header, "the raw key must not appear in the header")
        self.assertEqual(decrypt_api_key(f"Bearer {header}"), raw)

    def test_a_long_provider_key_still_fits(self):
        raw = "sk-proj-" + "x" * 300

        self.assertEqual(decrypt_api_key(self.wrap(raw)), raw)

    @patch("core.views.test_api_key", return_value="valid")
    def test_api_key_check_accepts_a_wrapped_key_and_sets_the_cookie(self, mock_test_api_key):
        response = self.client.get(
            reverse("api-key-check"),
            HTTP_AUTHORIZATION=f"Bearer {self.wrap('raw-key')}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies[API_KEY_COOKIE_NAME]["httponly"])
        # The provider is checked with the unwrapped key, not the ciphertext.
        self.assertEqual(mock_test_api_key.call_args.args[0], "raw-key")

    def test_a_key_wrapped_for_another_backend_is_refused(self):
        stranger = rsa.generate_private_key(public_exponent=65537, key_size=3072)
        ciphertext = stranger.public_key().encrypt(b"raw-key", OAEP)
        header = f"rsa:{get_public_key_payload()['key_id']}:{base64.b64encode(ciphertext).decode()}"

        self.assertEqual(decrypt_api_key(header), "")

    def test_a_stale_key_id_is_refused_rather_than_guessed(self):
        header = self.wrap("raw-key").split(":", 2)
        stale = f"rsa:0000000000000000:{header[2]}"

        self.assertEqual(decrypt_api_key(stale), "")

    def test_malformed_ciphertext_reads_as_no_key(self):
        for header in ("rsa:", "rsa:abc", "rsa:abc:not-base64!", "rsa::"):
            with self.subTest(header=header):
                self.assertEqual(decrypt_api_key(header), "")

    def test_unwrapped_and_cookie_keys_still_work(self):
        self.assertEqual(decrypt_api_key("Bearer raw-key"), "raw-key")
        self.assertEqual(decrypt_api_key(encrypt_api_key("raw-key")), "raw-key")

    def test_the_generated_key_is_reused_across_restarts(self):
        first = get_public_key_payload()["key_id"]

        get_private_key.cache_clear()  # a fresh process reading the same volume

        self.assertEqual(get_public_key_payload()["key_id"], first)


class ModelSelectionTests(TestCase):
    """
    The catalogue endpoint, and the model a session picks from it.

    The picked model rides `X-AI-Model` on every generation: it is a model id,
    not a credential, so it needs none of the key's encryption.
    """

    def setUp(self):
        self.client = Client()
        self.client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key("sk-or-v1-key")

    def test_the_catalogue_needs_a_session(self):
        anonymous = Client()

        response = anonymous.get(reverse("models"))

        self.assertEqual(response.status_code, 401)

    @patch("core.views.list_models")
    def test_the_catalogue_is_read_for_the_session_key(self, mock_list_models):
        mock_list_models.return_value = {
            "provider": "openrouter",
            "default_model": "openai/gpt-4o-mini",
            "models": [{"id": "openai/gpt-4o-mini"}],
        }

        response = self.client.get(reverse("models"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["provider"], "openrouter")
        self.assertEqual(len(response.data["data"]["models"]), 1)
        # The key decides which provider is asked, not what the browser claims.
        self.assertEqual(mock_list_models.call_args.kwargs["api_key"], "sk-or-v1-key")

    @patch("core.views.list_models", side_effect=RuntimeError("openrouter is down"))
    def test_an_unreachable_catalogue_is_not_an_empty_one(self, mock_list_models):
        response = self.client.get(reverse("models"))

        self.assertEqual(response.status_code, 502)

    @patch("ai_service.ai_service.get_ai_service")
    def test_the_picked_model_reaches_the_provider(self, mock_get_ai_service):
        mock_get_ai_service.return_value.generate_response.return_value = (
            '{"response": "answered by the picked model"}'
        )

        response = self.client.post(
            reverse("prompt"),
            {"prompt": "Hello"},
            HTTP_X_AI_MODEL="anthropic/claude-sonnet-4",
        )

        self.assertEqual(response.status_code, 200)
        service = mock_get_ai_service.return_value
        self.assertEqual(
            service.generate_response.call_args.kwargs["model"],
            "anthropic/claude-sonnet-4",
        )

    @patch("ai_service.ai_service.get_ai_service")
    def test_a_session_that_picked_nothing_runs_on_the_provider_default(self, mock_get_ai_service):
        mock_get_ai_service.return_value.generate_response.return_value = (
            '{"response": "answered by the default model"}'
        )

        response = self.client.post(reverse("prompt"), {"prompt": "Hello"})

        self.assertEqual(response.status_code, 200)
        service = mock_get_ai_service.return_value
        # Falsy reaches normalize_model(), which is where each provider's
        # default lives.
        self.assertFalse(service.generate_response.call_args.kwargs["model"])

    @patch("ai_service.ai_service.get_ai_service")
    def test_a_header_that_cannot_be_a_model_id_is_ignored(self, mock_get_ai_service):
        mock_get_ai_service.return_value.generate_response.return_value = (
            '{"response": "answered by the default model"}'
        )

        for header in ("not a model id", "x" * 500, "   "):
            with self.subTest(header=header):
                response = self.client.post(
                    reverse("prompt"),
                    {"prompt": "Hello"},
                    HTTP_X_AI_MODEL=header,
                )

                self.assertEqual(response.status_code, 200)
                service = mock_get_ai_service.return_value
                self.assertEqual(service.generate_response.call_args.kwargs["model"], "")


class GenerationOptionsTests(TestCase):
    """
    The knobs a request carries: the thread, the output format, and whether it
    is one item of a batch run.
    """

    def setUp(self):
        self.client = Client()
        self.client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key("sk-or-v1-key")

    def service(self, mock_get_ai_service, usage=None):
        service = mock_get_ai_service.return_value
        service.generate_response.return_value = '{"response": "answered"}'
        service.describe_usage.return_value = usage or {
            "model": "openai/gpt-4o-mini",
            "tokens_in": 120,
            "tokens_out": 45,
            "cost": 0.000045,
        }
        return service

    @patch("ai_service.ai_service.get_ai_service")
    def test_a_thread_is_replayed_to_the_provider(self, mock_get_ai_service):
        service = self.service(mock_get_ai_service)

        response = self.client.post(
            reverse("prompt"),
            {
                "prompt": "and the second?",
                "conversation": [
                    {"role": "user", "content": "name a colour"},
                    {"role": "assistant", "content": "blue"},
                ],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        conversation = service.generate_response.call_args.kwargs["conversation"]
        self.assertEqual(
            conversation,
            [
                {"role": "user", "content": "name a colour"},
                {"role": "assistant", "content": "blue"},
            ],
        )

    @patch("ai_service.ai_service.get_ai_service")
    def test_a_junk_thread_is_dropped_rather_than_forwarded(self, mock_get_ai_service):
        service = self.service(mock_get_ai_service)

        response = self.client.post(
            reverse("prompt"),
            {
                "prompt": "hello",
                "conversation": ["not a turn", {"role": "system", "content": "nope"}],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(service.generate_response.call_args.kwargs["conversation"], [])

    @patch("ai_service.ai_service.get_ai_service")
    def test_the_requested_output_format_reaches_the_provider(self, mock_get_ai_service):
        service = self.service(mock_get_ai_service)

        response = self.client.post(
            reverse("summarizer"),
            {"prompt": "some text", "output_format": "CSV"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(service.generate_response.call_args.kwargs["output_format"], "csv")

    @patch("ai_service.ai_service.get_ai_service")
    def test_what_a_generation_consumed_is_recorded(self, mock_get_ai_service):
        self.service(mock_get_ai_service)

        self.client.post(reverse("prompt"), {"prompt": "Hello"})

        record = ChatRecord.objects.latest("created_at")
        self.assertEqual(record.model, "openai/gpt-4o-mini")
        self.assertEqual(record.tokens_in, 120)
        self.assertEqual(record.tokens_out, 45)
        self.assertAlmostEqual(record.cost, 0.000045)
        self.assertFalse(record.batch)

    @patch("core.views.describe_account", return_value=None)
    @patch("ai_service.ai_service.get_ai_service")
    def test_batch_items_are_counted_but_stay_out_of_history(
        self, mock_get_ai_service, mock_describe_account
    ):
        self.service(mock_get_ai_service)

        self.client.post(reverse("prompt"), {"prompt": "one of fifty"}, HTTP_X_NEVATAL_BATCH="1")
        self.client.post(reverse("prompt"), {"prompt": "a real question"})

        self.assertEqual(ChatRecord.objects.filter(batch=True).count(), 1)

        history = self.client.get(reverse("history")).data["data"]
        self.assertEqual([row["prompt"] for row in history], ["a real question"])

        # ...but the batch row still counts towards what the key has spent.
        totals = self.client.get(reverse("usage")).data["data"]["totals"]
        self.assertEqual(totals["requests"], 2)
        self.assertEqual(totals["tokens_in"], 240)


class KeySlotTests(TestCase):
    """
    Several keys in one session: one active, the rest spares to rotate onto.
    """

    def setUp(self):
        self.client = Client()

    @patch("core.views.test_api_key", return_value="valid")
    def sign_in(self, api_key, mock_test_api_key):
        return self.client.get(
            reverse("openrouter-api-key-check"),
            HTTP_AUTHORIZATION=f"Bearer {api_key}",
        )

    @patch("core.views.test_api_key", return_value="valid")
    def add_key(self, api_key, mock_test_api_key, label=None):
        return self.client.post(
            reverse("keys"),
            {"label": label} if label else {},
            HTTP_AUTHORIZATION=f"Bearer {api_key}",
        )

    def test_signing_in_fills_the_first_slot(self):
        self.sign_in("sk-or-v1-first-key-for-this-session")

        slots = self.client.get(reverse("keys")).data["data"]["slots"]

        self.assertEqual(len(slots), 1)
        self.assertTrue(slots[0]["active"])
        self.assertEqual(slots[0]["provider"], "openrouter")

    def test_a_key_is_only_ever_shown_masked(self):
        raw = "sk-or-v1-a-secret-value-nobody-should-see"
        self.sign_in(raw)

        slots = self.client.get(reverse("keys")).data["data"]["slots"]

        self.assertNotIn(raw, str(slots))
        self.assertNotIn("secret", slots[0]["masked"])
        self.assertTrue(slots[0]["masked"].startswith("sk-or-v1-a"))

    def test_a_spare_does_not_take_over_a_working_session(self):
        self.sign_in("sk-or-v1-the-original-session-key")
        self.add_key("sk-or-v1-a-spare-for-later", label="Spare")

        data = self.client.get(reverse("keys")).data["data"]

        self.assertEqual([slot["active"] for slot in data["slots"]], [True, False])
        self.assertEqual(data["slots"][1]["label"], "Spare")

    def test_rotating_moves_to_the_next_key_and_wraps(self):
        self.sign_in("sk-or-v1-the-original-session-key")
        self.add_key("sk-or-v1-a-spare-for-later")

        first = self.client.post(reverse("key-rotate")).data["data"]
        self.assertEqual(first["active_index"], 1)

        second = self.client.post(reverse("key-rotate")).data["data"]
        self.assertEqual(second["active_index"], 0)

    def test_rotating_a_single_key_session_says_so(self):
        self.sign_in("sk-or-v1-the-only-key-there-is")

        response = self.client.post(reverse("key-rotate"))

        self.assertEqual(response.status_code, 409)

    def test_switching_picks_a_slot_directly(self):
        self.sign_in("sk-or-v1-the-original-session-key")
        self.add_key("sk-or-v1-a-spare-for-later")

        response = self.client.post(reverse("key-switch"), {"index": 1})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["active_index"], 1)
        self.assertEqual(self.client.post(reverse("key-switch"), {"index": 7}).status_code, 400)

    def test_removing_the_last_key_ends_the_session(self):
        self.sign_in("sk-or-v1-the-only-key-there-is")

        response = self.client.delete(reverse("key", args=[0]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["slots"], [])
        self.assertEqual(response.cookies[API_KEY_COOKIE_NAME]["max-age"], 0)

    def test_clearing_the_key_takes_the_spares_with_it(self):
        self.sign_in("sk-or-v1-the-original-session-key")
        self.add_key("sk-or-v1-a-spare-for-later")

        self.client.post(reverse("api-key-clear"))

        self.assertEqual(self.client.get(reverse("keys")).data["data"]["slots"], [])

    @patch("core.views.test_api_key", return_value=False)
    def test_a_key_that_cannot_generate_is_not_kept(self, mock_test_api_key):
        response = self.client.post(
            reverse("keys"),
            HTTP_AUTHORIZATION="Bearer sk-or-v1-a-key-that-does-not-work",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.client.get(reverse("keys")).data["data"]["slots"], [])
