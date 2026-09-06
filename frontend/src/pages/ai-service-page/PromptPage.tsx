import React from 'react';
import services from '../../services/services';
import ChatPanel from '../../components/ChatPanel';
import { useChat } from '../../hooks/useChat';
import { conversationStorageKey } from '../../constant';

const PromptPage: React.FC = () => {
  // The thread is the context — every send replays it — and it is kept in this
  // browser, so a reload continues the conversation rather than starting over.
  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    services.postPrompt,
    conversationStorageKey('/prompt')
  );

  const turns = messages.filter((message) => !message.isError).length;

  return (
    <div className="h-full flex flex-col gap-3">
      <header className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prompt</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            A direct line to the model — ask anything, in your own words.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          {turns > 0 && (
            <span
              className="hidden sm:inline text-xs text-gray-500"
              title="Earlier turns are sent with each message, so follow-ups make sense"
            >
              {turns} turn{turns === 1 ? '' : 's'} of context
            </span>
          )}
          <button
            type="button"
            onClick={clearMessages}
            disabled={messages.length === 0 || isLoading}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200 disabled:opacity-50"
          >
            Clear chat
          </button>
        </div>
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
