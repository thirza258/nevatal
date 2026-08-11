import React from 'react';
import services from '../../services/services';
import ChatPanel from '../../components/ChatPanel';
import { useChat } from '../../hooks/useChat';

interface RAGPageProps {
  documentName: string;
  onReplaceDocument: () => void;
}

const RAGPage: React.FC<RAGPageProps> = ({ documentName, onReplaceDocument }) => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    services.chatWithRAG
  );

  return (
    <div className="h-full flex flex-col gap-3">
      <header className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Document AI</h1>
          <p className="text-sm text-gray-600 mt-0.5 truncate">
            Answering from{' '}
            <span className="font-medium text-gray-800">{documentName}</span>
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
            onClick={onReplaceDocument}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-white hover:bg-gray-100 rounded-md text-gray-700 border border-gray-300 disabled:opacity-50"
          >
            Replace document
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          placeholder="Ask a question about this document..."
          emptyState={
            <div className="max-w-md">
              <p className="text-2xl font-bold text-gray-400">
                Ask about your document
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                Answers are drawn from the passages of{' '}
                <span className="font-medium">{documentName}</span> that best match
                your question, so ask about what is actually in it.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default RAGPage;
