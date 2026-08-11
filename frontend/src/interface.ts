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

export interface UploadResponse {
  message: string;
  file_path: string;
  document_name: string;
}
