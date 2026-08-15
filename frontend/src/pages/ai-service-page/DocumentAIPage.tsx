import React, { useEffect, useState } from 'react';
import InsertFile from '../insert-page/InsertFile';
import RAGPage from './RAGPage';
import services, { toApiError } from '../../services/services';
import type { RagDocument, UploadResponse } from '../../interface';

/**
 * Owns the Document AI flow: upload PDFs, then chat with them.
 *
 * Each upload is indexed into its own folder on the server and stays there, so
 * the list of documents is fetched rather than remembered in the browser — a
 * refresh, or a different browser with the same API key, sees the same set.
 */
const DocumentAIPage: React.FC = () => {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    services
      .listRagDocuments()
      .then((indexed) => {
        if (!cancelled) setDocuments(indexed);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUploadSuccess = (uploaded: UploadResponse) => {
    // The upload response carries the full list back, so there is no second
    // round trip just to learn what is indexed now.
    setDocuments(uploaded.documents ?? []);
    setIsAdding(false);
  };

  const handleRemoveDocument = async (documentId: number) => {
    try {
      setDocuments(await services.deleteRagDocument(documentId));
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
        <span className="h-7 w-7 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        <p className="text-sm">Loading your documents...</p>
      </div>
    );
  }

  if (documents.length === 0 || isAdding) {
    return (
      <div className="h-full flex flex-col">
        {error && (
          <p
            role="alert"
            className="flex-shrink-0 mx-auto mt-4 w-full max-w-lg text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}
        <div className="flex-1 min-h-0">
          <InsertFile
            onUploadSuccess={handleUploadSuccess}
            indexedCount={documents.length}
            onCancel={isAdding ? () => setIsAdding(false) : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <RAGPage
      documents={documents}
      error={error}
      onAddDocument={() => setIsAdding(true)}
      onRemoveDocument={handleRemoveDocument}
    />
  );
};

export default DocumentAIPage;
