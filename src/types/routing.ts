import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface RoutingExplainParams {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface RoutingExplainResult {
  wouldSelect: { provider: string; model: string } | null;
  firewallDecision: "allow" | "block_input";
  reasoning: string | null;
  routingRuleId: string | null;
}
