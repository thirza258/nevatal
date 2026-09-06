export const LEGACY_API_KEY_STORAGE_KEY = "apiKey";

export const getLegacyApiKey = (): string | null => {
  return localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY);
};

export const clearLegacyApiKey = () => {
  localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
};

export const cookieRequestConfig = {
  withCredentials: true,
} as const;

/**
 * Forget every stored conversation.
 *
 * Threads are kept per tool so a reload does not lose context, which means
 * signing out has to clear them: on a shared browser the next person should not
 * find the last one's chat. Saved prompt templates are deliberately left —
 * they are a library someone built, not a trace of a session.
 */
export const clearConversations = () => {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("conversation:")
    );
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Nothing stored, or storage is blocked: nothing to clear either way.
  }
};
