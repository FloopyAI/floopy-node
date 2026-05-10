export type EvaluationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface EvaluationRun {
  id: string;
  datasetId: string;
  model: string;
  promptId: string | null;
  status: EvaluationStatus;
  config: Record<string, unknown> | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface EvaluationCreateParams {
  datasetId: string;
  model: string;
  promptId?: string;
  config?: Record<string, unknown>;
}

export interface EvaluationResultRow {
  id: string;
  runId: string;
  inputId: string;
  output: string;
  score: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface EvaluationResultsPage {
  items: EvaluationResultRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface EvaluationResultsParams {
  limit?: number;
  cursor?: string;
}
