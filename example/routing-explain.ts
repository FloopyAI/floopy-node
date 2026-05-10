import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const explanation = await floopy.routing.explain({
  model: "gpt-4o",
  messages: [{ role: "user", content: "What's the cheapest way to summarize a 10k-token doc?" }],
});

console.log("would route to:", explanation.wouldSelect);
console.log("firewall:", explanation.firewallDecision);
console.log("rule id:", explanation.routingRuleId);
console.log("reasoning:", explanation.reasoning);
