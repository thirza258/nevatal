import { act } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import services from '../../services/services';
import { COURSES, coursePath } from '../../courses/catalog';
import { DEFAULT_PAGE_TITLE, PROVIDER_STORAGE_KEY, SITE_URL } from '../../constant';

beforeEach(() => {
  vi.spyOn(services, 'checkApiKeySession').mockRejectedValue(new Error('No session'));
  vi.spyOn(services, 'getHistory').mockResolvedValue([]);
  vi.spyOn(services, 'listModels').mockResolvedValue({ provider: 'openrouter', models: [], default_model: '' });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const open = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const robots = () => document.querySelector('meta[name="robots"]')?.getAttribute('content');

describe('public courses', () => {
  it.each(COURSES)('opens $title without an API key and renders its complete lessons', async (course) => {
    open(coursePath(course));
    await screen.findByRole('heading', { level: 1, name: course.title });
    expect(screen.getAllByRole('heading', { name: 'Try it yourself' })).toHaveLength(3);
    expect(screen.getAllByRole('heading', { name: 'Check your result' })).toHaveLength(3);
    expect(screen.queryByRole('heading', { name: 'Start with your API key' })).toBeNull();
    expect(canonical()).toBe(`${SITE_URL}${coursePath(course)}`);
    expect(document.title).toContain(course.title);
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(course.description);
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(robots()).not.toContain('noindex');
    expect(services.getHistory).not.toHaveBeenCalled();
  });

  it('keeps lessons visible while a returning visitor has a pending or failed session check', async () => {
    localStorage.setItem(PROVIDER_STORAGE_KEY, 'gemini');
    let rejectSession!: (error: Error) => void;
    vi.mocked(services.checkApiKeySession).mockImplementation(() => new Promise((_, reject) => { rejectSession = reject; }));
    open(coursePath(COURSES[0]));
    await screen.findByRole('heading', { level: 1, name: COURSES[0].title });
    expect(screen.queryByText('Starting Nevatal...')).toBeNull();
    await act(async () => { rejectSession(new Error('Backend unavailable')); });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(COURSES[0].title);
  });

  it('shows public courses to signed-in visitors and opens the selected tool without generating', async () => {
    vi.mocked(services.checkApiKeySession).mockResolvedValue(true);
    const generate = vi.spyOn(services, 'postExplainer');
    open(coursePath(COURSES[0]));
    fireEvent.click(await screen.findByRole('link', { name: 'Open Explainer' }));
    await screen.findByRole('heading', { name: 'Explainer' });
    expect(generate).not.toHaveBeenCalled();
  });

  it('returns a signed-out learner to the exercise tool after connecting a key', async () => {
    const validate = vi.spyOn(services, 'validateApiKey').mockResolvedValue(true);
    const generate = vi.spyOn(services, 'postExplainer');
    open(coursePath(COURSES[0]));
    fireEvent.click(await screen.findByRole('link', { name: 'Open Explainer' }));
    await screen.findByRole('heading', { name: 'Start with your API key' });
    vi.mocked(services.checkApiKeySession).mockResolvedValue(true);
    fireEvent.change(screen.getByLabelText('OpenRouter API key'), { target: { value: 'sk-or-v1-course-example-not-a-real-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open the workspace' }));
    await screen.findByRole('heading', { name: 'Explainer' });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(generate).not.toHaveBeenCalled();
  });

  it('navigates between the catalog, a course, About and Home and restores metadata', async () => {
    open('/courses');
    fireEvent.click(await screen.findByRole('link', { name: COURSES[1].title }));
    await screen.findByRole('heading', { level: 1, name: COURSES[1].title });
    fireEvent.click(screen.getByRole('link', { name: `Next: ${COURSES[2].title}` }));
    await screen.findByRole('heading', { level: 1, name: COURSES[2].title });
    expect(canonical()).toBe(`${SITE_URL}${coursePath(COURSES[2])}`);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'About' }));
    await screen.findByRole('heading', { level: 1, name: 'About Nevatal' });
    expect(canonical()).toBe(`${SITE_URL}/about`);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Nevatal' }));
    await screen.findByRole('heading', { name: /17 focused AI tools/ });
    expect(document.title).toBe(DEFAULT_PAGE_TITLE);
    expect(canonical()).toBe(`${SITE_URL}/`);
  });

  it('marks unknown courses noindex and removes that state when returning to the catalog', async () => {
    open('/courses/missing-course');
    await screen.findByRole('heading', { name: 'Page not found' });
    expect(robots()).toBe('noindex, follow');
    expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('link', { name: 'Browse courses' }));
    await screen.findByRole('heading', { name: 'Choose a course' });
    await waitFor(() => expect(robots()).not.toContain('noindex'));
    expect(canonical()).toBe(`${SITE_URL}/courses`);
  });
});
