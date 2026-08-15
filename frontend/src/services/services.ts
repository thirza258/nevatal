import axios from "axios";
import { API_URL } from "../constant";
import type {
  ApiResponse,
  GeneratedImage,
  HistoryEntry,
  RagDocument,
  TransportKey,
  UploadResponse,
} from "../interface";

/**
 * Single client for the whole app. `withCredentials` is required because the
 * API key lives in an httpOnly cookie set by the backend.
 */
const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 120000,
});

/** Error carrying the message the backend actually sent, plus its status. */
export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const FALLBACK_MESSAGE =
  "Something went wrong while contacting the service. Please try again.";

/**
 * Pull a human-readable message out of a backend failure.
 *
 * Views are inconsistent: some return `{error: "..."}`, others return the
 * `{status, message, data}` envelope with the detail in `data`.
 */
const extractErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : FALLBACK_MESSAGE;
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. The model may be busy — please try again.";
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    for (const key of ["error", "detail", "message", "data"]) {
      const value = body[key];
      if (typeof value === "string" && value.trim() && value !== "error") {
        return value;
      }
    }
  }

  if (error.response?.status === 401) {
    return "Your API key was rejected. Please re-enter it.";
  }

  if (!error.response) {
    return "Cannot reach the backend. Check that the server is running.";
  }

  return error.message || FALLBACK_MESSAGE;
};

/** Normalise any thrown value into an ApiError with a usable message. */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return new ApiError(extractErrorMessage(error), status);
};

/**
 * Models are asked for JSON like `{"response": "..."}` but do not always
 * comply, and a malformed payload must not take the page down.
 */
export const unwrapText = (payload: unknown): string => {
  if (payload == null) return "";

  if (typeof payload !== "string") {
    if (typeof payload === "object" && "response" in (payload as object)) {
      return unwrapText((payload as { response: unknown }).response);
    }
    return String(payload);
  }

  const trimmed = payload.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return payload;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && "response" in parsed) {
      const inner = (parsed as { response: unknown }).response;
      return typeof inner === "string" ? inner : JSON.stringify(inner, null, 2);
    }
  } catch {
    // Not JSON after all — show the raw text rather than losing the answer.
  }

  return payload;
};

const HISTORY_CHANGED_EVENT = "nevatal:history-changed";

/** Every recorded generation adds a history row; tell the sidebar to refetch. */
const notifyHistoryChanged = () => {
  window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT));
};

export const onHistoryChanged = (listener: () => void) => {
  window.addEventListener(HISTORY_CHANGED_EVENT, listener);
  return () => window.removeEventListener(HISTORY_CHANGED_EVENT, listener);
};

/** POST a text endpoint and return the clean, unwrapped answer. */
const postText = async (
  path: string,
  body: Record<string, unknown>
): Promise<string> => {
  try {
    const response = await client.post<ApiResponse<string>>(path, body);
    notifyHistoryChanged();
    return unwrapText(response.data?.data);
  } catch (error) {
    throw toApiError(error);
  }
};

const postPrompt = (prompt: string) => postText("/prompt/", { prompt });

const postProofreader = (prompt: string) => postText("/proofreader/", { prompt });

const postSummarizer = (prompt: string) => postText("/summarizer/", { prompt });

const postTranslator = (
  prompt: string,
  targetLanguage: string,
  sourceLanguage: string
) =>
  postText("/translator/", {
    prompt,
    target_language: targetLanguage,
    source_language: sourceLanguage,
  });

const postWriter = (prompt: string) => postText("/writer/", { prompt });

const postRewriter = (prompt: string) => postText("/rewriter/", { prompt });

const postCopywriting = (prompt: string) => postText("/copywriting/", { prompt });

const postExplainer = (prompt: string) => postText("/explainer/", { prompt });

const analyzeSentiment = (prompt: string) =>
  postText("/sentiment-analyzer/", { prompt });

