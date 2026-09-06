import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "../components/ChatPanel";
import type { ChatTurn } from "../interface";
import { toApiError } from "../services/services";

/** A send gets the thread so far, which is what makes a reply follow on. */
type Sender = (text: string, conversation: ChatTurn[]) => Promise<string>;

/**
 * How much of a thread is kept in this browser. The backend caps how many
 * turns it will replay; keeping a little more here means scrolling back
 * further than the model remembers, which is the right way round.
 */
const STORED_MESSAGE_LIMIT = 60;

const readThread = (storageKey?: string): ChatMessage[] => {
  if (!storageKey) return [];

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (message): message is ChatMessage =>
        Boolean(message) &&
        typeof message.id === "string" &&
        typeof message.text === "string" &&
        (message.role === "user" || message.role === "assistant")
    );
  } catch {
    // A thread we cannot read is not worth failing a page load over.
    return [];
  }
};

const writeThread = (storageKey: string | undefined, messages: ChatMessage[]) => {
  if (!storageKey) return;

  try {
    if (messages.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(
      storageKey,
      JSON.stringify(messages.slice(-STORED_MESSAGE_LIMIT))
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

/**
 * Conversation state for the chat-style pages, with its memory.
 *
 * Every send replays the turns so far, so a follow-up like "and the second
 * one?" means something. With a `storageKey` the thread is kept in this
 * browser, so a reload continues the conversation instead of starting again —
 * and "Clear chat" is the way to deliberately forget it.
 *
 * The thread is held in a ref as well as in state, and every change goes
 * through `commit`. That is not redundancy: a `setState` updater does not run
 * until React renders, so reading the thread out of one would hand the sender
 * an empty history — the request goes out before the render happens.
 *
 * A failed request becomes an error bubble in the thread instead of a silent
 * console log, and is left out of what the model is sent.
 */
export function useChat(sender: Sender, storageKey?: string) {
  const restored = useRef<ChatMessage[] | null>(null);
  if (restored.current === null) restored.current = readThread(storageKey);

  const [messages, setMessages] = useState<ChatMessage[]>(restored.current);
  const [isLoading, setIsLoading] = useState(false);

  const threadRef = useRef<ChatMessage[]>(restored.current);
  // Restored ids must not collide with the ids of new messages.
  const counter = useRef(restored.current.length);

  // Keep the latest sender without re-creating `sendMessage` on every render.
  const senderRef = useRef(sender);
  senderRef.current = sender;

  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  const commit = useCallback((next: ChatMessage[]) => {
    threadRef.current = next;
    setMessages(next);
    writeThread(storageKeyRef.current, next);
  }, []);

  const nextId = () => {
    counter.current += 1;
    return `m${counter.current}`;
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // The thread as it stands before this message: the context that makes
      // the answer a continuation rather than a fresh start.
      const history = toConversation(threadRef.current);

      commit([...threadRef.current, { id: nextId(), role: "user", text: trimmed }]);
      setIsLoading(true);

      try {
        const reply = await senderRef.current(trimmed, history);
        commit([
          ...threadRef.current,
          {
            id: nextId(),
            role: "assistant",
            text: reply || "The service returned an empty response.",
          },
        ]);
      } catch (error) {
        commit([
          ...threadRef.current,
          {
            id: nextId(),
            role: "assistant",
            text: toApiError(error).message,
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [commit]
  );

  const clearMessages = useCallback(() => commit([]), [commit]);

  return { messages, isLoading, sendMessage, clearMessages };
}
