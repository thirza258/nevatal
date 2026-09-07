"""
Regressions for the security posture, not for any one feature.

Each test here stands for a specific way this app could leak or be abused, and
the comment on it says which. They are grouped in their own module because
they cut across views: what they are protecting is a property of the whole
backend rather than of one endpoint.
"""

from unittest.mock import patch

from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from rest_framework.throttling import SimpleRateThrottle

from core.helper import (
    API_KEY_COOKIE_NAME,
    MAX_UPLOAD_BYTES,
    encrypt_api_key,
    fingerprint_api_key,
    safe_upload_name,
    validate_upload,
)
from core.models import ChatRecord


class FakeUpload:
    """The parts of an uploaded file that `validate_upload` looks at."""

    def __init__(self, name, size, content_type):
        self.name = name
        self.size = size
        self.content_type = content_type


class StoredKeyTests(TestCase):
    """
    The provider key must not be recoverable from the database.

    It used to be written to `ChatRecord.api_key`, encrypted with a cipher
    derived from SECRET_KEY — so a database dump plus that secret produced live
    provider keys, and SECRET_KEY had a published default.
    """

    KEY = "sk-or-v1-secret-key-value"

    def test_the_key_is_not_a_column_at_all(self):
        columns = {field.name for field in ChatRecord._meta.get_fields()}
        self.assertNotIn("api_key", columns)
        self.assertIn("api_key_hash", columns)

    def test_writing_a_record_stores_a_fingerprint_and_not_the_key(self):
        record = ChatRecord.objects.create(
            method="prompt", prompt="p", response="r", api_key=self.KEY
        )

        record.refresh_from_db()
        self.assertEqual(record.api_key_hash, fingerprint_api_key(self.KEY))

        # Nothing anywhere in the row's stored values resembles the key.
        stored = ChatRecord.objects.filter(pk=record.pk).values().get()
        self.assertNotIn(
            self.KEY,
            " ".join(str(value) for value in stored.values()),
        )

    def test_an_encrypted_key_is_also_reduced_to_a_fingerprint(self):
        record = ChatRecord.objects.create(
            method="prompt", prompt="p", response="r",
            api_key=encrypt_api_key(self.KEY),
        )
        self.assertEqual(record.api_key_hash, fingerprint_api_key(self.KEY))

    def test_history_is_scoped_to_the_fingerprint(self):
        ChatRecord.objects.create(
            method="prompt", prompt="mine", response="r", api_key=self.KEY
        )
        ChatRecord.objects.create(
            method="prompt", prompt="someone else's", response="r",
            api_key="sk-or-v1-a-different-key",
        )

        client = Client()
        client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key(self.KEY)
        response = client.get(reverse("history"))

        self.assertEqual(response.status_code, 200)
        prompts = [entry["prompt"] for entry in response.data["data"]]
        self.assertEqual(prompts, ["mine"])


class CookieTests(TestCase):
    """
    The cookie carries a live credential, so its attributes are the whole
    defence: httpOnly against script access, Secure against plain HTTP, and
    SameSite=Strict against another site posting as the visitor — which is the
    only CSRF protection these endpoints have, since DRF exempts them.
    """

    KEY = "sk-or-v1-secret-key-value"

    def sign_in(self):
        with patch("core.views.test_api_key", return_value="valid"):
            return Client().get(
                reverse("api-key-check"),
                HTTP_AUTHORIZATION=f"Bearer {self.KEY}",
            )

    @override_settings(SECURE_COOKIES=True)
    def test_the_key_cookie_is_httponly_secure_and_strict(self):
        response = self.sign_in()

        self.assertEqual(response.status_code, 200)
        cookie = response.cookies[API_KEY_COOKIE_NAME]
        self.assertTrue(cookie["httponly"])
        self.assertTrue(cookie["secure"])
        self.assertEqual(cookie["samesite"], "Strict")

    @override_settings(SECURE_COOKIES=False)
    def test_the_secure_flag_follows_its_own_setting_not_debug(self):
        # These were tied together, so a stray DEBUG=True in production sent
        # the credential cookie over plain HTTP.
        self.assertFalse(self.sign_in().cookies[API_KEY_COOKIE_NAME]["secure"])

    def test_the_cookie_never_contains_the_raw_key(self):
        response = self.sign_in()
        for cookie in response.cookies.values():
            self.assertNotIn(self.KEY, cookie.value)


