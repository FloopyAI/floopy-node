export interface Decision {
  requestId: string;
  sessionId: string | null;
  requestCreatedAt: string;
  provider: string | null;
  model: string | null;
  status: string;
  latencyMs: number | null;
  costMicroUsd: number | null;
  cacheEnabled: boolean | null;
  threat: string | null;
  decisionTrace: unknown;
  confidence: number | null;
  confidenceReason: string | null;
  explanation: string | null;
}

export interface DecisionListParams {
  sessionId?: string;
  /** RFC3339 timestamp lower bound (inclusive). */
  from?: string;
  /** RFC3339 timestamp upper bound (exclusive). */
  to?: string;
  /** Page size. Server default = 100, max = 500. */
  limit?: number;
  cursor?: string;
}

export interface DecisionListPage {
  items: Decision[];
  nextCursor: string | null;
  hasMore: boolean;
}
