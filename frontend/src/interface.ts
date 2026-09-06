/**
 * Shapes returned by the Django backend.
 *
 * Success responses are wrapped as `{ status, message, data }`; the useful
 * payload is always in `data`, whose type varies per endpoint.
 */
export interface ApiResponse<T = string> {
  status: number;
  message: string;
  data: T;
}

/** Text endpoints (prompt, writer, summarizer, ...) return a string payload. */
export type TextResponse = ApiResponse<string>;

export interface GeneratedImage {
  mime_type: string;
  extension: string;
  image_base64: string;
}

export type ImageResponse = ApiResponse<GeneratedImage>;

export interface HistoryEntry {
  method: string;
  prompt: string;
  response: string;
  created_at: string;
}

export type HistoryResponse = ApiResponse<HistoryEntry[]>;

export type ApiKeyCheckResponse = ApiResponse<{ valid: boolean } | false>;

/**
 * One model the session's key can be pointed at.
 *
 * Prices are US dollars per million tokens: providers quote per-token figures
 * like "0.00000015", which the backend converts before sending them here. Null
 * means the provider publishes no price, which is not the same as free.
 */
export interface AiModel {
  id: string;
  name: string;
  context_length: number | null;
  prompt_price_per_million: number | null;
  completion_price_per_million: number | null;
  modality: string;
  is_free: boolean;
}

/**
 * What `/models/` reports for the session's key. `models` is empty for a
 * provider with no catalogue, which means there is no choice to offer and
 * generation stays on `default_model`.
 */
export interface ModelCatalog {
  provider: string;
  default_model: string;
  models: AiModel[];
}

/**
 * The backend's public key, used to encrypt the provider API key before it is
 * put on the wire. `key_id` lets the backend refuse ciphertext meant for a key
 * it has since replaced.
 */
export interface TransportKey {
  algorithm: string;
  key_id: string;
  /** Base64-encoded SPKI DER, ready for crypto.subtle.importKey. */
  public_key: string;
}

/**
 * One persisted document index, stored server-side as
 * media/rag/<owner>/<document_id>/index.pkl. `document_id` is the folder
 * number: the first upload is 1, the second 2, and so on.
 */
export interface RagDocument {
  document_id: number;
  source: string;
  chunk_count?: number;
  created_at?: string;
  file_path?: string | null;
  folder?: string;
}

export interface UploadResponse {
  message: string;
  file_path: string | null;
  document_name: string;
  document_id: number;
  chunk_count: number;
  documents: RagDocument[];
}
