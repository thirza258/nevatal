export const API_URL = "/api/v1";

/** Provider chosen on the API key screen, shown in the top bar. */
export const PROVIDER_STORAGE_KEY = "activeProvider";

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
