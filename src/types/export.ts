export type ExportFormat = "jsonl" | "csv";

export interface ExportDecisionsParams {
  /** RFC3339 timestamp lower bound (inclusive). Required. */
  from: string;
  /** RFC3339 timestamp upper bound (exclusive). Required. */
  to: string;
  /** Wire format. Defaults to `jsonl`. */
  format?: ExportFormat;
}

export interface ExportedDecisionRow {
  requestId: string;
  sessionId: string | null;
  organizationId: string;
  provider: string | null;
  model: string | null;
  status: string;
  latencyMs: number | null;
  costMicroUsd: number | null;
  cacheEnabled: boolean | null;
  threat: string | null;
  createdAt: string;
}

export interface ExportTrailer {
  trailer: true;
  rowsEmitted: number;
  truncated: boolean;
  reason: string | null;
}
