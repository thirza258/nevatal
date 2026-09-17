import type { ChatMessage } from '../components/ChatPanel';

export const CONVERSATION_PREFIX = 'conversation:';

export function conversationKeys(): string[] {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(CONVERSATION_PREFIX)) keys.push(key);
  }
  return keys;
}

export function readMessages(key: string): ChatMessage[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((message): message is ChatMessage => Boolean(message)
      && typeof message.id === 'string' && typeof message.text === 'string'
      && (message.role === 'user' || message.role === 'assistant'));
  } catch { return []; }
}

export function listConversationMemory() {
  return conversationKeys().map((key) => {
    const messages = readMessages(key);
    return { key, messages: messages.length, remembered: messages.filter((message) => message.remembered).length };
  }).filter((thread) => thread.messages > 0);
}

export function forgetConversationMemory(key: string) {
  const messages = readMessages(key).map((message) => ({ ...message, remembered: false }));
  localStorage.setItem(key, JSON.stringify(messages));
}

export function forgetHistoryMemory(id?: number) {
  for (const key of conversationKeys()) {
    if (id === undefined || key === `${CONVERSATION_PREFIX}/history/${id}`) localStorage.removeItem(key);
  }
}
