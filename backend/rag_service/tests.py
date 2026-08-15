"""
Tests for the persisted RAG store.

Nothing here touches the network or needs a Gemini key: PersistedRAGStoreTests
stubs the embedding call outright to cover what persistence buys — the folder
layout, surviving a restart, isolation between API keys, deletion — while
EmbeddingCallTests fakes only the client, so the batching and the guards around
the API's response stay under test.
"""

import json
import math
import pickle
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, PropertyMock, patch

import numpy as np
from django.test import SimpleTestCase, override_settings

from rag_service.rag_service import EMBED_BATCH_SIZE, INDEX_FILE, META_FILE, RAGIndex

KEYWORDS = ("alpha", "beta", "gamma")

API_KEY = "test-key"
OTHER_API_KEY = "someone-elses-key"


def fake_embed_texts(self, texts):
    """Unit vectors over KEYWORDS, so 'alpha' lands nearest the alpha text."""
    vectors = []
    for text in texts:
        vector = np.array([text.lower().count(word) for word in KEYWORDS], dtype=np.float32)
        norm = np.linalg.norm(vector)
        vectors.append(vector / norm if norm else vector)
    return vectors


def document_text(keyword):
    """Long enough to survive the 100-character minimum chunk length."""
    return f"{keyword} " * 60


class PersistedRAGStoreTests(SimpleTestCase):
    def setUp(self):
        self._media = tempfile.TemporaryDirectory()
        self.addCleanup(self._media.cleanup)

        media_root = override_settings(MEDIA_ROOT=self._media.name)
        media_root.enable()
        self.addCleanup(media_root.disable)

        embed = patch.object(RAGIndex, "_embed_texts", fake_embed_texts)
        embed.start()
        self.addCleanup(embed.stop)

        self.index = RAGIndex(api_key=API_KEY)

    def add_all(self, index=None):
        index = index or self.index
        return [
            index.add_document(f"{keyword}.pdf", document_text(keyword))
            for keyword in KEYWORDS
        ]

    def test_each_upload_gets_its_own_numbered_folder(self):
        self.add_all()

        self.assertEqual(self.index.document_ids(), [1, 2, 3])
        for document_id, keyword in zip([1, 2, 3], KEYWORDS):
            folder = self.index.document_dir(document_id)
            self.assertTrue((folder / INDEX_FILE).is_file(), f"{folder} has no {INDEX_FILE}")

            meta = json.loads((folder / META_FILE).read_text())
            self.assertEqual(meta["source"], f"{keyword}.pdf")
            self.assertEqual(meta["document_id"], document_id)
            self.assertGreater(meta["chunk_count"], 0)

    def test_pkl_holds_the_chunks_and_their_embeddings(self):
        self.add_all()

        with open(self.index.document_dir(1) / INDEX_FILE, "rb") as f:
            payload = pickle.load(f)

        self.assertEqual(payload["source"], "alpha.pdf")
        self.assertEqual(payload["dim"], len(KEYWORDS))
        self.assertEqual(len(payload["chunks"]), payload["embeddings"].shape[0])
        self.assertIn("alpha", payload["chunks"][0])

    def test_a_new_instance_searches_without_re_embedding_the_chunks(self):
        self.add_all()

        # Nothing carried over in memory: this is the restart case.
        reopened = RAGIndex(api_key=API_KEY)
        with patch.object(RAGIndex, "_embed_texts", autospec=True) as embed:
            embed.side_effect = fake_embed_texts
            results = reopened.retrieve_chunks("beta", k=1)

            # Only the query is embedded; the stored vectors are read off disk.
            self.assertEqual(embed.call_count, 1)
            self.assertEqual(embed.call_args.args[1], ["beta"])

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["source"], "beta.pdf")
        self.assertEqual(results[0]["document_id"], 2)
        self.assertEqual(reopened.loaded_document_ids, [1, 2, 3])

    def test_search_spans_every_persisted_document(self):
        self.add_all()

        for keyword, expected_id in zip(KEYWORDS, [1, 2, 3]):
            with self.subTest(keyword=keyword):
                results = RAGIndex(api_key=API_KEY).retrieve_chunks(keyword, k=1)
                self.assertEqual(results[0]["document_id"], expected_id)

    def test_document_ids_narrow_the_search(self):
        self.add_all()

        results = self.index.retrieve_chunks("alpha", k=3, document_ids=[3])

        self.assertTrue(results)
        self.assertTrue(all(chunk["document_id"] == 3 for chunk in results))

    def test_documents_are_scoped_to_the_api_key_that_uploaded_them(self):
        self.add_all()

        stranger = RAGIndex(api_key=OTHER_API_KEY)

        self.assertEqual(stranger.document_ids(), [])
        self.assertEqual(stranger.list_documents(), [])
        self.assertEqual(stranger.retrieve_chunks("alpha", k=1), [])

    def test_list_documents_describes_every_folder(self):
        self.add_all()

        listed = self.index.list_documents()

        self.assertEqual([d["document_id"] for d in listed], [1, 2, 3])
        self.assertEqual([d["source"] for d in listed], [f"{k}.pdf" for k in KEYWORDS])

    def test_deleting_one_document_leaves_the_others_numbered_as_they_were(self):
        self.add_all()

        self.assertTrue(self.index.delete_document(2))

        self.assertFalse(self.index.document_dir(2).exists())
        self.assertEqual(self.index.document_ids(), [1, 3])

        # The deleted document is out of the index, not merely off the disk.
        results = self.index.retrieve_chunks("beta", k=4)
        self.assertTrue(results)
        self.assertNotIn(2, {chunk["document_id"] for chunk in results})

    def test_deleting_everything_restarts_the_numbering(self):
        self.add_all()

        self.assertEqual(self.index.delete_all_documents(), 3)
        self.assertEqual(self.index.document_ids(), [])

        self.index.add_document("fresh.pdf", document_text("alpha"))
        self.assertEqual(self.index.document_ids(), [1])

    def test_a_failed_upload_leaves_no_half_written_folder(self):
        self.add_all()

        with patch("rag_service.rag_service.pickle.dump", side_effect=OSError("disk full")):
            with self.assertRaises(Exception):
                self.index.add_document("broken.pdf", document_text("alpha"))

        self.assertEqual(self.index.document_ids(), [1, 2, 3])

    def test_a_document_from_another_embedding_model_is_skipped(self):
        self.add_all()

        folder = self.index.document_dir(2)
        with open(folder / INDEX_FILE, "rb") as f:
            payload = pickle.load(f)
        payload["embeddings"] = np.zeros((len(payload["chunks"]), 8), dtype=np.float32)
        payload["dim"] = 8
        with open(folder / INDEX_FILE, "wb") as f:
            pickle.dump(payload, f)

        reopened = RAGIndex(api_key=API_KEY)
        results = reopened.retrieve_chunks("alpha", k=1)

        self.assertEqual(reopened.loaded_document_ids, [1, 3])
        self.assertEqual(results[0]["document_id"], 1)

    def test_a_document_with_no_usable_text_is_rejected(self):
        with self.assertRaises(Exception) as raised:
            self.index.add_document("tiny.pdf", "too short to chunk")

        self.assertIn("No valid chunks", str(raised.exception))
        self.assertEqual(self.index.document_ids(), [])

    def test_the_stored_upload_sits_beside_its_index(self):
        pdf = tempfile.NamedTemporaryFile(suffix=".pdf")
        self.addCleanup(pdf.close)
        pdf.write(b"%PDF-1.4 not really a pdf")
        pdf.flush()
        pdf.seek(0)

        meta = self.index.add_document("report.pdf", document_text("alpha"), source_file=pdf)

        stored = Path(meta["file_path"])
        self.assertEqual(stored.parent, self.index.document_dir(1))
        self.assertEqual(stored.read_bytes(), b"%PDF-1.4 not really a pdf")


