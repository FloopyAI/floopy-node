import { FLOOPY_HEADERS } from "./constants/headers.js";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT_PREFIX,
} from "./constants/defaults.js";
import {
  FloopyConnectionError,
  FloopyError,
  FloopyTimeoutError,
  errorFromStatus,
  type FloopyErrorBody,
} from "./errors.js";
import { buildFloopyHeaders, mergeHeaders } from "./headers.js";
import type { FloopyClientOptions, FloopyOptions, RequestOptions } from "./types/shared.js";
import { SDK_VERSION } from "./version.js";

const RETRYABLE_STATUS = new Set<number>([408, 409, 425, 429, 500, 502, 503, 504]);

export interface FloopyHttpInit {
  apiKey: string;
  baseURL: string;
  timeout: number;
  maxRetries: number;
  defaultHeaders: Record<string, string>;
  defaultOptions: FloopyOptions | undefined;
  fetchImpl: typeof fetch;
}

export class FloopyHttp {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultOptions: FloopyOptions | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(init: FloopyHttpInit) {
    this.apiKey = init.apiKey;
    this.baseURL = init.baseURL.replace(/\/+$/, "");
    this.timeout = init.timeout;
    this.maxRetries = init.maxRetries;
    this.defaultHeaders = init.defaultHeaders;
    this.defaultOptions = init.defaultOptions;
    this.fetchImpl = init.fetchImpl;
  }

  static fromClientOptions(options: FloopyClientOptions): FloopyHttp {
    if (!options.apiKey) {
      throw new FloopyError("apiKey is required to construct a Floopy client");
    }
    return new FloopyHttp({
      apiKey: options.apiKey,
      baseURL: options.baseURL ?? DEFAULT_BASE_URL,
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      defaultHeaders: options.defaultHeaders ?? {},
      defaultOptions: options.options,
      fetchImpl: options.fetch ?? fetch,
    });
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getDefaultRequestHeaders(): Record<string, string> {
    return mergeHeaders(
      this.defaultHeaders,
      buildFloopyHeaders(this.defaultOptions),
      this.authAndUaHeaders(),
    );
  }

  async request<T>(
    method: string,
    path: string,
    init?: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined | null>;
      requestOptions?: RequestOptions;
    },
  ): Promise<{ data: T; requestId: string | undefined }> {
    const response = await this.requestRaw(method, path, init);
    const requestId = response.headers.get(FLOOPY_HEADERS.REQUEST_ID) ?? undefined;
    if (response.status === 204) {
      return { data: undefined as T, requestId };
    }
    const text = await response.text();
    const data = text.length > 0 ? (JSON.parse(text) as T) : (undefined as T);
    return { data, requestId };
  }

  async requestRaw(
    method: string,
    path: string,
    init?: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined | null>;
      requestOptions?: RequestOptions;
    },
  ): Promise<Response> {
    const url = this.buildUrl(path, init?.query);
    const headers = this.buildRequestHeaders(init?.requestOptions);
    const bodyText = init?.body === undefined ? undefined : JSON.stringify(init.body);
    if (bodyText !== undefined && headers[FLOOPY_HEADERS.CONTENT_TYPE] === undefined) {
      headers[FLOOPY_HEADERS.CONTENT_TYPE] = "application/json";
    }
    const timeout = init?.requestOptions?.timeout ?? this.timeout;
    const externalSignal = init?.requestOptions?.signal;

    let attempt = 0;
    let lastError: unknown;
    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(new Error("Request timed out")), timeout);
      const onAbort = () => controller.abort(externalSignal?.reason);
      if (externalSignal !== undefined) {
        if (externalSignal.aborted) controller.abort(externalSignal.reason);
        else externalSignal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        const init: RequestInit = { method, headers, signal: controller.signal };
        if (bodyText !== undefined) init.body = bodyText;
        const response = await this.fetchImpl(url, init);

        if (!response.ok) {
          if (attempt < this.maxRetries && RETRYABLE_STATUS.has(response.status)) {
            await this.sleepBackoff(attempt, response.headers.get("Retry-After"));
            attempt += 1;
            continue;
          }
          throw await this.errorFromResponse(response);
        }
        return response;
      } catch (err) {
        lastError = err;
        if (err instanceof FloopyError) throw err;
        if (this.isAbortError(err)) {
          if (externalSignal?.aborted) {
            throw new FloopyError("Request aborted by caller", { cause: err });
          }
          throw new FloopyTimeoutError(`Request timed out after ${timeout}ms`, err);
        }
        if (attempt < this.maxRetries) {
          await this.sleepBackoff(attempt, null);
          attempt += 1;
          continue;
        }
        throw new FloopyConnectionError("Network error talking to Floopy gateway", err);
      } finally {
        clearTimeout(timeoutId);
        if (externalSignal !== undefined) externalSignal.removeEventListener("abort", onAbort);
      }
    }
    // Unreachable, but satisfies older type-flow analyses.
    /* c8 ignore next */
    throw lastError;
  }

  private buildUrl(
    path: string,
    query: Record<string, string | number | boolean | undefined | null> | undefined,
  ): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseURL}${normalized}`);
    if (query !== undefined) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private buildRequestHeaders(reqOpts: RequestOptions | undefined): Record<string, string> {
    return mergeHeaders(
      this.defaultHeaders,
      buildFloopyHeaders(this.defaultOptions),
      buildFloopyHeaders(reqOpts?.options),
      this.authAndUaHeaders(),
      reqOpts?.headers,
    );
  }

  private authAndUaHeaders(): Record<string, string> {
    return {
      [FLOOPY_HEADERS.AUTHORIZATION]: `Bearer ${this.apiKey}`,
      [FLOOPY_HEADERS.USER_AGENT]: `${DEFAULT_USER_AGENT_PREFIX}/${SDK_VERSION} node/${process.version.replace(/^v/, "")}`,
    };
  }

  private async errorFromResponse(response: Response): Promise<FloopyError> {
    const requestId = response.headers.get(FLOOPY_HEADERS.REQUEST_ID) ?? undefined;
    const text = await response.text().catch(() => "");
    let body: FloopyErrorBody | string | undefined;
    try {
      body = text.length > 0 ? (JSON.parse(text) as FloopyErrorBody) : undefined;
    } catch {
      body = text.length > 0 ? text : undefined;
    }
    const err = errorFromStatus({ status: response.status, body, requestId });
    if (err.name === "FloopyRateLimitError") {
      const retryHeader = response.headers.get("Retry-After");
      if (retryHeader !== null) {
        const seconds = Number.parseInt(retryHeader, 10);
        if (Number.isFinite(seconds)) {
          (err as { retryAfterSeconds?: number }).retryAfterSeconds = seconds;
        }
      }
    }
    return err;
  }

  private async sleepBackoff(attempt: number, retryAfterHeader: string | null): Promise<void> {
    if (retryAfterHeader !== null) {
      const seconds = Number.parseInt(retryAfterHeader, 10);
      if (Number.isFinite(seconds) && seconds > 0) {
        await sleep(seconds * 1000);
        return;
      }
    }
    const base = 250 * Math.pow(2, attempt);
    const jitter = Math.random() * base * 0.25;
    await sleep(base + jitter);
  }

  private isAbortError(err: unknown): boolean {
    return err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
