export const API_URL = "/api/v1";

/** Provider chosen on the API key screen, shown in the top bar. */
export const PROVIDER_STORAGE_KEY = "activeProvider";

/**
 * Document AI keeps no local state: the indexes are persisted server-side per
 * API key, so the page asks /rag-documents/ what exists instead of caching a
 * name here that could disagree with the server.
 */