class EmbeddingCallTests(SimpleTestCase):
    """
    Covers the path the stubbed tests above skip: the real _embed_texts, with
    only the Gemini client itself faked.
    """

    def setUp(self):
        self._media = tempfile.TemporaryDirectory()
        self.addCleanup(self._media.cleanup)

        media_root = override_settings(MEDIA_ROOT=self._media.name)
        media_root.enable()
        self.addCleanup(media_root.disable)

        self.batches = []
        self.index = RAGIndex(api_key=API_KEY)

    def use_client(self, vector_for):
        """Patch in a client whose embed_content returns vector_for(text)."""
        client = MagicMock()

        def embed_content(model, contents, config):
            self.batches.append(list(contents))
            return SimpleNamespace(
                embeddings=[SimpleNamespace(values=vector_for(text)) for text in contents]
            )

        client.models.embed_content.side_effect = embed_content

        patched = patch.object(
            RAGIndex, "client", new_callable=PropertyMock, return_value=client
        )
        patched.start()
        self.addCleanup(patched.stop)

    def test_chunks_are_embedded_in_batches_the_api_accepts(self):
        self.use_client(lambda text: [0.5, 0.25, 0.125, 0.0625])

        meta = self.index.add_document("long.pdf", "alpha beta gamma " * 1200)

        chunk_count = meta["chunk_count"]
        self.assertGreater(chunk_count, EMBED_BATCH_SIZE, "text was too short to batch")
        self.assertEqual(len(self.batches), math.ceil(chunk_count / EMBED_BATCH_SIZE))
        self.assertTrue(all(len(batch) <= EMBED_BATCH_SIZE for batch in self.batches))
        self.assertEqual(sum(len(batch) for batch in self.batches), chunk_count)

        with open(self.index.document_dir(1) / INDEX_FILE, "rb") as f:
            payload = pickle.load(f)
        self.assertEqual(payload["embeddings"].shape, (chunk_count, 4))

    def test_mixed_embedding_sizes_are_reported_not_stacked(self):
        # A second batch of a different width used to blow up inside numpy.
        sizes = iter([4, 4])
        self.use_client(lambda text: [0.1] * (next(sizes, 8)))

        with self.assertRaises(Exception) as raised:
            self.index.add_document("long.pdf", "alpha beta gamma " * 1200)

        self.assertIn("mixed embedding sizes", str(raised.exception))
        self.assertEqual(self.index.document_ids(), [], "left a folder behind")

    def test_a_short_response_is_reported(self):
        client = MagicMock()
        client.models.embed_content.return_value = SimpleNamespace(
            embeddings=[SimpleNamespace(values=[0.1, 0.2])]
        )
        patched = patch.object(
            RAGIndex, "client", new_callable=PropertyMock, return_value=client
        )
        patched.start()
        self.addCleanup(patched.stop)

        with self.assertRaises(Exception) as raised:
            self.index.add_document("long.pdf", "alpha beta gamma " * 1200)

        self.assertIn("expected", str(raised.exception))
        self.assertEqual(self.index.document_ids(), [])
