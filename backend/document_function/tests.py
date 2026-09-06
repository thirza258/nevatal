from django.test import TestCase

# Create your tests here.
"""Data analysis: the model chooses the charts, pandas computes them."""

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse

from ai_service import empty_usage
from core.helper import API_KEY_COOKIE_NAME, encrypt_api_key
from core.models import ChatRecord

CSV = (
    "region,units,day\n"
    "North,10,2026-01-01\n"
    "South,4,2026-01-01\n"
    "North,6,2026-01-02\n"
    "South,,2026-01-02\n"
    "East,9,2026-01-03\n"
)

ANALYSIS = (
    '{"insights": "North sells the most.", "charts": ['
    '{"type": "bar", "title": "Units by region", "x": "region", "y": "units", "agg": "sum"},'
    '{"type": "line", "title": "Units by day", "x": "day", "y": "units", "agg": "sum"},'
    '{"type": "bar", "x": "not_a_column", "y": "units", "agg": "sum"}'
    ']}'
)


class DataAnalysisTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key("sk-or-v1-key")

    def analyse(self, text=CSV, reply=ANALYSIS, question=""):
        with patch(
            "document_function.views.generate_response_with_usage",
            return_value=(reply, empty_usage("openai/gpt-4o-mini")),
        ):
            return self.client.post(
                reverse("data-analysis"),
                {"text": text, "prompt": question},
            )

    def test_charts_are_computed_from_the_whole_file(self):
        response = self.analyse()

        self.assertEqual(response.status_code, 200)
        charts = response.data["data"]["charts"]

        # The unknown column is dropped rather than charted.
        self.assertEqual(len(charts), 2)

        bars = charts[0]
        self.assertEqual(bars["type"], "bar")
        # Real sums over five rows, not numbers the model made up: North 16,
        # East 9, South 4 — and a bar chart is a ranking, so biggest first.
        self.assertEqual(
            [(point["x"], point["y"]) for point in bars["series"][0]["points"]],
            [("North", 16.0), ("East", 9.0), ("South", 4.0)],
        )

    def test_a_line_chart_stays_in_x_order(self):
        charts = self.analyse().data["data"]["charts"]
        line = charts[1]

        self.assertEqual(line["type"], "line")
        self.assertEqual(
            [point["x"] for point in line["series"][0]["points"]],
            ["2026-01-01", "2026-01-02", "2026-01-03"],
        )

    def test_the_profile_describes_the_columns(self):
        profile = self.analyse().data["data"]["profile"]

        self.assertEqual(profile["rows"], 5)
        units = next(column for column in profile["columns"] if column["name"] == "units")
        self.assertEqual(units["kind"], "number")
        self.assertEqual(units["nulls"], 1)
        self.assertEqual(units["max"], 10.0)

        region = next(column for column in profile["columns"] if column["name"] == "region")
        self.assertEqual(region["kind"], "text")
        self.assertIn("North", region["top"])

    def test_a_reply_that_is_not_json_still_gives_insights(self):
        response = self.analyse(reply="The data looks seasonal.")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["insights"], "The data looks seasonal.")
        self.assertEqual(response.data["data"]["charts"], [])

    def test_a_wrapped_reply_is_unwrapped(self):
        response = self.analyse(
            reply='{"response": "{\\"insights\\": \\"Wrapped.\\", \\"charts\\": []}"}'
        )

        self.assertEqual(response.data["data"]["insights"], "Wrapped.")

    def test_something_that_is_not_csv_is_refused(self):
        response = self.analyse(text="))) not csv at all (((")

        self.assertIn(response.status_code, (400, 422))

    def test_the_analysis_is_recorded_with_its_usage(self):
        self.analyse(question="Which region leads?")

        record = ChatRecord.objects.latest("created_at")
        self.assertEqual(record.method, "data_analysis")
        self.assertEqual(record.model, "openai/gpt-4o-mini")


class DirectExtractionTests(TestCase):
    """
    One upload is several provider calls: one per chunk plus a tidy-up pass.

    This view has no page of its own, so nothing else exercises the path where
    a chunk's text and a chunk's usage travel separately — the combined answer
    has to be built from the text alone, and the record has to add the calls
    up. The number of chunks is the chunker's business, so these tests derive
    what to expect from how many calls were actually made.
    """

    PER_CALL = {
        "model": "openai/gpt-4o-mini",
        "tokens_in": 100,
        "tokens_out": 20,
        "cost": 0.001,
    }

    def setUp(self):
        self.client = Client()
        self.client.cookies[API_KEY_COOKIE_NAME] = encrypt_api_key("sk-or-v1-key")

    def upload(self, usage=None):
        """Post a CSV long enough that the chunker has to split it."""
        usage = usage or self.PER_CALL
        rows = "\n".join(f"row{i},{'value ' * 12}" for i in range(200))
        upload = SimpleUploadedFile(
            "report.csv", f"name,detail\n{rows}\n".encode(), content_type="text/csv"
        )

        texts = iter(f"part {i}" for i in range(1, 500))

        def reply(*args, **kwargs):
            return next(texts), usage

        with patch(
            "document_function.views.generate_response_with_usage",
            side_effect=reply,
        ) as mock_generate:
            response = self.client.post(
                reverse("direct-extraction"),
                {"file": upload, "prompt": "list the names"},
            )
        return response, mock_generate

    def test_chunks_are_combined_and_their_usage_added_up(self):
        response, mock_generate = self.upload()

        self.assertEqual(response.status_code, 200)

        calls = mock_generate.call_count
        self.assertGreater(calls, 2, "the fixture should have split into chunks")
        chunk_calls = calls - 1  # the last call is the tidy-up pass

        # The tidy-up pass is handed the text of every chunk, not the
        # (text, usage) pairs the chunk pass now returns.
        combined = mock_generate.call_args_list[-1].kwargs["prompt"]
        for index in range(chunk_calls):
            self.assertIn(f"part {index + 1}", combined)
        self.assertNotIn("tokens_in", combined)

        # The answer is the tidy-up pass's own reply.
        self.assertEqual(response.data["data"], f"part {calls}")

        record = ChatRecord.objects.get()
        self.assertEqual(record.method, "direct_extraction")
        self.assertEqual(record.tokens_in, 100 * calls)
        self.assertEqual(record.tokens_out, 20 * calls)
        self.assertAlmostEqual(record.cost, 0.001 * calls)

    def test_a_provider_that_reports_no_tokens_leaves_them_unset(self):
        response, _ = self.upload(usage=empty_usage("openai/gpt-4o-mini"))

        self.assertEqual(response.status_code, 200)
        record = ChatRecord.objects.get()
        self.assertIsNone(record.tokens_in)
        self.assertIsNone(record.cost)
        self.assertEqual(record.model, "openai/gpt-4o-mini")
