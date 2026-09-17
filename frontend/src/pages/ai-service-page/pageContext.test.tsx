import { act, type ComponentType } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PromptPage from './PromptPage';
import ExplainerPage from './ExplainerPage';
import WriterPage from './WriterPage';
import RewriterPage from './RewriterPage';
import ProofreaderPage from './ProofreaderPage';
import SummarizerPage from './SummarizerPage';
import TranslatorPage from './TranslatorPage';
import SentimentPage from './SentimentPage';
import CopyWritingPage from './CopyWritingPage';
import EmailBuilderPage from './EmailBuilderPage';
import PostGenerator from './PostGenerator';
import IdeaGenerator from './IdeaGenerator';
import DataFormatter from './DataFormatter';
import DataAnalysis from './DataAnalysis';
import ImaGenPage from './ImaGenPage';
import DocumentAIPage from './DocumentAIPage';
import RAGPage from './RAGPage';
import BatchPage from './BatchPage';
import type { RagDocument } from '../../interface';

// Keep real pages, hooks and services; fake only the HTTP boundary so these
// tests check the endpoint and payload that would actually reach Django.
const client = vi.hoisted(() => ({
  post: vi.fn(), get: vi.fn(), delete: vi.fn(),
  interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
}));
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, create: () => client } };
});

