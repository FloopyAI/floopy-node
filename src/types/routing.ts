import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface RoutingExplainParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  /**
   * Legacy output-token cap. Prefer `maxCompletionTokens`; the gateway
   * coerces this into `max_completion_tokens` before forwarding to any
   * OpenAI-compatible provider.
   */
  maxTokens?: number;
  /**
   * Canonical output-token cap (the current OpenAI standard). Takes
   * precedence over `maxTokens` when both are set.
   */
  maxCompletionTokens?: number;
  topP?: number;
}

export interface RoutingExplainResult {
  wouldSelect: { provider: string; model: string } | null;
  firewallDecision: "allow" | "block_input";
  reasoning: string | null;
  routingRuleId: string | null;
}