const createEmail = (
  context: string,
  recipients: string,
  sender: string,
  prompt: string
) => postText("/email/", { context, recipients, sender, prompt });

const chatWithRAG = (prompt: string) => postText("/rag-chat/", { prompt });

const generateImage = async (prompt: string): Promise<GeneratedImage> => {
  try {
    const response = await client.post<ApiResponse<GeneratedImage>>("/image/", {
      prompt,
    });
    const image = response.data?.data;
    if (!image?.image_base64) {
      throw new ApiError("The service did not return any image data.");
    }
    notifyHistoryChanged();
    return image;
  } catch (error) {
    throw toApiError(error);
  }
};

const insertFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await client.post<UploadResponse>("/pdf-upload/", formData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/** The documents indexed for this API key, oldest folder first. */
const listRagDocuments = async (): Promise<RagDocument[]> => {
  try {
    const response = await client.get<ApiResponse<RagDocument[]>>(
      "/rag-documents/"
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw toApiError(error);
  }
};

/** Drop one document's folder; returns what is still indexed. */
const deleteRagDocument = async (
  documentId: number
): Promise<RagDocument[]> => {
  try {
    const response = await client.delete<
      ApiResponse<{ removed: number; documents: RagDocument[] }>
    >(`/rag-documents/${documentId}/`);
    return response.data?.data?.documents ?? [];
  } catch (error) {
    throw toApiError(error);
  }
};

const getHistory = async (): Promise<HistoryEntry[]> => {
  try {
    const response = await client.get<ApiResponse<HistoryEntry[]>>("/history/");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw toApiError(error);
  }
};

const checkApiKeySession = async () => {
  try {
    const response = await client.get("/api-key-check/");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * Wrap the provider key with the backend's public key before it leaves here.
 *
 * The key is the user's own credential and it passes through nginx and a
 * tunnel on the way in, so only the backend — which holds the private half —
 * should be able to read it. The public key is fetched per submission rather
 * than cached, so a backend restart can never leave us encrypting for a key
 * that no longer exists.
 *
 * WebCrypto only exists in a secure context. Served over plain HTTP the key is
 * sent as-is, which the backend still accepts, rather than blocking sign-in.
 */
const encryptApiKeyForTransport = async (apiKey: string): Promise<string> => {
  if (!window.crypto?.subtle) {
    console.warn(
      "Web Crypto is unavailable (this page is not a secure context), so the API key is sent unencrypted."
    );
    return apiKey;
  }

  const { data } = await client.get<ApiResponse<TransportKey>>("/public-key/");
  const transportKey = data?.data;

  if (!transportKey?.public_key || transportKey.algorithm !== "RSA-OAEP-SHA256") {
    throw new ApiError("The backend did not provide a usable encryption key.");
  }

  const spki = Uint8Array.from(atob(transportKey.public_key), (character) =>
    character.charCodeAt(0)
  );

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    new TextEncoder().encode(apiKey)
  );

  const encoded = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext))
  );

  return `rsa:${transportKey.key_id}:${encoded}`;
};

/**
 * Validate a provider key and, on success, start the httpOnly cookie session.
 *
 * `endpoint` selects the provider-specific check when one is known.
 */
const validateApiKey = async (
  apiKey: string,
  endpoint: string = "/api-key-check/"
) => {
  try {
    const response = await client.get(endpoint, {
      headers: { Authorization: await encryptApiKeyForTransport(apiKey) },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const clearApiKeySession = async () => {
  try {
    const response = await client.post("/api-key-clear/", {});
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const services = {
  postPrompt,
  postProofreader,
  postSummarizer,
  postTranslator,
  postWriter,
  postRewriter,
  postCopywriting,
  postExplainer,
  analyzeSentiment,
  createEmail,
  chatWithRAG,
  generateImage,
  insertFile,
  listRagDocuments,
  deleteRagDocument,
  getHistory,
  checkApiKeySession,
  validateApiKey,
  clearApiKeySession,
};

export default services;
