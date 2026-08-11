import React, { useState } from 'react';
import InsertFile from '../insert-page/InsertFile';
import RAGPage from './RAGPage';
import { ACTIVE_DOCUMENT_KEY } from '../../constant';

/**
 * Owns the Document AI flow: upload a PDF, then chat with it.
 *
 * The index lives on the server, so the active document name is persisted —
 * otherwise a refresh would show the upload screen while the backend still
 * holds a perfectly good index.
 */
const DocumentAIPage: React.FC = () => {
  const [documentName, setDocumentName] = useState<string>(
    () => localStorage.getItem(ACTIVE_DOCUMENT_KEY) || ''
  );
  const [isReplacing, setIsReplacing] = useState(false);

  const handleUploadSuccess = (name: string) => {
    localStorage.setItem(ACTIVE_DOCUMENT_KEY, name);
    setDocumentName(name);
    setIsReplacing(false);
  };

  if (!documentName || isReplacing) {
    return (
      <InsertFile
        onUploadSuccess={handleUploadSuccess}
        currentDocument={isReplacing ? documentName : undefined}
        onCancel={isReplacing ? () => setIsReplacing(false) : undefined}
      />
    );
  }

  return (
    <RAGPage
      documentName={documentName}
      onReplaceDocument={() => setIsReplacing(true)}
    />
  );
};

export default DocumentAIPage;
