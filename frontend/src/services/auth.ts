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
