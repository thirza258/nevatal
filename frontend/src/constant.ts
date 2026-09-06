export const API_URL = "/api/v1";

/** Provider chosen on the API key screen, shown in the top bar. */
export const PROVIDER_STORAGE_KEY = "activeProvider";

/**
 * Model chosen from the provider's catalogue, sent with every generation.
 *
 * Only a provider that publishes a catalogue puts anything here — OpenRouter
 * today. The picker clears it whenever the session's provider turns out to have
 * no models to choose from, so swapping keys cannot leave a stale id behind.
 */
export const MODEL_STORAGE_KEY = "activeModel";

/** A model id is not a credential, so it travels as a plain header. */
export const AI_MODEL_HEADER = "X-AI-Model";

/**
 * Marks one request as part of a batch run. Batch items count towards usage —
 * they cost real tokens — but stay out of the history sidebar, which is there
 * for finding a piece of work again.
 */
export const BATCH_HEADER = "X-Nevatal-Batch";

/** Threads kept per tool, so reloading a page does not lose the context. */
export const conversationStorageKey = (tool: string) => `conversation:${tool}`;

/** Saved prompt templates, and the spend threshold that raises a warning. */
export const TEMPLATE_STORAGE_KEY = "promptTemplates";
export const SPEND_ALERT_STORAGE_KEY = "spendAlert";

export const SITE_NAME = "Nevatal";

/**
 * Public origin of the deployed app. Used for canonical URLs and JSON-LD.
 * Changing the domain means changing it in four places: here, `index.html`,
 * `public/robots.txt` and `public/sitemap.xml`.
 */
export const SITE_URL = "https://chat.nevatal.tech";

/** Kept identical to the <title> in index.html so the landing page reads the
 *  same whether it was server-delivered or reached by client navigation. */
export const DEFAULT_PAGE_TITLE =
  "Nevatal — AI Tools Hub for Your Own OpenAI, Gemini or OpenRouter Key";

export const GITHUB_URL = "https://github.com/thirza258/nevatal";

/**
 * Document AI keeps no local state: the indexes are persisted server-side per
 * API key, so the page asks /rag-documents/ what exists instead of caching a
 * name here that could disagree with the server.
 */
