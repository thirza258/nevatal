import React from 'react';
import services from '../../services/services';
import ChatPanel from '../../components/ChatPanel';
import { useChat } from '../../hooks/useChat';

const PromptPage: React.FC = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    services.postPrompt
  );

  return (
    <div className="h-full flex flex-col gap-3">
      <header className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prompt</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            A direct line to the model — ask anything, in your own words.
          </p>
        </div>
        <button
          type="button"
          onClick={clearMessages}
          disabled={messages.length === 0 || isLoading}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200 disabled:opacity-50"
        >
          Clear chat
        </button>
      </header>

      <div className="flex-1 min-h-0">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          placeholder="Ask anything..."
          emptyState={
            <div>
              <p className="text-3xl font-bold text-gray-400">Ask me anything</p>
              <p className="text-gray-400 mt-2">
                Questions, ideas, drafts, explanations — start typing below.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default PromptPage;
