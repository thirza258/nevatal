"""
Persisted RAG store.

Every uploaded file gets its own numbered folder under MEDIA_ROOT, so a user's
documents lay out as 1/, 2/, 3/ ... in upload order:

    media/rag/<owner>/1/index.pkl    chunks + embeddings for the first upload
    media/rag/<owner>/1/meta.json    source name, chunk count, timestamps
    media/rag/<owner>/1/report.pdf   the upload itself
    media/rag/<owner>/2/...

Embeddings are written once, at upload time. A chat turn unpickles those
folders and rebuilds a flat FAISS index in memory, so answering costs a single
embedding call for the query instead of re-embedding every chunk of every
document on every request.
"""

import json
import os
import pickle
import shutil
from datetime import datetime, timezone
from pathlib import Path

import faiss
import numpy as np
from django.conf import settings
from google import genai
from google.genai import types
from langchain_core.documents import Document

from core.helper import fingerprint_api_key, save_file

STORE_VERSION = 1
INDEX_FILE = "index.pkl"
META_FILE = "meta.json"

# One embed_content call per this many chunks. A 40-page PDF is well over a
# thousand 200-character chunks, which no single request will accept.
# Deliberately conservative: the per-request ceiling is not something we can
# check from here, and a batch that is refused fails the whole upload.
EMBED_BATCH_SIZE = 32


