import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type { ChatMessage } from "../components/ChatPanel";
import type { ChatTurn } from "../interface";
import { toApiError } from "../services/services";
import { readMessages } from '../services/memory';

/** A send gets only the selected reply context and remembered messages. */
type Sender = (text: string, conversation: ChatTurn[]) => Promise<string>;

/**
 * Recent messages kept in this browser, in addition to remembered exchanges.
 * The backend separately caps the context actually sent to the model.
 */
const STORED_MESSAGE_LIMIT = 60;

const readThread = (storageKey?: string): ChatMessage[] => {
  if (!storageKey) return [];

  return readMessages(storageKey);
};

const writeThread = (storageKey: string | undefined, messages: ChatMessage[]) => {
  if (!storageKey) return;

  try {
    if (messages.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    const remembered = new Set(selectedContextMessages(messages));
    let recentStart = Math.max(0, messages.length - STORED_MESSAGE_LIMIT);
    if (messages[recentStart]?.role === 'assistant' && messages[recentStart - 1]?.role === 'user') recentStart -= 1;
    localStorage.setItem(
      storageKey,
      JSON.stringify(messages.filter((message, index) => index >= recentStart
        || remembered.has(message)))
    );
  } catch {
    // Storage can be full or blocked; the thread still works in memory.
  }
};

/** The thread as the provider should see it: no error bubbles, no ids. */
export const toConversation = (messages: ChatMessage[]): ChatTurn[] =>
  messages
    .filter((message) => !message.isError && message.text.trim())
    .map((message) => ({ role: message.role, content: message.text }));

/** Only the chosen reply branch and explicitly remembered exchanges are context. */
function selectedContextMessages(messages: ChatMessage[], replyToId?: string | null): ChatMessage[] {
  const selected = new Set<number>();
  const include = (index: number) => {
    if (index < 0 || selected.has(index) || messages[index].isError) return;
    selected.add(index);
    const message = messages[index];
    if (message.role === 'assistant' && messages[index - 1]?.role === 'user') include(index - 1);
    if (message.replyTo) include(messages.findIndex((entry) => entry.id === message.replyTo));
  };
  messages.forEach((message, index) => {
    if (message.remembered || message.id === replyToId) include(index);
  });
  return messages.filter((_, index) => selected.has(index));
}

export const conversationForReply = (messages: ChatMessage[], replyToId?: string | null): ChatTurn[] =>
  toConversation(selectedContextMessages(messages, replyToId));

/**
 * Conversation state for the chat-style pages, with its memory.
 *
 * Reply selects the exchange to follow up on; remembered messages are included
 * in new questions too. Other displayed messages are not automatically sent.
 * With a `storageKey` the thread is kept in this
 * browser, so a reload restores messages and remembered selections.
 * "Clear chat" removes the browser copy; saved history is managed separately.
 *
 * The thread is held in a ref as well as in state, and every change goes
 * through `commit`. That is not redundancy: a `setState` updater does not run
 * until React renders, so reading the thread out of one would hand the sender
 * an empty history — the request goes out before the render happens.
 *
 * A failed request becomes an error bubble in the thread instead of a silent
 * console log, and is left out of what the model is sent.
 */
export function useChat(sender: Sender, storageKey?: string, initialMessages: ChatMessage[] = []) {
  const restore = () => {
    const stored = readThread(storageKey);
    return stored.length > 0 ? stored : initialMessages;
  };
  const [thread, setThread] = useState(() => ({ storageKey, messages: restore() }));
  const [isLoading, setIsLoading] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const replyToRef = useRef<string | null>(null);
  const threadRef = useRef(thread);
  const requestId = useRef(0);
  const isSending = useRef(false);

  // A different page or set of documents is a different conversation. Reset
  // before its children render, so they cannot send the previous context.
  if (thread.storageKey !== storageKey) {
    const next = { storageKey, messages: restore() };
    threadRef.current = next;
    requestId.current += 1;
    isSending.current = false;
    setThread(next);
    setIsLoading(false);
    replyToRef.current = null;
    setReplyToId(null);
  }

  useEffect(() => () => {
    // A reply arriving after navigation/sign-out must not write the old thread
    // back into storage or overwrite a thread opened in a new mount.
    requestId.current += 1;
    isSending.current = false;
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    const syncMemory = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      if (event.storageArea && event.storageArea !== localStorage) return;
      // Another tab may have forgotten or deleted this chat. Replace our
      // snapshot and invalidate pending work so it cannot restore old memory.
      const next = { storageKey, messages: readThread(storageKey) };
      threadRef.current = next;
      requestId.current += 1;
      isSending.current = false;
      replyToRef.current = null;
      setThread(next);
      setReplyToId(null);
      setIsLoading(false);
    };
    window.addEventListener('storage', syncMemory);
    return () => window.removeEventListener('storage', syncMemory);
  }, [storageKey]);

  // Keep the latest sender without re-creating `sendMessage` on every render.
  const senderRef = useRef(sender);
  senderRef.current = sender;

  const commit = useCallback((messages: ChatMessage[]) => {
    const next = { storageKey: threadRef.current.storageKey, messages };
    threadRef.current = next;
    setThread(next);
    writeThread(next.storageKey, messages);
  }, []);

  const selectReply = useCallback((id: string) => {
    if (isSending.current || !threadRef.current.messages.some((message) => message.id === id && !message.isError)) return;
    replyToRef.current = id;
    setReplyToId(id);
  }, []);

  const cancelReply = useCallback(() => {
    replyToRef.current = null;
    setReplyToId(null);
  }, []);

  const toggleMemory = useCallback((id: string) => {
    commit(threadRef.current.messages.map((message) => message.id === id
      ? { ...message, remembered: !message.remembered } : message));
  }, [commit]);

  const clearMemory = useCallback(() => {
    commit(threadRef.current.messages.map((message) => ({ ...message, remembered: false })));
  }, [commit]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending.current) return;
      isSending.current = true;
      const id = ++requestId.current;

      const replyTo = replyToRef.current;
      const history = conversationForReply(threadRef.current.messages, replyTo);

      commit([...threadRef.current.messages, { id: uuid(), role: "user", text: trimmed, ...(replyTo ? { replyTo } : {}) }]);
      cancelReply();
      setIsLoading(true);

      try {
        const reply = await senderRef.current(trimmed, history);
        if (requestId.current !== id) return;
        commit([
          ...threadRef.current.messages,
          {
            id: uuid(),
            role: "assistant",
            text: reply || "The service returned an empty response.",
          },
        ]);
      } catch (error) {
        if (requestId.current !== id) return;
        commit([
          ...threadRef.current.messages,
          {
            id: uuid(),
            role: "assistant",
            text: toApiError(error).message,
            isError: true,
          },
        ]);
      } finally {
        if (requestId.current === id) {
          isSending.current = false;
          setIsLoading(false);
        }
      }
    },
    [commit, cancelReply]
  );

  const clearMessages = useCallback(() => {
    requestId.current += 1;
    isSending.current = false;
    setIsLoading(false);
    cancelReply();
    commit([]);
  }, [commit, cancelReply]);

  return {
    messages: thread.messages, isLoading, sendMessage, clearMessages,
    selectReply, toggleMemory, clearMemory,
    contextCount: conversationForReply(thread.messages, replyToId).length,
    controls: { replyToId, onReply: selectReply, onCancelReply: cancelReply, onToggleMemory: toggleMemory, onClearMemory: clearMemory },
  };
}
