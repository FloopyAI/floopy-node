export interface OrgConstraints {
  /** Hard cap (USD) on total monthly spend. `null` to clear. */
  costLimitMonthlyUsd?: number | null;
  /** Sliding window for token rate limit, in seconds. */
  tokenWindowSeconds?: number | null;
  /** Max tokens allowed per `tokenWindowSeconds`. */
  maxTokensPerWindow?: number | null;
  /** Max requests per minute per API key. */
  maxRequestsPerMinute?: number | null;
}
