import React from 'react';
import services from '../../services/services';
import ChatPanel from '../../components/ChatPanel';
import { useChat } from '../../hooks/useChat';
import { conversationStorageKey } from '../../constant';
import type { RagDocument } from '../../interface';

interface RAGPageProps {
  documents: RagDocument[];
  error?: string;
  onAddDocument: () => void;
  onRemoveDocument: (documentId: number) => void;
}

const RAGPage: React.FC<RAGPageProps> = ({
  documents,
  error,
  onAddDocument,
  onRemoveDocument,
}) => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    services.chatWithRAG,
    conversationStorageKey('/document-ai')
  );

  const documentCount = documents.length;

  return (
    <div className="h-full flex flex-col gap-3">
      <header className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Document AI</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Answering from{' '}
              <span className="font-medium text-gray-800">
                {documentCount} indexed document{documentCount === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <button
              type="button"
              onClick={clearMessages}
              disabled={messages.length === 0 || isLoading}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200 disabled:opacity-50"
            >
              Clear chat
            </button>
            <button
              type="button"
              onClick={onAddDocument}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-white hover:bg-gray-100 rounded-md text-gray-700 border border-gray-300 disabled:opacity-50"
            >
              Add document
            </button>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2 mt-3">
          {documents.map((document) => (
            <li
              key={document.document_id}
              className="flex items-center gap-2 max-w-full bg-gray-50 border border-gray-200 rounded-md pl-2.5 pr-1.5 py-1 text-xs text-gray-700"
            >
              <span className="text-gray-400">{document.document_id}</span>
              <span className="truncate">{document.source}</span>
              <button
                type="button"
                onClick={() => onRemoveDocument(document.document_id)}
                title={`Remove ${document.source}`}
                aria-label={`Remove ${document.source}`}
                className="text-gray-400 hover:text-red-600 px-1 rounded"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {error && (
          <p
            role="alert"
            className="mt-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}
      </header>

      <div className="flex-1 min-h-0">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          placeholder="Ask a question about your documents..."
          emptyState={
            <div className="max-w-md">
              <p className="text-2xl font-bold text-gray-400">
                Ask about your documents
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                Answers are drawn from the passages that best match your
                question, across every document listed above, so ask about what
                is actually in them.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default RAGPage;
