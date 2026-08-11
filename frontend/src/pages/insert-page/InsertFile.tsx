import React, { useState } from 'react';
import services, { toApiError } from '../../services/services';

interface InsertFileProps {
  onUploadSuccess: (documentName: string) => void;
  /** Shown when the user is replacing a document rather than adding the first. */
  currentDocument?: string;
  onCancel?: () => void;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const InsertFile: React.FC<InsertFileProps> = ({
  onUploadSuccess,
  currentDocument,
  onCancel,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 20 MB. Please upload a smaller PDF.');
      setSelectedFile(null);
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError('');

    try {
      await services.insertFile(selectedFile);
      onUploadSuccess(selectedFile.name);
    } catch (err) {
      const apiError = toApiError(err);
      setError(
        apiError.message.toLowerCase().includes('embedding')
          ? `${apiError.message} Document AI builds its index with Google embeddings, so it needs a Gemini API key.`
          : apiError.message
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex items-start justify-center pt-8">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {currentDocument ? 'Replace the document' : 'Upload a document'}
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Nevatal reads the PDF, splits it into passages, and answers your
          questions using the passages that match.
        </p>

        {currentDocument && (
          <p className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2">
            <strong>{currentDocument}</strong> is currently loaded. Uploading a new
            file replaces it — the previous document is removed from the index.
          </p>
        )}

        <label
          htmlFor="file-upload"
          className="block border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
        >
          <span className="block text-sm font-medium text-gray-700">
            {selectedFile ? selectedFile.name : 'Choose a PDF file'}
          </span>
          <span className="block text-xs text-gray-500 mt-1">
            {selectedFile
              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB — click to choose a different file`
              : 'PDF only, up to 20 MB'}
          </span>
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="application/pdf"
            disabled={uploading}
          />
        </label>

        <p className="text-xs text-gray-500 mt-3">
          Scanned or image-only PDFs have no extractable text and will be
          rejected.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="px-4 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="flex-grow bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Indexing document...' : 'Upload and start chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertFile;
