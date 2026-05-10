export interface FloopyClientOptions {
  /** Floopy API key. Required. */
  apiKey: string;
  /** Override the gateway base URL. Defaults to `https://api.floopy.ai/v1`. */
  baseURL?: string;
  /** Request timeout in milliseconds. Defaults to 60_000. */
  timeout?: number;
  /** Number of retries on transient errors (network/408/429/5xx). Defaults to 2. */
  maxRetries?: number;
  /** Headers merged into every request (overridden by per-call headers). */
  defaultHeaders?: Record<string, string>;
  /** Floopy gateway behavior toggles, mapped to `Floopy-*` headers. */
  options?: FloopyOptions;
  /** Override the global `fetch` implementation (mostly for tests). */
  fetch?: typeof fetch;
}

export interface FloopyOptions {
  /** Cache controls. Maps to `Floopy-Cache-*` headers. */
  cache?: {
    /** Toggle exact + semantic cache for the request. */
    enabled?: boolean;
    /** Maximum number of entries per semantic cache bucket. */
    bucketMaxSize?: number;
  };
  /** Stored prompt id; gateway resolves it to the active prompt content. */
  promptId?: string;
  /** Pinned prompt version. Use with `promptId`. */
  promptVersion?: string;
  /** Toggle the LLM firewall (`floopy-llm-security-enabled`). */
  llmSecurityEnabled?: boolean;
}

export interface RequestOptions {
  /** Per-call headers merged on top of client defaults. */
  headers?: Record<string, string>;
  /** Per-call timeout in milliseconds (overrides client default). */
  timeout?: number;
  /** Optional AbortSignal — caller-controlled cancellation. */
  signal?: AbortSignal;
  /** Override Floopy options for this call. */
  options?: FloopyOptions;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
