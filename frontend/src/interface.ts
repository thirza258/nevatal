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
  model?: string;
  tokens_in?: number | null;
  tokens_out?: number | null;
  cost?: number | null;
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
 * The shape an answer should come back in. Chosen per request, not per session:
 * JSON from a data tool and Markdown from a writer, in the same sitting.
 */
export type OutputFormat = "markdown" | "text" | "table" | "json" | "csv";

/**
 * A chart the analysis asked for, with the numbers computed server-side from
 * the whole file — the model chooses what to plot, pandas plots it.
 */
export interface ChartPoint {
  x: string;
  y: number | null;
}

export interface ChartSeries {
  name: string;
  points: ChartPoint[];
}

export interface ChartSpec {
  type: 'bar' | 'line';
  title: string;
  x_label: string;
  y_label: string;
  series: ChartSeries[];
  /** True when only the top values are plotted, not every category. */
  truncated?: boolean;
}

/** One column, as profiled by pandas rather than described by a model. */
export interface ColumnProfile {
  name: string;
  kind: 'number' | 'text';
  nulls: number;
  unique: number;
  min?: number | null;
  max?: number | null;
  mean?: number | null;
  median?: number | null;
  top?: string[];
}

export interface DataProfile {
  rows: number;
  column_count: number;
  columns: ColumnProfile[];
}

export interface DataAnalysis {
  profile: DataProfile;
  insights: string;
  charts: ChartSpec[];
}

/** One turn of a thread, as the backend replays it to the provider. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** What a generation consumed, as recorded against the session's key. */
export interface UsageTotals {
  requests: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost: number | null;
}

export interface UsageByModel extends UsageTotals {
  model: string;
}

export interface UsageByMethod {
  method: string;
  requests: number | null;
  cost: number | null;
}

export interface UsageByDay {
  day: string;
  requests: number | null;
  cost: number | null;
}

/** Per-key figures, so a spare key's spend is visible next to the active one. */
export interface UsageByKey {
  index: number;
  label: string;
  masked: string;
  provider: string;
  active: boolean;
  requests: number;
  cost: number | null;
}

/**
 * The provider's own view of the key's balance, where it publishes one. This is
 * the figure a spending alert should trust over our own estimate.
 */
export interface ProviderAccount {
  provider: string;
  label: string;
  spend: number | null;
  limit: number | null;
  remaining: number | null;
  is_free_tier: boolean | null;
}

export interface UsageReport {
  totals: UsageTotals;
  by_model: UsageByModel[];
  by_method: UsageByMethod[];
  by_day: UsageByDay[];
  keys: UsageByKey[];
  account: ProviderAccount | null;
  recent_days: number;
}

/** One of the session's API keys, as the browser is allowed to see it. */
export interface KeySlot {
  index: number;
  label: string;
  masked: string;
  provider: string;
  active: boolean;
}

export interface KeySlots {
  slots: KeySlot[];
  active_index: number | null;
  limit: number;
}

/** A saved prompt, kept in this browser and exportable as a file to share. */
export interface PromptTemplate {
  id: string;
  name: string;
  tool: string;
  prompt: string;
  created_at: string;
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
