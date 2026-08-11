import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "../components/ChatPanel";
import { toApiError } from "../services/services";

/**
 * Conversation state for the chat-style pages.
 *
 * A failed request becomes an error bubble in the thread instead of a silent
 * console log, and the user's own message is always kept.
 */
export function useChat(sender: (text: string) => Promise<string>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const counter = useRef(0);

  // Keep the latest sender without re-creating `sendMessage` on every render.
  const senderRef = useRef(sender);
  senderRef.current = sender;

  const nextId = () => {
    counter.current += 1;
    return `m${counter.current}`;
  };

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: nextId(), role: "user", text: trimmed },
    ]);
    setIsLoading(true);

    try {
      const reply = await senderRef.current(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: "assistant",
          text: reply || "The service returned an empty response.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
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
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
