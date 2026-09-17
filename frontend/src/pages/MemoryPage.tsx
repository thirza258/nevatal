import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MarkdownContent from '../components/MarkdownContent';
import { clearConversations } from '../services/auth';
import { historyPreview } from '../services/history';
import { CONVERSATION_PREFIX, forgetConversationMemory, listConversationMemory, readMessages } from '../services/memory';
import services, { toApiError } from '../services/services';
import { findToolByPath } from '../tools';

const memoryName = (key: string) => {
  const path = key.slice(CONVERSATION_PREFIX.length);
  if (path.startsWith('/history/')) return `Saved chat #${path.split('/').at(-1)}`;
  if (path.startsWith('/document-ai')) return 'Document AI';
  return findToolByPath(path)?.name ?? 'Chat';
};

export default function MemoryPage() {
  const [threads, setThreads] = useState(listConversationMemory);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const refresh = () => setThreads(listConversationMemory());

  useEffect(() => {
    const syncMemory = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(CONVERSATION_PREFIX)) setThreads(listConversationMemory());
    };
    window.addEventListener('storage', syncMemory);
    return () => window.removeEventListener('storage', syncMemory);
  }, []);

  const updateBrowser = (action: () => void) => {
    setError(''); setStatus('');
    try { action(); refresh(); } catch { setError('Could not update browser memory. Check that browser storage is available.'); }
  };

  const deleteSavedHistory = async () => {
    if (!window.confirm('Delete all saved chat text for this API key and clear all chats in this browser? This cannot be undone. Usage totals will remain.')) return;
    setIsDeleting(true); setError(''); setStatus('');
    try {
      await services.deleteHistory();
      refresh();
      setStatus('Saved history and browser chats deleted. Usage totals are unchanged.');
    } catch (cause) { setError(toApiError(cause).message); }
    finally { setIsDeleting(false); }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-5 pb-4">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Memory & history</h1>
          <p className="mt-2 text-sm text-gray-600">Choose what the AI remembers in each chat. New messages use only remembered context; Reply also includes the selected exchange.</p>
        </header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {status && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{status}</p>}
        <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Remembered messages</h2>
            <button type="button" disabled={threads.length === 0 || isDeleting}
              onClick={() => {
                if (window.confirm('Clear all chats and remembered selections in this browser? Saved history will still be available.')) updateBrowser(clearConversations);
              }} className="text-sm text-red-700 hover:underline disabled:opacity-40">Clear browser chats</button>
          </div>
          <p className="mt-2 text-sm text-gray-600">Selections stay in this browser and apply only to their chat. Remembered answers include their question and earlier replies. Long context is limited to the latest 20 messages that fit.</p>
          {threads.length === 0 ? <p className="mt-5 text-sm text-gray-500">No browser chats yet. Choose Remember beside a message in a chat to keep it in context.</p> : (
            <div className="mt-4 space-y-3">
              {threads.map((thread) => (
                <details key={thread.key} className="rounded-md border border-gray-200">
                  <summary className="cursor-pointer px-3 py-3 text-sm text-gray-800">
                    <span className="font-medium">{memoryName(thread.key)}</span>
                    <span className="ml-2 text-gray-500">{thread.remembered} remembered · {thread.messages} messages</span>
                  </summary>
                  <div className="border-t border-gray-100 p-3">
                    <div className="mb-3 flex flex-wrap gap-4 text-xs">
                      <button type="button" disabled={isDeleting || thread.remembered === 0} className="text-blue-600 hover:underline disabled:opacity-40"
                        onClick={() => updateBrowser(() => forgetConversationMemory(thread.key))}>Forget remembered messages</button>
                      <button type="button" disabled={isDeleting} className="text-red-700 hover:underline"
                        onClick={() => {
                          if (window.confirm('Clear this browser chat and its remembered selections? Saved history will still be available.')) updateBrowser(() => localStorage.removeItem(thread.key));
                        }}>Clear browser chat</button>
                    </div>
                    <ul className="max-h-96 space-y-3 overflow-y-auto">
                      {readMessages(thread.key).filter((message) => !message.isError).map((message) => (
                        <li key={message.id} className="rounded-md bg-gray-50 p-3">
                          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={Boolean(message.remembered)} disabled={isDeleting}
                              aria-label={`Remember ${message.role === 'user' ? 'your message' : 'AI reply'}: ${historyPreview(message.text).slice(0, 70)}`}
                              className="mt-1" onChange={() => updateBrowser(() => {
                                const messages = readMessages(thread.key).map((entry) => entry.id === message.id ? { ...entry, remembered: !entry.remembered } : entry);
                                localStorage.setItem(thread.key, JSON.stringify(messages));
                              })} />
                            <span className="min-w-0"><span className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</span><span className="mt-1 block line-clamp-3 break-words">{historyPreview(message.text)}</span></span>
                          </label>
                          <details className="mt-2 ml-5 text-xs text-gray-500">
                            <summary className="cursor-pointer">Full message</summary>
                            <div className="mt-2 min-w-0"><MarkdownContent text={message.text} /></div>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Saved history</h2>
          <p className="mt-2 text-sm text-gray-600">Open a sidebar history entry to read, reply to, or delete that saved chat. Clearing saved history deletes prompt, reply, and saved context text for this API key, including batch results. Usage totals remain in <Link to="/usage" className="text-blue-600 underline">Usage & keys</Link>.</p>
          <button type="button" onClick={deleteSavedHistory} disabled={isDeleting}
            className="mt-4 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
            {isDeleting ? 'Deleting...' : 'Delete all saved history'}
          </button>
        </section>
      </div>
    </div>
  );
}
