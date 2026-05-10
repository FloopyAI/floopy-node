import { ENDPOINTS } from "../constants/endpoints.js";
import type { FloopyHttp } from "../http.js";
import type { RequestOptions } from "../types/shared.js";
import type {
  RoutingExplainParams,
  RoutingExplainResult,
} from "../types/routing.js";

interface RoutingExplainWire {
  would_select: { provider: string; model: string } | null;
  firewall_decision: "allow" | "block_input";
  reasoning: string | null;
  routing_rule_id: string | null;
}

export class RoutingResource {
  constructor(private readonly http: FloopyHttp) {}

  async explain(
    params: RoutingExplainParams,
    requestOptions?: RequestOptions,
  ): Promise<RoutingExplainResult> {
    const body: Record<string, unknown> = {
      model: params.model,
      messages: params.messages,
    };
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.maxTokens !== undefined) body.max_tokens = params.maxTokens;
    if (params.topP !== undefined) body.top_p = params.topP;
    const opts: { body: unknown; requestOptions?: RequestOptions } = { body };
    if (requestOptions !== undefined) opts.requestOptions = requestOptions;
    const { data } = await this.http.request<RoutingExplainWire>(
      "POST",
      ENDPOINTS.ROUTING_EXPLAIN,
      opts,
    );
    return {
      wouldSelect: data.would_select,
      firewallDecision: data.firewall_decision,
      reasoning: data.reasoning,
      routingRuleId: data.routing_rule_id,
    };
  }
}
