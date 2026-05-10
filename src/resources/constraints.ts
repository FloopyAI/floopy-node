import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type { OrgConstraints } from "../types/constraints.js";

interface ConstraintsWire {
  cost_limit_monthly_usd: number | null;
  token_window_seconds: number | null;
  max_tokens_per_window: number | null;
  max_requests_per_minute: number | null;
}

function mapConstraints(w: ConstraintsWire): OrgConstraints {
  return {
    costLimitMonthlyUsd: w.cost_limit_monthly_usd,
    tokenWindowSeconds: w.token_window_seconds,
    maxTokensPerWindow: w.max_tokens_per_window,
    maxRequestsPerMinute: w.max_requests_per_minute,
  };
}

function toWire(c: OrgConstraints): ConstraintsWire {
  return {
    cost_limit_monthly_usd: c.costLimitMonthlyUsd ?? null,
    token_window_seconds: c.tokenWindowSeconds ?? null,
    max_tokens_per_window: c.maxTokensPerWindow ?? null,
    max_requests_per_minute: c.maxRequestsPerMinute ?? null,
  };
}

export class ConstraintsResource {
  constructor(private readonly http: FloopyHttp) {}

  async get(requestOptions?: RequestOptions): Promise<OrgConstraints> {
    const opts: { requestOptions?: RequestOptions } = {};
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<ConstraintsWire>(
      "GET",
      ENDPOINTS.CONSTRAINTS,
      opts,
    );
    return mapConstraints(data);
  }

  /**
   * Full-replace upsert. Fields omitted from `params` are reset to null
   * server-side (matches PUT semantics on the gateway).
   */
  async put(
    params: OrgConstraints,
    requestOptions?: RequestOptions,
  ): Promise<OrgConstraints> {
    const opts: { body: unknown; requestOptions?: RequestOptions } = { body: toWire(params) };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<ConstraintsWire>(
      "PUT",
      ENDPOINTS.CONSTRAINTS,
      opts,
    );
    return mapConstraints(data);
  }
}
