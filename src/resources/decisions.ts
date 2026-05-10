import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type {
  Decision,
  DecisionListPage,
  DecisionListParams,
} from "../types/decisions.js";

interface DecisionWire {
  request_id: string;
  session_id: string | null;
  request_created_at: string;
  provider: string | null;
  model: string | null;
  status: string;
  latency_ms: number | null;
  cost_micro_usd: number | null;
  cache_enabled: boolean | null;
  threat: string | null;
  decision_trace: unknown;
  confidence: number | null;
  confidence_reason: string | null;
  explanation: string | null;
}

interface DecisionListWire {
  items: DecisionWire[];
  next_cursor: string | null;
  has_more: boolean;
}

function mapDecision(w: DecisionWire): Decision {
  return {
    requestId: w.request_id,
    sessionId: w.session_id,
    requestCreatedAt: w.request_created_at,
    provider: w.provider,
    model: w.model,
    status: w.status,
    latencyMs: w.latency_ms,
    costMicroUsd: w.cost_micro_usd,
    cacheEnabled: w.cache_enabled,
    threat: w.threat,
    decisionTrace: w.decision_trace,
    confidence: w.confidence,
    confidenceReason: w.confidence_reason,
    explanation: w.explanation,
  };
}

export class DecisionsResource {
  constructor(private readonly http: FloopyHttp) {}

  async get(requestId: string, requestOptions?: RequestOptions): Promise<Decision> {
    const opts: { requestOptions?: RequestOptions } = {};
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<DecisionWire>(
      "GET",
      ENDPOINTS.DECISION_BY_ID(requestId),
      opts,
    );
    return mapDecision(data);
  }

  async list(
    params: DecisionListParams = {},
    requestOptions?: RequestOptions,
  ): Promise<DecisionListPage> {
    return this.fetchPage(params, requestOptions);
  }

  /**
   * Iterate every page that matches `params`. Each yielded value is one
   * page; use a nested loop to walk individual decisions.
   */
  async *pages(
    params: DecisionListParams = {},
    requestOptions?: RequestOptions,
  ): AsyncGenerator<DecisionListPage, void, void> {
    let cursor = params.cursor;
    while (true) {
      const next: DecisionListParams = { ...params };
      if (cursor !== undefined) next.cursor = cursor;
      const page = await this.fetchPage(next, requestOptions);
      yield page;
      if (!page.hasMore || page.nextCursor === null) return;
      cursor = page.nextCursor;
    }
  }

  /** Yield every decision across all pages. */
  async *iterate(
    params: DecisionListParams = {},
    requestOptions?: RequestOptions,
  ): AsyncGenerator<Decision, void, void> {
    for await (const page of this.pages(params, requestOptions)) {
      for (const decision of page.items) yield decision;
    }
  }

  private async fetchPage(
    params: DecisionListParams,
    requestOptions: RequestOptions | undefined,
  ): Promise<DecisionListPage> {
    const query: Record<string, string | number | undefined> = {};
    if (params.sessionId !== undefined) query.session_id = params.sessionId;
    if (params.from !== undefined) query.from = params.from;
    if (params.to !== undefined) query.to = params.to;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.cursor !== undefined) query.cursor = params.cursor;
    const opts: {
      query: typeof query;
      requestOptions?: RequestOptions;
    } = { query };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<DecisionListWire>(
      "GET",
      ENDPOINTS.DECISIONS,
      opts,
    );
    return {
      items: data.items.map(mapDecision),
      nextCursor: data.next_cursor,
      hasMore: data.has_more,
    };
  }
}
