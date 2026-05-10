import { FLOOPY_CONFIRM_VALUES, FLOOPY_HEADERS } from "../constants/headers.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type {
  Experiment,
  ExperimentCreateParams,
  ExperimentListPage,
  ExperimentListParams,
  ExperimentResults,
  ExperimentStatus,
  VariantResults,
} from "../types/experiments.js";

interface ExperimentWire {
  id: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  variant_a_routing_rule_id: string;
  variant_b_routing_rule_id: string;
  split_percentage: number;
  created_at: string;
  rolled_back_at: string | null;
}

interface ExperimentListWire {
  items: ExperimentWire[];
  next_cursor: string | null;
  has_more: boolean;
}

interface ExperimentResultsWire {
  experiment_id: string;
  variant_a: VariantWire;
  variant_b: VariantWire;
  winner: "A" | "B" | "tie" | null;
  computed_at: string;
}

interface VariantWire {
  routing_rule_id: string;
  sample_size: number;
  success_rate: number;
  average_latency_ms: number;
  average_cost_micro_usd: number;
}

function mapExperiment(w: ExperimentWire): Experiment {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    status: w.status,
    variantARoutingRuleId: w.variant_a_routing_rule_id,
    variantBRoutingRuleId: w.variant_b_routing_rule_id,
    splitPercentage: w.split_percentage,
    createdAt: w.created_at,
    rolledBackAt: w.rolled_back_at,
  };
}

function mapVariant(w: VariantWire): VariantResults {
  return {
    routingRuleId: w.routing_rule_id,
    sampleSize: w.sample_size,
    successRate: w.success_rate,
    averageLatencyMs: w.average_latency_ms,
    averageCostMicroUsd: w.average_cost_micro_usd,
  };
}

function withConfirm(requestOptions: RequestOptions | undefined): RequestOptions {
  const headers = {
    ...(requestOptions?.headers ?? {}),
    [FLOOPY_HEADERS.CONFIRM]: FLOOPY_CONFIRM_VALUES.EXPERIMENTS,
  };
  return { ...(requestOptions ?? {}), headers };
}

export class ExperimentsResource {
  constructor(private readonly http: FloopyHttp) {}

  async list(
    params: ExperimentListParams = {},
    requestOptions?: RequestOptions,
  ): Promise<ExperimentListPage> {
    const query: Record<string, string | number | undefined> = {};
    if (params.status !== undefined) query.status = params.status;
    if (params.from !== undefined) query.from = params.from;
    if (params.to !== undefined) query.to = params.to;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.cursor !== undefined) query.cursor = params.cursor;
    const opts: { query: typeof query; requestOptions?: RequestOptions } = { query };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<ExperimentListWire>(
      "GET",
      ENDPOINTS.EXPERIMENTS,
      opts,
    );
    return {
      items: data.items.map(mapExperiment),
      nextCursor: data.next_cursor,
      hasMore: data.has_more,
    };
  }

  /**
   * Create an experiment. Automatically injects the
   * `X-Floopy-Confirm: experiments` header (SEC-009 requires it).
   */
  async create(
    params: ExperimentCreateParams,
    requestOptions?: RequestOptions,
  ): Promise<Experiment> {
    const body: Record<string, unknown> = {
      name: params.name,
      variant_a_routing_rule_id: params.variantARoutingRuleId,
      variant_b_routing_rule_id: params.variantBRoutingRuleId,
    };
    if (params.description !== undefined) body.description = params.description;
    if (params.splitPercentage !== undefined) body.split_percentage = params.splitPercentage;
    const { data } = await this.http.request<ExperimentWire>("POST", ENDPOINTS.EXPERIMENTS, {
      body,
      requestOptions: withConfirm(requestOptions),
    });
    return mapExperiment(data);
  }

  /**
   * Roll back an active experiment back to its baseline routing rule.
   * Idempotent. Injects `X-Floopy-Confirm: experiments`.
   */
  async rollback(id: string, requestOptions?: RequestOptions): Promise<Experiment> {
    const { data } = await this.http.request<ExperimentWire>(
      "POST",
      ENDPOINTS.EXPERIMENT_ROLLBACK(id),
      { requestOptions: withConfirm(requestOptions) },
    );
    return mapExperiment(data);
  }

  async results(id: string, requestOptions?: RequestOptions): Promise<ExperimentResults> {
    const opts: { requestOptions?: RequestOptions } = {};
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<ExperimentResultsWire>(
      "GET",
      ENDPOINTS.EXPERIMENT_RESULTS(id),
      opts,
    );
    return {
      experimentId: data.experiment_id,
      variantA: mapVariant(data.variant_a),
      variantB: mapVariant(data.variant_b),
      winner: data.winner,
      computedAt: data.computed_at,
    };
  }
}
