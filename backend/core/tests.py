import base64
import tempfile
from unittest.mock import patch

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from django.test import TestCase, Client, override_settings
from django.urls import reverse

from core.crypto import get_private_key, get_public_key_payload
from core.helper import API_KEY_COOKIE_NAME, decrypt_api_key, encrypt_api_key


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
