import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
  sendLabel?: string;
  /** Shown only while there are no messages. */
  emptyState: React.ReactNode;
  /** Banner or controls pinned above the composer. */
  composerHeader?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSend,
  placeholder = 'Type your message here',
  sendLabel = 'Send',
  emptyState,
  composerHeader,
  disabled = false,
  disabledReason,
}) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Follow the conversation as it grows, including the "Thinking..." bubble.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const canSend = !disabled && !isLoading && input.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput((current) => current + text);
    } catch {
      // Clipboard permission denied — typing still works.
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 relative">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center text-center">
            {emptyState}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md lg:max-w-2xl rounded-lg px-4 py-2.5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 text-sm flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
        {composerHeader && <div className="mb-2">{composerHeader}</div>}

        {disabled && disabledReason && (
          <p className="mb-2 text-sm text-gray-500">{disabledReason}</p>
        )}

        <div className="flex gap-2 items-end">
          <button
            type="button"
            onClick={handlePaste}
            disabled={disabled || isLoading}
            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 text-sm border border-gray-300 disabled:opacity-50"
          >
            Paste
          </button>
          <textarea
            className="flex-grow border border-gray-300 rounded-md px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={2}
          />
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!canSend}
          >
            {isLoading ? '...' : sendLabel}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
