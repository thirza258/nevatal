import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../components/ChatPanel';
import type { ChatTurn } from '../interface';
import { conversationForReply, toConversation, useChat } from './useChat';

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

  it('switches to the current page thread without copying the previous page', async () => {
    const promptKey = 'conversation:/prompt';
    const explainerKey = 'conversation:/explainer';
    localStorage.setItem(promptKey, JSON.stringify([message({ text: 'write a poem', remembered: true })]));
    localStorage.setItem(explainerKey, JSON.stringify([message({ text: 'explain gravity', remembered: true })]));
    const sender = vi.fn(async () => 'explanation');
    const { result, rerender } = renderHook(({ key }) => useChat(sender, key), {
      initialProps: { key: promptKey },
    });

    rerender({ key: explainerKey });
    expect(result.current.messages.map((m) => m.text)).toEqual(['explain gravity']);
    await act(async () => { await result.current.sendMessage('give an example'); });
    expect(sender).toHaveBeenCalledWith('give an example', [
      { role: 'user', content: 'explain gravity' },
    ]);
    expect(JSON.parse(localStorage.getItem(promptKey)!)[0].text).toBe('write a poem');
  });

  it('drops a pending reply when the page context changes', async () => {
    let finish!: (text: string) => void;
    const sender = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const { result, rerender } = renderHook(({ key }) => useChat(sender, key), {
      initialProps: { key: 'old-documents' },
    });
    let pending!: Promise<void>;
    act(() => { pending = result.current.sendMessage('summarize the old document'); });
    rerender({ key: 'new-documents' });
    await act(async () => { finish('facts from the removed document'); await pending; });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem('new-documents')).toBeNull();
  });

  it('does not let a cleared request overwrite or unlock a new conversation', async () => {
    let finishOld!: (text: string) => void;
    let finishNew!: (text: string) => void;
    const sender = vi.fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => { finishOld = resolve; }))
      .mockImplementationOnce(() => new Promise<string>((resolve) => { finishNew = resolve; }));
    const { result } = renderHook(() => useChat(sender, 'thread'));
    let oldRequest!: Promise<void>;
    let newRequest!: Promise<void>;
    act(() => { oldRequest = result.current.sendMessage('old question'); });
    act(() => result.current.clearMessages());
    act(() => { newRequest = result.current.sendMessage('new question'); });
    await act(async () => { finishOld('old answer'); await oldRequest; });
    expect(result.current.messages.map((m) => m.text)).toEqual(['new question']);
    expect(result.current.isLoading).toBe(true);

    await act(async () => { finishNew('new answer'); await newRequest; });
    expect(result.current.messages.map((m) => m.text)).toEqual(['new question', 'new answer']);
    expect(sender.mock.calls[1][1]).toEqual([]);
  });

  it('does not restore a stored conversation after leaving the page and clearing storage', async () => {
    let finish!: (text: string) => void;
    const sender = () => new Promise<string>((resolve) => { finish = resolve; });
    const { result, unmount } = renderHook(() => useChat(sender, 'thread'));
    let pending!: Promise<void>;
    act(() => { pending = result.current.sendMessage('old question'); });
    unmount();
    localStorage.clear();
    await act(async () => { finish('late answer'); await pending; });
    expect(localStorage.getItem('thread')).toBeNull();
  });

  it('applies memory changes from another tab and cannot restore a chat deleted there', async () => {
    const key = 'conversation:/prompt';
    localStorage.setItem(key, JSON.stringify([message({ remembered: true })]));
    let finish!: (text: string) => void;
    const sender = vi.fn<(text: string, conversation: ChatTurn[]) => Promise<string>>(() => new Promise<string>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useChat(sender, key));
    act(() => {
      localStorage.setItem(key, JSON.stringify([message({ remembered: false })]));
      window.dispatchEvent(new StorageEvent('storage', { key }));
    });
    expect(result.current.contextCount).toBe(0);
    let pending!: Promise<void>;
    act(() => { pending = result.current.sendMessage('New question'); });
    expect(sender.mock.calls[0][1]).toEqual([]);
    act(() => {
      localStorage.removeItem(key);
      window.dispatchEvent(new StorageEvent('storage', { key }));
    });
    await act(async () => { finish('Late reply'); await pending; });
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('uses the latest page settings and prevents overlapping sends', async () => {
    const firstSender = vi.fn(async () => 'beginner answer');
    let finish!: (text: string) => void;
    const latestSender = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const { result, rerender } = renderHook(({ sender }) => useChat(sender), {
      initialProps: { sender: firstSender },
    });
    await act(async () => { await result.current.sendMessage('explain gravity'); });
    rerender({ sender: latestSender });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sendMessage('now give the technical details');
      void result.current.sendMessage('duplicate submit');
    });
    expect(firstSender).toHaveBeenCalledTimes(1);
    expect(latestSender).toHaveBeenCalledTimes(1);
    await act(async () => { finish('expert answer'); await pending; });
  });

  it('replies to the selected exchange and then resets the reply target', async () => {
    const seen: ChatTurn[][] = [];
    const sender = vi.fn(async (_text: string, conversation: ChatTurn[]) => {
      seen.push(conversation);
      return `reply ${seen.length}`;
    });

    const { result } = renderHook(() => useChat(sender));

    await act(async () => {
      await result.current.sendMessage('first question');
    });
    act(() => result.current.selectReply(result.current.messages.at(-1)!.id));
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
    expect(result.current.controls.replyToId).toBeNull();
    await act(async () => { await result.current.sendMessage('an unrelated question'); });
    expect(seen[2]).toEqual([]);
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
    expect(sender.mock.calls[1][1]).toEqual([]);
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

  it('remembers only chosen context, persists selections and forgets without erasing messages', async () => {
    const sender = vi.fn<(text: string, conversation: ChatTurn[]) => Promise<string>>(async () => 'the answer');
    const key = 'conversation:/prompt';
    const first = renderHook(() => useChat(sender, key));
    await act(async () => { await first.result.current.sendMessage('My preferred format is a list.'); });
    act(() => first.result.current.toggleMemory(first.result.current.messages[0].id));
    first.unmount();
    const next = renderHook(() => useChat(sender, key));
    await act(async () => { await next.result.current.sendMessage('A new topic'); });
    expect(sender.mock.calls.at(-1)?.[1]).toEqual([{ role: 'user', content: 'My preferred format is a list.' }]);
    act(() => next.result.current.clearMemory());
    expect(next.result.current.messages).toHaveLength(4);
    expect(JSON.parse(localStorage.getItem(key)!).every((entry: ChatMessage) => !entry.remembered)).toBe(true);
    await act(async () => { await next.result.current.sendMessage('Another topic'); });
    expect(sender.mock.calls.at(-1)?.[1]).toEqual([]);
  });

  it('keeps remembered exchanges after more than 60 displayed messages', async () => {
    const key = 'conversation:/prompt';
    const sender = vi.fn(async () => 'answer');
    const { result, unmount } = renderHook(() => useChat(sender, key));
    await act(async () => { await result.current.sendMessage('Remember this first question'); });
    act(() => result.current.toggleMemory(result.current.messages[1].id));
    for (let i = 0; i < 31; i++) {
      await act(async () => { await result.current.sendMessage(`Topic ${i}`); });
    }
    unmount();
    const restored = renderHook(() => useChat(sender, key));
    expect(conversationForReply(restored.result.current.messages)).toEqual([
      { role: 'user', content: 'Remember this first question' }, { role: 'assistant', content: 'answer' },
    ]);
  });
});

describe('reply branches', () => {
  const turns = [
    message({ id: 'a', text: 'Question A' }),
    message({ id: 'b', role: 'assistant', text: 'Answer A' }),
    message({ id: 'c', text: 'Unrelated question' }),
    message({ id: 'd', role: 'assistant', text: 'Unrelated answer' }),
    message({ id: 'e', text: 'Expand A', replyTo: 'b' }),
    message({ id: 'f', role: 'assistant', text: 'Expanded A' }),
  ];
  it('includes the selected branch and its ancestors without unrelated exchanges', () => {
    expect(conversationForReply(turns, 'f').map((turn) => turn.content)).toEqual(['Question A', 'Answer A', 'Expand A', 'Expanded A']);
    expect(conversationForReply(turns, 'b').map((turn) => turn.content)).toEqual(['Question A', 'Answer A']);
    expect(conversationForReply(turns)).toEqual([]);
  });
  it('combines remembered context and a reply once, in conversation order', () => {
    expect(conversationForReply(turns.map((turn) => ({ ...turn, remembered: turn.id === 'b' })), 'f')).toHaveLength(4);
  });
});
