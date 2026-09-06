import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { AI_MODEL_HEADER, API_URL, BATCH_HEADER, MODEL_STORAGE_KEY } from "../constant";
import type {
  ApiResponse,
  ChatTurn,
  DataAnalysis,
  GeneratedImage,
  HistoryEntry,
  KeySlots,
  ModelCatalog,
  RagDocument,
  TransportKey,
  UploadResponse,
  UsageReport,
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

/**
 * Send the model the session picked with every request that might generate.
 *
 * It is read at request time rather than held in React state so that a tool
 * page never has to know a picker exists. No stored model means no header,
 * which the backend reads as "use the provider default".
 */
client.interceptors.request.use((config) => {
  const model = localStorage.getItem(MODEL_STORAGE_KEY);
  if (model) {
    config.headers.set(AI_MODEL_HEADER, model);
  }
  return config;
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

interface PostOptions {
  /** One item of a batch run: tagged for the backend, and not a history event. */
  batch?: boolean;
  signal?: AbortSignal;
}

/** POST a text endpoint and return the clean, unwrapped answer. */
const postText = async (
  path: string,
  body: Record<string, unknown>,
  options: PostOptions = {}
): Promise<string> => {
  try {
    const response = await client.post<ApiResponse<string>>(path, body, {
      headers: options.batch ? { [BATCH_HEADER]: "1" } : undefined,
      signal: options.signal,
    });
    // A batch of fifty would otherwise refetch the sidebar fifty times, for
    // rows the sidebar deliberately does not show.
    if (!options.batch) notifyHistoryChanged();
    return unwrapText(response.data?.data);
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * Run one item of a batch through any text endpoint.
 *
 * Batch work is the same endpoints, one request per item, so the user's own
 * key pays for exactly what it did and nothing new has to exist server-side.
 */
const runBatchItem = (
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
) => postText(path, body, { batch: true, signal });

/**
 * Ask a question in the context of the thread so far.
 *
 * The turns travel with the request because the backend keeps no conversation
 * state — the session is a key in a cookie, not an account — so the thread
 * lives in the browser and is replayed on each turn.
 */
const postPrompt = (prompt: string, conversation?: ChatTurn[]) =>
  postText("/prompt/", { prompt, conversation });

const postProofreader = (prompt: string) => postText("/proofreader/", { prompt });

const postSummarizer = (prompt: string, outputFormat?: string) =>
  postText("/summarizer/", { prompt, output_format: outputFormat });

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

const postWriter = (prompt: string, outputFormat?: string) =>
  postText("/writer/", { prompt, output_format: outputFormat });

const postRewriter = (prompt: string, outputFormat?: string) =>
  postText("/rewriter/", { prompt, output_format: outputFormat });

const postCopywriting = (prompt: string, outputFormat?: string) =>
  postText("/copywriting/", { prompt, output_format: outputFormat });

const postExplainer = (
  prompt: string,
  conversation?: ChatTurn[],
  outputFormat?: string
) => postText("/explainer/", { prompt, conversation, output_format: outputFormat });

const analyzeSentiment = (prompt: string, outputFormat?: string) =>
  postText("/sentiment-analyzer/", { prompt, output_format: outputFormat });

/** A caption or post shaped for one platform's conventions. */
const createSocialPost = (payload: {
  prompt: string;
  platform: string;
  tone: string;
  audience?: string;
  hashtagCount?: number;
  includeEmojis?: boolean;
  includeCta?: boolean;
  postLength?: string;
  brandName?: string;
  brandKeywords?: string;
  outputFormat?: string;
}) =>
  postText("/social-media-post-generator/", {
    prompt: payload.prompt,
    platform: payload.platform,
    tone: payload.tone,
    audience: payload.audience,
    hashtag_count: payload.hashtagCount,
    include_emojis: payload.includeEmojis,
    include_cta: payload.includeCta,
    post_length: payload.postLength,
    brand_name: payload.brandName,
    brand_keywords: payload.brandKeywords,
    output_format: payload.outputFormat,
  });

/** Many short, distinct options rather than one polished answer. */
const generateIdeas = (payload: {
  prompt: string;
  kind: string;
  count: number;
  constraints?: string;
  outputFormat?: string;
}) =>
  postText("/idea-generator/", {
    prompt: payload.prompt,
    kind: payload.kind,
    count: payload.count,
    constraints: payload.constraints,
    output_format: payload.outputFormat,
  });

/** Clean and convert pasted data, or report what is wrong with it. */
const formatData = (payload: {
  prompt: string;
  target: string;
  mode: "convert" | "validate";
  instructions?: string;
}) =>
  postText("/data-formatter/", {
    prompt: payload.prompt,
    target: payload.target,
    mode: payload.mode,
    instructions: payload.instructions,
    // The target format is the whole point here, so it is also the directive
    // the provider is given.
    output_format: payload.mode === "validate" ? "markdown" : payload.target,
  });

const createEmail = (
  context: string,
  recipients: string,
  sender: string,
  prompt: string
) => postText("/email/", { context, recipients, sender, prompt });

const chatWithRAG = (prompt: string, conversation?: ChatTurn[]) =>
  postText("/rag-chat/", { prompt, conversation });

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

/**
 * Analyse a CSV: insights from the model, charts computed from the whole file.
 *
 * The file goes to the backend rather than being profiled here because pandas
 * is already there, and because a chart drawn from a fifteen-row sample would
 * be a plausible-looking lie.
 */
const analyseData = async (payload: {
  file?: File;
  text?: string;
  question?: string;
}): Promise<DataAnalysis> => {
  const body = new FormData();
  if (payload.file) body.append("file", payload.file);
  if (payload.text) body.append("text", payload.text);
  if (payload.question) body.append("prompt", payload.question);

  try {
    const response = await client.post<ApiResponse<DataAnalysis>>(
      "/data-analysis/",
      body
    );
    notifyHistoryChanged();
    const analysis = response.data?.data;
    return {
      profile: analysis?.profile ?? { rows: 0, column_count: 0, columns: [] },
      insights: analysis?.insights ?? "",
      charts: Array.isArray(analysis?.charts) ? analysis.charts : [],
    };
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

/**
 * The models the session's key can be pointed at.
 *
 * Providers differ: OpenRouter lists every model it can route to, the others
 * report nothing and stay on their default. An empty list is a valid answer,
 * not a failure.
 */
const listModels = async (): Promise<ModelCatalog> => {
  try {
    const response = await client.get<ApiResponse<ModelCatalog>>("/models/");
    const catalogue = response.data?.data;
    return {
      provider: catalogue?.provider ?? "",
      default_model: catalogue?.default_model ?? "",
      models: Array.isArray(catalogue?.models) ? catalogue.models : [],
    };
  } catch (error) {
    throw toApiError(error);
  }
};

/** What this session has spent, per model, per tool, per key. */
const getUsage = async (): Promise<UsageReport | null> => {
  try {
    const response = await client.get<ApiResponse<UsageReport>>("/usage/");
    return response.data?.data ?? null;
  } catch (error) {
    throw toApiError(error);
  }
};

const readSlots = (payload: ApiResponse<KeySlots> | undefined): KeySlots => ({
  slots: Array.isArray(payload?.data?.slots) ? payload.data.slots : [],
  active_index: payload?.data?.active_index ?? null,
  limit: payload?.data?.limit ?? 1,
});

/** The keys this session holds, masked — the raw values never come back. */
const listKeys = async (): Promise<KeySlots> => {
  try {
    const response = await client.get<ApiResponse<KeySlots>>("/keys/");
    return readSlots(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * Add another key to the session, encrypted on the way out like the first one.
 */
const addKey = async (apiKey: string, label?: string): Promise<KeySlots> => {
  try {
    const response = await client.post<ApiResponse<KeySlots>>(
      "/keys/",
      { label },
      { headers: { Authorization: await encryptApiKeyForTransport(apiKey) } }
    );
    return readSlots(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

const switchKey = async (index: number): Promise<KeySlots> => {
  try {
    const response = await client.post<ApiResponse<KeySlots>>("/keys/switch/", {
      index,
    });
    return readSlots(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

const rotateKey = async (): Promise<KeySlots> => {
  try {
    const response = await client.post<ApiResponse<KeySlots>>("/keys/rotate/", {});
    return readSlots(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

const removeKey = async (index: number): Promise<KeySlots> => {
  try {
    const response = await client.delete<ApiResponse<KeySlots>>(`/keys/${index}/`);
    return readSlots(response.data);
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

/**
 * Statuses that mean "this key cannot serve this request right now".
 *
 * 429 is a rate limit, 402 is out of credit. Both are the key's problem rather
 * than the request's, which is exactly when a spare key is worth having.
 */
const ROTATABLE_STATUSES = new Set([402, 429]);

/** Paths where rotating would hide the answer the caller asked for. */
const isKeyManagementPath = (url?: string) =>
  Boolean(url && (url.includes("/keys") || url.includes("api-key-check")));

interface RetriableConfig extends InternalAxiosRequestConfig {
  rotatedOnce?: boolean;
}

client.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) throw error;

  const config = error.config as RetriableConfig | undefined;
  const status = error.response?.status;

  if (
    !config ||
    config.rotatedOnce ||
    !status ||
    !ROTATABLE_STATUSES.has(status) ||
    // Rotating during key validation would report a bad key as accepted, on a
    // session that had quietly moved to a different key.
    isKeyManagementPath(config.url)
  ) {
    throw error;
  }

  try {
    const { slots } = await listKeys();
    if (slots.length < 2) throw error;
    await rotateKey();
  } catch {
    throw error;
  }

  // The generation never happened, so replaying it on the next key is safe.
  config.rotatedOnce = true;
  return client.request(config);
});

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
  analyseData,
  listRagDocuments,
  deleteRagDocument,
  getHistory,
  listModels,
  runBatchItem,
  createSocialPost,
  generateIdeas,
  formatData,
  getUsage,
  listKeys,
  addKey,
  switchKey,
  rotateKey,
  removeKey,
  checkApiKeySession,
  validateApiKey,
  clearApiKeySession,
};

export default services;