class RAGIndex:
    """Read/write access to one API key's persisted documents."""

    def __init__(self, api_key: str):
        self.api_key = api_key or ""
        self._client = None
        self.model_name = "gemini-embedding-001"
        self.task_type = "SEMANTIC_SIMILARITY"

        self.chunk_size = 200
        self.chunk_overlap = 50

        # Built lazily by load_data(). Both views construct a RAGIndex on every
        # request, so the constructor must not touch the disk or the network.
        self.faiss_index = None
        self.documents = []
        self.loaded_document_ids = []

    @property
    def client(self):
        """Gemini client, created on first use so listing never needs a key."""
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    # ------------------------------------------------------------------
    # Where things live
    # ------------------------------------------------------------------

    @property
    def owner_id(self) -> str:
        """
        Directory name isolating one API key's documents from another's.

        The same fingerprint the chat history is scoped by, so a user sees the
        documents they uploaded and nobody else's.
        """
        return fingerprint_api_key(self.api_key)[:16] or "anonymous"

    @property
    def owner_dir(self) -> Path:
        return Path(settings.MEDIA_ROOT) / "rag" / self.owner_id

    def document_dir(self, document_id: int) -> Path:
        return self.owner_dir / str(int(document_id))

    def document_ids(self) -> list:
        """Folder numbers present on disk, in upload order."""
        try:
            entries = os.listdir(self.owner_dir)
        except (FileNotFoundError, NotADirectoryError):
            return []

        return sorted(
            int(name)
            for name in entries
            if name.isdigit() and (self.owner_dir / name).is_dir()
        )

    def _claim_document_dir(self):
        """
        Reserve the next free folder number.

        The mkdir is the claim: it fails if a concurrent upload took the number
        first, which "read the max, then makedirs(exist_ok=True)" would not
        catch — both uploads would write into the same folder.
        """
        self.owner_dir.mkdir(parents=True, exist_ok=True)
        next_id = max(self.document_ids(), default=0) + 1

        for candidate in range(next_id, next_id + 50):
            directory = self.document_dir(candidate)
            try:
                directory.mkdir()
                return candidate, directory
            except FileExistsError:
                continue

        raise Exception("Could not reserve a folder for this document.")

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def _chunk_text(self, text):
        """Split one long text into overlapping chunks"""
        chunks = []
        for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
            chunk = text[i:i + self.chunk_size]
            if len(chunk.strip()) >= 100:
                chunks.append(chunk)
        return chunks

    def _embed_texts(self, texts):
        """Embed multiple texts using Gemini, in batches the API accepts"""
        try:
            vectors = []
            for start in range(0, len(texts), EMBED_BATCH_SIZE):
                response = self.client.models.embed_content(
                    model=self.model_name,
                    contents=texts[start:start + EMBED_BATCH_SIZE],
                    config=types.EmbedContentConfig(task_type=self.task_type),
                )
                vectors.extend(
                    np.array(e.values, dtype=np.float32) for e in response.embeddings
                )

            # Both of these would otherwise surface as an opaque numpy shape
            # error while stacking, several frames away from the real cause.
            if len(vectors) != len(texts):
                raise Exception(
                    f"expected {len(texts)} embeddings, the API returned {len(vectors)}"
                )

            sizes = {vector.shape[0] for vector in vectors}
            if len(sizes) > 1:
                raise Exception(f"the API returned mixed embedding sizes {sorted(sizes)}")

            return vectors
        except Exception as e:
            raise Exception(f"Embedding failed: {e}")

    def add_document(self, source_name, full_text, metadata=None, source_file=None):
        """Chunk, embed and persist one document into its own numbered folder"""
        try:
            chunks = self._chunk_text(full_text)
            if not chunks:
                raise Exception("No valid chunks extracted from text.")

            embeddings = np.array(self._embed_texts(chunks), dtype=np.float32)

            document_id, directory = self._claim_document_dir()
            try:
                stored_path = save_file(source_file, directory=directory) if source_file else None

                payload = {
                    "version": STORE_VERSION,
                    "document_id": document_id,
                    "source": source_name,
                    "model": self.model_name,
                    "task_type": self.task_type,
                    "dim": int(embeddings.shape[1]),
                    "chunks": chunks,
                    "embeddings": embeddings,
                    "metadata": metadata or {},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                with open(directory / INDEX_FILE, "wb") as f:
                    pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)

                # Everything except the vectors, so listing documents never has
                # to unpickle megabytes of embeddings.
                meta = {
                    key: payload[key]
                    for key in ("version", "document_id", "source", "model", "dim", "created_at", "metadata")
                }
                meta["chunk_count"] = len(chunks)
                meta["file_path"] = stored_path
                meta["folder"] = str(directory)
                with open(directory / META_FILE, "w", encoding="utf-8") as f:
                    json.dump(meta, f, indent=2)
            except Exception:
                # A half-written folder would still be picked up as a document.
                shutil.rmtree(directory, ignore_errors=True)
                raise

            print(f"✅ Persisted {len(chunks)} chunks from {source_name} in {directory}")

            # Force the next search to reload, so it includes what was just added.
            self.faiss_index = None
            return meta

        except Exception as e:
            raise Exception(f"Error adding document: {e}")

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def _read_index(self, document_id):
        """Unpickle one document's stored chunks and embeddings"""
        path = self.document_dir(document_id) / INDEX_FILE
        try:
            with open(path, "rb") as f:
                payload = pickle.load(f)
        except FileNotFoundError:
            return None
        except Exception as e:
            print(f"⚠️ Could not read {path}: {e}")
            return None

        if not isinstance(payload, dict) or "chunks" not in payload or "embeddings" not in payload:
            print(f"⚠️ Skipping {path}: not a RAG index file.")
            return None

        return payload

    def _read_meta(self, document_id):
        """Describe one document without unpickling its embeddings"""
        directory = self.document_dir(document_id)
        try:
            with open(directory / META_FILE, "r", encoding="utf-8") as f:
                meta = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            if not (directory / INDEX_FILE).exists():
                return None
            meta = {"source": f"document {document_id}"}

        meta["document_id"] = document_id
        meta["folder"] = str(directory)
        return meta

    def list_documents(self):
        """Every persisted document for this API key, oldest folder first"""
        documents = (self._read_meta(document_id) for document_id in self.document_ids())
        return [document for document in documents if document]

    def _resolve_document_ids(self, document_ids=None):
        """Normalise a caller's selection to folder numbers that exist"""
        available = self.document_ids()
        if document_ids is None:
            return available

        if isinstance(document_ids, (str, int)):
            document_ids = [document_ids]

        wanted = []
        for value in document_ids:
            try:
                document_id = int(value)
            except (TypeError, ValueError):
                continue
            if document_id in available and document_id not in wanted:
                wanted.append(document_id)
        return wanted

    def load_data(self, document_ids=None):
        """Rebuild the FAISS index in memory from the persisted pkl files"""
        try:
            self.faiss_index = None
            self.documents = []
            self.loaded_document_ids = []

            matrices = []
            expected_dim = None

            for document_id in self._resolve_document_ids(document_ids):
                payload = self._read_index(document_id)
                if payload is None:
                    continue

                chunks = payload["chunks"]
                embeddings = np.asarray(payload["embeddings"], dtype=np.float32)

                if embeddings.ndim != 2 or embeddings.shape[0] != len(chunks) or not chunks:
                    print(f"⚠️ Skipping document {document_id}: chunks and embeddings do not line up.")
                    continue

                if expected_dim is None:
                    expected_dim = embeddings.shape[1]
                elif embeddings.shape[1] != expected_dim:
                    # Written by a different embedding model. Concatenating it
                    # is a shape error at best and nonsense distances at worst.
                    print(
                        f"⚠️ Skipping document {document_id}: {embeddings.shape[1]}-dim "
                        f"vectors, expected {expected_dim}."
                    )
                    continue

                source = payload.get("source") or f"document {document_id}"
                base_metadata = payload.get("metadata") or {}
                self.documents.extend(
                    Document(
                        page_content=chunk,
                        metadata={**base_metadata, "document_id": document_id, "source": source},
                    )
                    for chunk in chunks
                )
                matrices.append(embeddings)
                self.loaded_document_ids.append(document_id)

            if not matrices:
                print("⚠️ No persisted RAG documents found.")
                return

            vectors = np.vstack(matrices)
            self.faiss_index = faiss.IndexFlatL2(vectors.shape[1])
            self.faiss_index.add(vectors)

            print(
                f"✅ RAG index loaded with {len(self.documents)} chunks "
                f"from {len(self.loaded_document_ids)} document(s)."
            )
        except Exception as e:
            raise Exception(f"Error loading RAG data: {e}")

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve_chunks(self, query, k=3, document_ids=None):
        """Retrieve the best-matching chunks, each with the document it came from"""
        try:
            if self.faiss_index is None:
                self.load_data(document_ids)

            if self.faiss_index is None or not self.documents:
                return []

            query_embedding = self._embed_texts([query])[0].reshape(1, -1)

            # Asking FAISS for more neighbours than it holds pads with -1.
            distances, indices = self.faiss_index.search(
                query_embedding, max(1, min(k, len(self.documents)))
            )

            results = []
            for position, distance in zip(indices[0], distances[0]):
                if 0 <= position < len(self.documents):
                    document = self.documents[position]
                    results.append({
                        "text": document.page_content,
                        "source": document.metadata.get("source", ""),
                        "document_id": document.metadata.get("document_id"),
                        "distance": float(distance),
                    })

            return results

        except Exception as e:
            raise Exception(f"Error retrieving documents: {e}")

    def retrieve_documents(self, query, k=3, document_ids=None):
        """Retrieve most relevant chunks for a given query, as plain text"""
        return [
            chunk["text"]
            for chunk in self.retrieve_chunks(query, k=k, document_ids=document_ids)
        ]

    # ------------------------------------------------------------------
    # Deletion
    # ------------------------------------------------------------------

    def delete_document(self, document_id) -> bool:
        """Remove one numbered folder. Later folders keep their numbers."""
        directory = self.document_dir(document_id)
        if not directory.is_dir():
            return False

        shutil.rmtree(directory)
        self.faiss_index = None
        print(f"✅ Deleted document {document_id} from {directory}")
        return True

    def delete_all_documents(self) -> int:
        """Remove every persisted document belonging to this API key"""
        removed = len(self.document_ids())
        shutil.rmtree(self.owner_dir, ignore_errors=True)
        self.faiss_index = None
        print(f"✅ Deleted {removed} persisted document(s).")
        return removed
