import { FLOOPY_HEADERS } from "../constants/headers.js";
import type { RequestOptions } from "../types/shared.js";

/**
 * Per-call options for the Batch / Files surface. Extends the standard
 * {@link RequestOptions} with `provider`, which selects the upstream the
 * gateway forwards to (sent as the `floopy-provider` header). Optional
 * when the API key has exactly one provider configured.
 */
export type BatchRequestOptions = RequestOptions & { provider?: string };

/**
 * Split the `provider` convenience field out of {@link BatchRequestOptions}
 * and fold it into the request headers as `floopy-provider`.
 */
export function resolveBatchOptions(
  options?: BatchRequestOptions,
): RequestOptions | undefined {
  if (options === undefined) return undefined;
  const { provider, ...rest } = options;
  if (provider === undefined) return rest;
  return { ...rest, headers: { ...rest.headers, [FLOOPY_HEADERS.PROVIDER]: provider } };
}

/** The shape accepted by `FloopyHttp.request` / `requestRaw`. */
export interface BatchInit {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  requestOptions?: RequestOptions;
}

/**
 * Build the http init, folding `provider` into headers and omitting
 * `requestOptions` entirely when there is nothing to send (required
 * under `exactOptionalPropertyTypes`).
 */
export function batchInit(
  options: BatchRequestOptions | undefined,
  extra?: Pick<BatchInit, "body" | "query">,
): BatchInit {
  const resolved = resolveBatchOptions(options);
  const init: BatchInit = { ...extra };
  if (resolved !== undefined) init.requestOptions = resolved;
  return init;
}
