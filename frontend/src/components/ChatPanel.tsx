import React, { useEffect, useRef, useState } from 'react';
import MarkdownContent from './MarkdownContent';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
  replyTo?: string;
  remembered?: boolean;
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
  replyToId?: string | null;
  onReply?: (id: string) => void;
  onCancelReply?: () => void;
  onToggleMemory?: (id: string) => void;
  onClearMemory?: () => void;
  requireReply?: boolean;
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
  replyToId,
  onReply,
  onCancelReply,
  onToggleMemory,
  onClearMemory,
  requireReply = false,
}) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replyTarget = messages.find((message) => message.id === replyToId);
  const rememberedCount = messages.filter((message) => message.remembered && !message.isError).length;

  useEffect(() => { if (replyToId) inputRef.current?.focus(); }, [replyToId]);

  // Follow the conversation as it grows, including the "Thinking..." bubble.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const canSend = !disabled && !isLoading && input.trim().length > 0 && (!requireReply || Boolean(replyTarget));

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
                  className={`min-w-0 max-w-full sm:max-w-[85%] lg:max-w-2xl rounded-lg px-4 py-2.5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className={`flex items-center justify-between gap-4 mb-1.5 text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</span>
                    {!message.isError && (
                      <div className="flex gap-3">
                        {onToggleMemory && (
                          <button type="button" onClick={() => onToggleMemory(message.id)} disabled={isLoading}
                            aria-pressed={Boolean(message.remembered)}
                            aria-label={`${message.remembered ? 'Forget' : 'Remember'} message`}
                            className="underline-offset-2 hover:underline disabled:opacity-50">
                            {message.remembered ? 'Remembered' : 'Remember'}
                          </button>
                        )}
                        {message.role === 'assistant' && onReply && (
                          <button type="button" onClick={() => onReply(message.id)} disabled={isLoading}
                            aria-label="Reply to message" className="font-medium underline-offset-2 hover:underline disabled:opacity-50">
                            Reply
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {message.replyTo && (
                    <p className="mb-2 border-l-2 border-blue-200 pl-2 text-xs text-blue-100 line-clamp-2 break-words">
                      Replying to: {messages.find((entry) => entry.id === message.replyTo)?.text ?? 'an earlier message'}
                    </p>
                  )}
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                  ) : (
                    <MarkdownContent text={message.text} />
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
        {onToggleMemory && (
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-500">
            <span>{rememberedCount} remembered message{rememberedCount === 1 ? '' : 's'} · Replies use the selected exchange.</span>
            {rememberedCount > 0 && <button type="button" onClick={onClearMemory} disabled={isLoading} className="text-blue-600 hover:underline">Forget all</button>}
          </div>
        )}
        {replyTarget && (
          <div className="mb-3 flex items-start gap-3 rounded-md border-l-4 border-blue-500 bg-blue-50 p-2.5">
            <div className="min-w-0 flex-1 text-xs text-gray-700">
              <p className="font-semibold text-blue-700 mb-1">Replying to AI</p>
              <p className="line-clamp-2 break-words">{replyTarget.text}</p>
            </div>
            <button type="button" onClick={onCancelReply} className="text-xs text-blue-700 hover:underline">Cancel reply</button>
          </div>
        )}
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
            ref={inputRef}
            className="min-w-0 flex-grow bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={requireReply && !replyTarget ? 'Choose Reply on an answer to respond...' : replyTarget ? 'Write your reply...' : placeholder}
            disabled={disabled || isLoading}
            rows={2}
          />
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!canSend}
          >
            {isLoading ? '...' : replyTarget ? 'Send reply' : sendLabel}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Enter to send, Shift+Enter for a new line. New messages use only remembered context.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
