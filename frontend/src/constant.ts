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
