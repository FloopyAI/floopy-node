import { FLOOPY_HEADERS } from "./constants/headers.js";
import type { FloopyOptions } from "./types/shared.js";

export function buildFloopyHeaders(options: FloopyOptions | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  if (options === undefined) return headers;

  if (options.cache?.enabled !== undefined) {
    headers[FLOOPY_HEADERS.CACHE_ENABLED] = String(options.cache.enabled);
  }
  if (options.cache?.bucketMaxSize !== undefined) {
    headers[FLOOPY_HEADERS.CACHE_BUCKET_MAX_SIZE] = String(options.cache.bucketMaxSize);
  }
  if (options.promptId !== undefined) {
    headers[FLOOPY_HEADERS.PROMPT_ID] = options.promptId;
  }
  if (options.promptVersion !== undefined) {
    headers[FLOOPY_HEADERS.PROMPT_VERSION] = options.promptVersion;
  }
  if (options.llmSecurityEnabled !== undefined) {
    headers[FLOOPY_HEADERS.LLM_SECURITY_ENABLED] = String(options.llmSecurityEnabled);
  }
  return headers;
}

export function mergeHeaders(
  ...layers: ReadonlyArray<Record<string, string> | undefined>
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const layer of layers) {
    if (layer === undefined) continue;
    for (const [k, v] of Object.entries(layer)) {
      merged[k] = v;
    }
  }
  return merged;
}