beforeEach(() => {
  vi.clearAllMocks();
  client.post.mockResolvedValue({ data: { data: '{"response":"Current page result"}' } });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

const open = (Page: ComponentType, path: string) => render(
  <MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>
);
const change = (selector: string, value: string) => {
  const field = document.querySelector(selector);
  if (!field) throw new Error(`Missing field ${selector}`);
  fireEvent.change(field, { target: { value } });
};
const submit = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

interface TextPageCase {
  name: string;
  Page: ComponentType;
  route: string;
  endpoint: string;
  button: string;
  fields: Record<string, string>;
  contains?: string[];
  body?: Record<string, unknown>;
  unchecked?: string[];
}

const textPages: TextPageCase[] = [
  { name: 'Prompt', Page: PromptPage, route: '/prompt', endpoint: '/prompt/', button: 'Send',
    fields: { textarea: 'Explain this current question' }, body: { prompt: 'Explain this current question', conversation: [] } },
  { name: 'Explainer', Page: ExplainerPage, route: '/explainer', endpoint: '/explainer/', button: 'Explain',
    fields: { textarea: 'gravity', '#explain-level': 'an expert who wants the precise, technical account', '#explain-style': 'an explanation that starts from first principles' },
    contains: ['gravity', 'expert', 'first principles'], body: { conversation: [] } },
  { name: 'Writer', Page: WriterPage, route: '/writer', endpoint: '/writer/', button: 'Write draft',
    fields: { '#writer-topic': 'Our current project', '#writer-type': 'report', '#writer-tone': 'professional', '#writer-length': 'short', '#writer-audience': 'engineers', '#writer-key-points': 'Launch on Monday' },
    contains: ['Our current project', 'report', 'professional', '200 words', 'engineers', 'Launch on Monday'] },
  { name: 'Rewriter', Page: RewriterPage, route: '/rewriter', endpoint: '/rewriter/', button: 'Rewrite',
    fields: { textarea: 'The project is due on Monday.', '#rewrite-goal': 'make it significantly shorter without losing the key information', '#rewrite-tone': 'formal' },
    contains: ['The project is due on Monday.', 'significantly shorter', 'formal'] },
  { name: 'Proofreader', Page: ProofreaderPage, route: '/proofreader', endpoint: '/proofreader/', button: 'Proofread',
    fields: { textarea: 'The colour is blue.', '#proofread-mode': 'spelling, grammar, and punctuation only, leaving the wording untouched', '#proofread-variant': 'British English' },
    unchecked: ['#proofread-list-changes'], contains: ['The colour is blue.', 'wording untouched', 'British English', 'no commentary'] },
  { name: 'Summarizer', Page: SummarizerPage, route: '/summarizer', endpoint: '/summarizer/', button: 'Summarize',
    fields: { textarea: 'The launch is Monday. The budget is 50.', '#summary-length': 'a very brief summary of one or two sentences', '#summary-format': 'a bulleted list', '#summary-focus': 'budget' },
    contains: ['The launch is Monday. The budget is 50.', 'one or two sentences', 'bulleted list', 'Focus especially on: budget'] },
  { name: 'Translator', Page: TranslatorPage, route: '/translator', endpoint: '/translator/', button: 'Translate',
    fields: { textarea: 'Where is the station?', '#translate-source': 'English', '#translate-target': 'French', '#translate-register': 'formal' },
    contains: ['Where is the station?', 'formal'], body: { source_language: 'English', target_language: 'French' } },
  { name: 'Sentiment Analysis', Page: SentimentPage, route: '/sentiment', endpoint: '/sentiment-analyzer/', button: 'Analyze sentiment',
    fields: { textarea: 'Great food. Slow service.', '#sentiment-depth': 'aspects' },
    contains: ['Great food. Slow service.', 'one row per topic'] },
  { name: 'Copywriting', Page: CopyWritingPage, route: '/copywriting', endpoint: '/copywriting/', button: 'Generate copy',
    fields: { '#copy-product': 'A budgeting app', '#copy-channel': 'a short paid ad', '#copy-tone': 'technical and precise', '#copy-goals': 'Start a trial', '#copy-audience': 'accountants', '#copy-usp': 'Local storage' },
    contains: ['A budgeting app', 'short paid ad', 'technical and precise', 'Start a trial', 'accountants', 'Local storage'] },
  { name: 'Email Builder', Page: EmailBuilderPage, route: '/email-builder', endpoint: '/email/', button: 'Generate email',
    fields: { '#email-context': 'Launch moved to Monday', '#email-recipients': 'Team', '#email-sender': 'Alex', '#email-prompt': 'Confirm the launch', '#email-tone': 'direct and brief', '#email-length': 'no more than three short sentences' },
    contains: ['Confirm the launch', 'direct and brief', 'three short sentences'], body: { context: 'Launch moved to Monday', recipients: 'Team', sender: 'Alex' } },
  { name: 'Social Caption', Page: PostGenerator, route: '/social-caption', endpoint: '/social-media-post-generator/', button: 'Generate caption',
    fields: { textarea: 'Launch moved to Monday', '#post-platform': 'LinkedIn', '#post-tone': 'professional and credible', '#post-hashtags': '0', '#post-brand': 'Nevatal' },
    unchecked: ['#post-emojis', '#post-cta'], body: { prompt: 'Launch moved to Monday', platform: 'LinkedIn', tone: 'professional and credible', hashtag_count: 0, include_emojis: false, include_cta: false, brand_name: 'Nevatal' } },
  { name: 'Idea Generator', Page: IdeaGenerator, route: '/ideas', endpoint: '/idea-generator/', button: 'Generate 3 ideas',
    fields: { textarea: 'A budgeting app', '#idea-kind': 'names', '#idea-count': '3', '#idea-constraints': 'One word only', '#output-format': 'json' },
    body: { prompt: 'A budgeting app', kind: 'names', count: 3, constraints: 'One word only', output_format: 'json' } },
  { name: 'Data Formatter', Page: DataFormatter, route: '/data-formatter', endpoint: '/data-formatter/', button: 'Validate',
    fields: { textarea: '{"price": 5}', '#data-mode': 'validate', '#data-instructions': 'Check required fields' },
    body: { prompt: '{"price": 5}', mode: 'validate', instructions: 'Check required fields', output_format: 'markdown' } },
];

describe('current context from every text page', () => {
  it.each(textPages)('$name sends its current controls and source to its own endpoint', async (test) => {
    open(test.Page, test.route);
    for (const [selector, value] of Object.entries(test.fields)) change(selector, value);
    for (const selector of test.unchecked ?? []) fireEvent.click(document.querySelector(selector)!);
    submit(test.button);
    await screen.findByText('Current page result');

    expect(client.post).toHaveBeenCalledTimes(1);
    const [endpoint, body] = client.post.mock.calls[0];
    expect(endpoint).toBe(test.endpoint);
    expect(body).toMatchObject(test.body ?? {});
    for (const text of test.contains ?? []) expect(body.prompt).toContain(text);
  });

  it('updates Explainer settings on a follow-up while keeping its own conversation', async () => {
    open(ExplainerPage, '/explainer');
    change('textarea', 'gravity');
    submit('Explain');
    await screen.findByText('Current page result');
    change('#explain-level', 'an expert who wants the precise, technical account');
    submit('Reply to message');
    change('textarea', 'give more detail');
    submit('Send reply');
    await waitFor(() => expect(client.post).toHaveBeenCalledTimes(2));
    expect(client.post.mock.calls[1][1]).toMatchObject({
      prompt: expect.stringContaining('an expert'),
      conversation: [
        { role: 'user', content: 'gravity' },
        { role: 'assistant', content: 'Current page result' },
      ],
    });
  });
});

const documents: RagDocument[] = [
  { document_id: 1, source: 'old.pdf', created_at: '2026-09-01' },
  { document_id: 2, source: 'current.pdf', created_at: '2026-09-02' },
];

describe('document context', () => {
  it('sends exactly the listed documents and drops old history after a removal', async () => {
    client.get.mockResolvedValue({ data: { data: documents } });
    client.delete.mockResolvedValue({ data: { data: { documents: [documents[1]] } } });
    open(DocumentAIPage, '/document-ai');
    await screen.findByText('old.pdf');
    change('textarea', 'Summarize these documents');
    submit('Send');
    await screen.findByText('Current page result');
    expect(client.post.mock.calls[0][1]).toMatchObject({ document_ids: [1, 2], conversation: [] });

    fireEvent.click(screen.getByRole('button', { name: 'Remove old.pdf' }));
    await waitFor(() => expect(screen.queryByText('Current page result')).toBeNull());
    change('textarea', 'What is the deadline?');
    submit('Send');
    await screen.findByText('Current page result');
    expect(client.post.mock.calls[1][0]).toBe('/rag-chat/');
    expect(client.post.mock.calls[1][1]).toMatchObject({ document_ids: [2], conversation: [] });
  });

  it('does not reuse a conversation when a replacement upload reuses the same file name and ID', async () => {
    const props = { onAddDocument: vi.fn(), onRemoveDocument: vi.fn() };
    const { rerender } = render(<RAGPage {...props} documents={[documents[0]]} />);
    change('textarea', 'Summarize this document');
    submit('Send');
    await screen.findByText('Current page result');
    rerender(<RAGPage {...props} documents={[{ ...documents[0], created_at: '2026-09-17' }]} />);
    expect(screen.queryByText('Current page result')).toBeNull();
  });
});

describe('data and image pages', () => {
  it('Data Analysis sends the current CSV and question, and discards a result after clearing', async () => {
    let finish!: (value: unknown) => void;
    client.post.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    open(DataAnalysis, '/data-analysis');
    change('textarea', 'region,units\nNorth,10');
    change('#analysis-question', 'Which region sold most?');
    submit('Analyse');
    const [path, body] = client.post.mock.calls[0];
    expect(path).toBe('/data-analysis/');
    expect(body.get('text')).toBe('region,units\nNorth,10');
    expect(body.get('prompt')).toBe('Which region sold most?');
    submit('Clear');
    await act(async () => { finish({ data: { data: { insights: 'Old data insight', charts: [] } } }); });
    expect(screen.queryByText('Old data insight')).toBeNull();
  });

  it('Image Generation sends the current style and framing, and discards a result after clearing', async () => {
    let finish!: (value: unknown) => void;
    client.post.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    open(ImaGenPage, '/image-generation');
    change('textarea', 'A fox in the forest');
    change('#image-style', 'a pencil sketch');
    change('#image-aspect', 'portrait 3:4 framing');
    submit('Generate image');
    expect(client.post.mock.calls[0]).toEqual([
      '/image/', { prompt: 'A fox in the forest Render it as a pencil sketch. Use portrait 3:4 framing.' },
    ]);
    submit('Clear');
    await act(async () => { finish({ data: { data: { image_base64: 'cG5n', mime_type: 'image/png' } } }); });
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('Batch Runner', () => {
  it.each([
    ['translate', '/translator/'], ['summarize', '/summarizer/'],
    ['proofread', '/proofreader/'], ['rewrite', '/rewriter/'],
    ['sentiment', '/sentiment-analyzer/'], ['copywriting', '/copywriting/'],
    ['format', '/data-formatter/'],
  ])('runs %s with the selected tool and a separate source for each item', async (tool, endpoint) => {
    open(BatchPage, '/batch');
    change('#batch-tool', tool);
    change('textarea', 'first source\nsecond source');
    submit('Run batch');
    await waitFor(() => expect(client.post).toHaveBeenCalledTimes(2));
    expect(client.post.mock.calls.map(([path]) => path)).toEqual([endpoint, endpoint]);
    expect(client.post.mock.calls.map(([, body]) => body.prompt)).toEqual(['first source', 'second source']);
    for (const [, body, config] of client.post.mock.calls) {
      expect(body.conversation).toBeUndefined();
      expect(config.headers).toEqual({ 'X-Nevatal-Batch': '1' });
    }
    await screen.findAllByText('done');
  });
});
