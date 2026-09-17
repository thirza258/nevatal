import { act } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { SavedExchange } from '../interface';

const client = vi.hoisted(() => ({
  post: vi.fn(), get: vi.fn(), delete: vi.fn(),
  interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
}));
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, create: () => client } };
});

const markdown = '# Saved answer\n\n' + 'A complete saved paragraph. '.repeat(20)
  + '\n\n| Item | Count |\n| --- | --- |\n| Apples | 4 |\n\n```js\nconst complete = true;\n```\n\nFinal sentence after the old cutoff.';
const entry: SavedExchange = {
  id: 42, method: 'email_generation', prompt: 'Draft a **project update**\nwith the full details. '.repeat(10),
  response: markdown, created_at: '2026-09-17T09:10:00Z', conversation: [], model: 'test-model',
};
let hasHistory = true;
const response = (data: unknown) => ({ data: { data } });

beforeEach(() => {
  vi.clearAllMocks();
  hasHistory = true;
  client.get.mockImplementation(async (path: string) => {
    if (path === '/history/') return response(hasHistory ? [{ ...entry, prompt: entry.prompt.slice(0, 180), response: markdown.slice(0, 180) }] : []);
    if (path === '/history/42/') return response({ ...entry, response: JSON.stringify({ response: markdown }) });
    if (path === '/models/') return response({ provider: 'gemini', models: [], default_model: 'test-model' });
    if (path === '/usage/') return response({ totals: { cost: 0.25 } });
    return response(true);
  });
  client.post.mockResolvedValue(response('{"response":"A targeted follow-up"}'));
  client.delete.mockImplementation(async () => { hasHistory = false; return response({ deleted: 1 }); });
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const open = (path = '/prompt') => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const main = () => within(document.querySelector('main')!);

describe('saved history and memory flows', () => {
  it('opens readable sidebar entries into full Markdown replies with tables and code', async () => {
    open();
    const link = await screen.findByRole('link', { name: /^Open saved Email Builder chat:/ });
    expect(link.textContent).toContain('Draft a project update with the full details.');
    expect(link.textContent).not.toContain('**');
    fireEvent.click(link);
    await screen.findByRole('heading', { name: 'Saved chat · Email Builder' });
    expect(main().getByRole('heading', { name: 'Saved answer' })).toBeTruthy();
    expect(main().getByRole('table').textContent).toContain('Apples4');
    expect(main().getByText('const complete = true;').tagName).toBe('CODE');
    expect(main().getByText('Final sentence after the old cutoff.')).toBeTruthy();
    expect(main().getByText((_, element) => element?.tagName === 'P' && element.textContent === entry.prompt)).toBeTruthy();
    expect(client.post).not.toHaveBeenCalled();
  });

  it('requires a selected Reply and sends that full exchange, then cancels the target', async () => {
    open('/history/42');
    await screen.findByRole('heading', { name: 'Saved chat · Email Builder' });
    fireEvent.change(main().getByRole('textbox'), { target: { value: 'Make it shorter' } });
    expect((main().getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
    click('Reply to message');
    click('Send reply');
    await main().findByText('A targeted follow-up');
    expect(client.post.mock.calls[0][0]).toBe('/history/42/reply/');
    expect(client.post.mock.calls[0][1]).toMatchObject({ prompt: 'Make it shorter', conversation: [
      { role: 'user', content: entry.prompt }, { role: 'assistant', content: markdown },
    ] });
    expect(main().queryByText('Replying to AI')).toBeNull();
  });

  it('lets the memory manager choose context that is used when returning to the tool', async () => {
    localStorage.setItem('conversation:/prompt', JSON.stringify([
      { id: 'm1', role: 'user', text: 'Use concise bullet points.' },
      { id: 'm2', role: 'assistant', text: 'Okay.' },
    ]));
    open('/memory');
    await screen.findByRole('heading', { name: 'Memory & history' });
    fireEvent.click(main().getByText('Prompt'));
    fireEvent.click(main().getByRole('checkbox', { name: 'Remember your message: Use concise bullet points.' }));
    expect(JSON.parse(localStorage.getItem('conversation:/prompt')!)[0].remembered).toBe(true);
    fireEvent.click(screen.getByRole('link', { name: 'Prompt' }));
    await main().findByRole('heading', { name: 'Prompt' });
    fireEvent.change(main().getByRole('textbox'), { target: { value: 'A new question' } });
    click('Send');
    await main().findByText('A targeted follow-up');
    expect(client.post.mock.calls[0][1].conversation).toEqual([{ role: 'user', content: 'Use concise bullet points.' }]);
    click('Forget all');
    expect(JSON.parse(localStorage.getItem('conversation:/prompt')!).some((message: { remembered?: boolean }) => message.remembered)).toBe(false);
  });

  it('deletes a saved exchange and its browser copy and refreshes sidebar history', async () => {
    open('/history/42');
    await screen.findByRole('heading', { name: 'Saved chat · Email Builder' });
    fireEvent.click(main().getAllByRole('button', { name: 'Remember message' })[0]);
    expect(localStorage.getItem('conversation:/history/42')).not.toBeNull();
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    click('Delete saved chat');
    expect(client.delete).not.toHaveBeenCalled();
    click('Delete saved chat');
    await screen.findByRole('heading', { name: 'Memory & history' });
    expect(client.delete).toHaveBeenCalledWith('/history/42/');
    expect(localStorage.getItem('conversation:/history/42')).toBeNull();
    await waitFor(() => expect(screen.queryByRole('link', { name: /^Open saved/ })).toBeNull());
  });

  it('keeps history and memory on a failed deletion and clears both after success', async () => {
    localStorage.setItem('conversation:/explainer', JSON.stringify([{ id: 'x', role: 'user', text: 'A memory', remembered: true }]));
    localStorage.setItem('promptTemplates', 'keep my templates');
    client.delete.mockRejectedValueOnce(new Error('Deletion failed'));
    open('/memory');
    await screen.findByRole('heading', { name: 'Memory & history' });
    click('Delete all saved history');
    await main().findByRole('alert');
    expect(localStorage.getItem('conversation:/explainer')).not.toBeNull();
    expect(screen.getByRole('link', { name: /^Open saved/ })).toBeTruthy();
    click('Delete all saved history');
    await main().findByText('Saved history and browser chats deleted. Usage totals are unchanged.');
    expect(client.delete).toHaveBeenLastCalledWith('/history/');
    expect(localStorage.getItem('conversation:/explainer')).toBeNull();
    expect(localStorage.getItem('promptTemplates')).toBe('keep my templates');
    await waitFor(() => expect(screen.queryByRole('link', { name: /^Open saved/ })).toBeNull());
  });

  it('ignores a late history response after navigating to a different saved chat', async () => {
    const normalGet = client.get.getMockImplementation()!;
    let finish!: (value: ReturnType<typeof response>) => void;
    client.get.mockImplementation((path: string) => {
      if (path === '/history/99/') return new Promise((resolve) => { finish = resolve; });
      return normalGet(path);
    });
    open('/history/99');
    await screen.findByText('Loading saved chat...');
    fireEvent.click(await screen.findByRole('link', { name: /^Open saved/ }));
    await screen.findByRole('heading', { name: 'Saved chat · Email Builder' });
    await act(async () => { finish(response({ ...entry, id: 99, response: 'Stale result' })); });
    expect(main().queryByText('Stale result')).toBeNull();
    expect(main().getByText('Final sentence after the old cutoff.')).toBeTruthy();
  });
});
