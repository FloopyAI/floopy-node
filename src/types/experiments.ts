export type ExperimentStatus = "active" | "rolled_back" | "completed";

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  variantARoutingRuleId: string;
  variantBRoutingRuleId: string;
  splitPercentage: number;
  createdAt: string;
  rolledBackAt: string | null;
}

export interface ExperimentListParams {
  status?: ExperimentStatus;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface ExperimentListPage {
  items: Experiment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ExperimentCreateParams {
  name: string;
  description?: string;
  variantARoutingRuleId: string;
  variantBRoutingRuleId: string;
  /** 1-99. Defaults to 50. */
  splitPercentage?: number;
}

export interface ExperimentResults {
  experimentId: string;
  variantA: VariantResults;
  variantB: VariantResults;
  winner: "A" | "B" | "tie" | null;
  computedAt: string;
}

export interface VariantResults {
  routingRuleId: string;
  sampleSize: number;
  successRate: number;
  averageLatencyMs: number;
  averageCostMicroUsd: number;
}
