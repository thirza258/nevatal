import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ChatPanel, { type ChatMessage } from '../components/ChatPanel';
import { conversationStorageKey } from '../constant';
import { useChat } from '../hooks/useChat';
import type { SavedExchange } from '../interface';
import { historyToolName } from '../services/history';
import services, { toApiError } from '../services/services';

function SavedChat({ entry }: { entry: SavedExchange }) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  // A saved generation includes the context used for that answer. Link these
  // turns so Reply can reconstruct it after a reload on another browser.
  const seed: ChatMessage[] = [...entry.conversation,
    { role: 'user' as const, content: entry.prompt },
    { role: 'assistant' as const, content: entry.response },
  ].map((turn, index, turns) => ({
    id: `saved-${entry.id}-${index}`, role: turn.role, text: turn.content,
    ...(index > 0 && turns[index - 1].role === 'assistant' && turn.role === 'user'
      ? { replyTo: `saved-${entry.id}-${index - 1}` } : {}),
  }));
  const chat = useChat(
    (text, conversation) => services.replyToHistory(entry.id, text, conversation),
    conversationStorageKey(`/history/${entry.id}`), seed,
  );

  const deleteExchange = async () => {
    if (!window.confirm('Delete this saved exchange and its browser chat? This cannot be undone.')) return;
    setIsDeleting(true);
    setError('');
    try {
      await services.deleteHistory(entry.id);
      navigate('/memory', { replace: true });
    } catch (cause) {
      setError(toApiError(cause).message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full min-w-0 flex flex-col gap-3">
      <header className="flex-shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Saved chat · {historyToolName(entry.method)}</h1>
            <p className="mt-1 text-xs text-gray-500 break-words">
              <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
              {entry.model && ` · ${entry.model}`}
            </p>
          </div>
          <button type="button" onClick={deleteExchange} disabled={isDeleting || chat.isLoading}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
            {isDeleting ? 'Deleting...' : 'Delete saved chat'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">Choose Reply on an answer to respond. Use Remember to include a message in future replies here.</p>
        {entry.method === 'rag_chat' && <p className="mt-1 text-xs text-gray-500">Replies here use saved text. Open <Link to="/document-ai" className="text-blue-600 underline">Document AI</Link> to search your current documents.</p>}
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      </header>
      <div className="flex-1 min-h-0">
        <ChatPanel {...chat.controls} messages={chat.messages} isLoading={chat.isLoading}
          onSend={chat.sendMessage} requireReply disabled={isDeleting}
          emptyState={<p className="text-gray-500">This exchange has no messages.</p>} />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState<{ id: string; entry?: SavedExchange; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!id || !/^\d+$/.test(id)) return;
    services.getHistoryEntry(Number(id)).then(
      (entry) => { if (active) setLoaded({ id, entry }); },
      (cause) => { if (active) setLoaded({ id, error: toApiError(cause).message }); },
    );
    return () => { active = false; };
  }, [id, attempt]);

  if (!id || !/^\d+$/.test(id)) return <p role="alert">This saved chat could not be found.</p>;
  if (loaded?.id !== id) return <p role="status" className="text-sm text-gray-500">Loading saved chat...</p>;
  if (!loaded.entry) return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p role="alert" className="text-red-700">{loaded.error}</p>
      <button type="button" className="mt-3 text-blue-600 hover:underline" onClick={() => {
        setLoaded(undefined); setAttempt((value) => value + 1);
      }}>Try again</button>
    </div>
  );
  return <SavedChat key={loaded.entry.id} entry={loaded.entry} />;
}