class ThrottleTests(TestCase):
    """
    Every endpoint is unauthenticated and most spend the caller's provider
    credit, so an open loop against one is both a denial of service and a bill.
    """

    def setUp(self):
        # Throttle counters live in the cache and would otherwise carry over.
        cache.clear()

    def tearDown(self):
        cache.clear()

    # `override_settings(REST_FRAMEWORK=...)` cannot reach this: DRF binds both
    # `APIView.throttle_classes` and `SimpleRateThrottle.THROTTLE_RATES` as
    # class attributes when it is imported, so the rate has to be patched on
    # the class the way the running app would have read it.
    @patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"anon": "3/min"})
    def test_an_unauthenticated_flood_is_cut_off(self):
        client = Client()
        codes = [
            client.post(
                reverse("prompt"), {"prompt": "hi"}, content_type="application/json"
            ).status_code
            for _ in range(6)
        ]

        self.assertIn(429, codes, f"no request was throttled: {codes}")
        # The limit bites after the configured number of requests, not before.
        self.assertEqual(codes.count(429), 3)


class UploadValidationTests(TestCase):
    """
    Neither parser streams: PyPDF2 reads a PDF into memory and pandas reads a
    CSV into a frame, so an unbounded upload is an unbounded allocation.
    """

    def test_a_file_over_the_limit_is_refused(self):
        error = validate_upload(
            FakeUpload("big.pdf", MAX_UPLOAD_BYTES + 1, "application/pdf"), "pdf"
        )
        self.assertIn("larger than", error)

    def test_an_empty_file_is_refused(self):
        self.assertIn(
            "empty", validate_upload(FakeUpload("e.pdf", 0, "application/pdf"), "pdf")
        )

    def test_an_unexpected_extension_is_refused(self):
        error = validate_upload(FakeUpload("payload.exe", 10, "application/pdf"), "pdf")
        self.assertIn("Only PDF", error)

    def test_a_mismatched_content_type_is_refused(self):
        error = validate_upload(FakeUpload("doc.pdf", 10, "image/png"), "pdf")
        self.assertIn("does not look like", error)

    def test_a_good_file_passes(self):
        self.assertIsNone(
            validate_upload(FakeUpload("report.pdf", 2048, "application/pdf"), "pdf")
        )
        self.assertIsNone(
            validate_upload(FakeUpload("data.csv", 2048, "text/csv"), ["pdf", "csv"])
        )

    def test_a_missing_file_is_refused(self):
        self.assertIn("required", validate_upload(None, "pdf"))


class UploadNameTests(TestCase):
    """
    Uploads are written into the same folder the RAG store keeps its own files
    in, and one of those is unpickled on read. A file that could be named
    `index.pkl` would put attacker-supplied bytes through `pickle.load`.
    """

    def test_the_reserved_index_name_cannot_be_claimed(self):
        self.assertNotEqual(safe_upload_name("index.pkl"), "index.pkl")
        self.assertNotEqual(safe_upload_name("meta.json"), "meta.json")

    def test_a_traversal_attempt_is_reduced_to_a_bare_name(self):
        self.assertEqual(safe_upload_name("../../../etc/passwd"), "passwd")
        self.assertNotIn("/", safe_upload_name("../../index.pkl"))

    def test_odd_characters_are_replaced(self):
        cleaned = safe_upload_name("re;port\n$(whoami).pdf")
        self.assertNotIn(";", cleaned)
        self.assertNotIn("\n", cleaned)
        self.assertNotIn("$", cleaned)
        self.assertTrue(cleaned.endswith(".pdf"))

    def test_a_dotfile_does_not_stay_hidden(self):
        self.assertFalse(safe_upload_name(".bashrc").startswith("."))

    def test_an_empty_name_gets_a_fallback(self):
        self.assertEqual(safe_upload_name(""), "upload")
        self.assertEqual(safe_upload_name(None), "upload")

    def test_a_very_long_name_is_trimmed(self):
        self.assertLessEqual(len(safe_upload_name("a" * 400 + ".pdf")), 130)


class SchemaExposureTests(TestCase):
    """
    The schema browsers enumerate every endpoint and field the API accepts.
    That is a development convenience, not something to publish.
    """

    def test_the_schema_is_not_mounted_in_production(self):
        # The URLconf is built at import time from DEBUG, so this asserts on
        # how the project is wired rather than by re-importing it: with DEBUG
        # off and SCHEMA_PUBLIC unset, the routes are absent.
        from django.urls import NoReverseMatch, reverse as reverse_url
        from django.conf import settings

        if settings.DEBUG:
            self.skipTest("DEBUG is on, so the schema is mounted on purpose.")

        with self.assertRaises(NoReverseMatch):
            reverse_url("swagger-ui")
