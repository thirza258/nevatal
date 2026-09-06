import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../components/ChatPanel';
import type { ChatTurn } from '../interface';
import { toConversation, useChat } from './useChat';

const message = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 'm1',
  role: 'user',
  text: 'hello',
  ...over,
});

describe('toConversation', () => {
  it('keeps the turns in order with the roles the provider expects', () => {
    expect(
      toConversation([
        message({ id: 'm1', role: 'user', text: 'who wrote Dune?' }),
        message({ id: 'm2', role: 'assistant', text: 'Frank Herbert.' }),
      ])
    ).toEqual([
      { role: 'user', content: 'who wrote Dune?' },
      { role: 'assistant', content: 'Frank Herbert.' },
    ]);
  });

  it('leaves out error bubbles and blank turns', () => {
    expect(
      toConversation([
        message({ id: 'm1', text: 'first' }),
        message({ id: 'm2', role: 'assistant', text: 'Request failed', isError: true }),
        message({ id: 'm3', text: '   ' }),
      ])
    ).toEqual([{ role: 'user', content: 'first' }]);
  });
});

describe('useChat', () => {
  beforeEach(() => localStorage.clear());

  it('sends the turns so far, which is what makes a follow-up follow on', async () => {
    const seen: ChatTurn[][] = [];
    const sender = vi.fn(async (_text: string, conversation: ChatTurn[]) => {
      seen.push(conversation);
      return `reply ${seen.length}`;
    });

    const { result } = renderHook(() => useChat(sender));

    await act(async () => {
      await result.current.sendMessage('first question');
    });
    await act(async () => {
      await result.current.sendMessage('and the second?');
    });

    // The first send has nothing behind it; the second carries the whole
    // exchange. This is the assertion that would have caught reading the
    // thread inside a setState updater, where both would have been empty.
    expect(seen[0]).toEqual([]);
    expect(seen[1]).toEqual([
      { role: 'user', content: 'first question' },
      { role: 'assistant', content: 'reply 1' },
    ]);
    expect(result.current.messages.map((m) => m.text)).toEqual([
      'first question',
      'reply 1',
      'and the second?',
      'reply 2',
    ]);
  });

  it('turns a failure into an error bubble and never replays it', async () => {
    const sender = vi
      .fn<(text: string, conversation: ChatTurn[]) => Promise<string>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    const { result } = renderHook(() => useChat(sender));

    await act(async () => {
      await result.current.sendMessage('first');
    });
    expect(result.current.messages.at(-1)?.isError).toBe(true);

    await act(async () => {
      await result.current.sendMessage('second');
    });
    expect(sender.mock.calls[1][1]).toEqual([{ role: 'user', content: 'first' }]);
  });

  it('restores a stored thread and forgets it on clear', async () => {
    const key = 'nevatal:conversation:/prompt';
    localStorage.setItem(
      key,
      JSON.stringify([{ id: 'm1', role: 'user', text: 'earlier' }])
    );

    const sender = vi.fn(async () => 'ok');
    const { result } = renderHook(() => useChat(sender, key));

    expect(result.current.messages.map((m) => m.text)).toEqual(['earlier']);

    // A restored id must not collide with the id of the next message.
    await act(async () => {
      await result.current.sendMessage('next');
    });
    const ids = result.current.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);

    act(() => result.current.clearMessages());
    await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
  });

  it('ignores stored junk instead of failing the page', () => {
    const key = 'nevatal:conversation:/junk';
    localStorage.setItem(key, '{not json');
    expect(renderHook(() => useChat(vi.fn(), key)).result.current.messages).toEqual([]);

    localStorage.setItem(key, JSON.stringify([{ role: 'wizard', text: 5 }, null]));
    expect(renderHook(() => useChat(vi.fn(), key)).result.current.messages).toEqual([]);
  });
});
