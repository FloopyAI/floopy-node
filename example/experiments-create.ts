import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

// Replace with real routing rule ids in your org.
const variantA = process.env.FLOOPY_VARIANT_A_RULE_ID ?? "rule_a_uuid";
const variantB = process.env.FLOOPY_VARIANT_B_RULE_ID ?? "rule_b_uuid";

const exp = await floopy.experiments.create({
  name: `cost-vs-quality-${Date.now()}`,
  description: "Compare gpt-4o-mini vs gpt-4o on free-tier traffic",
  variantARoutingRuleId: variantA,
  variantBRoutingRuleId: variantB,
  splitPercentage: 50,
});

console.log("created:", exp.id, exp.status);

// To roll back:
// const rolledBack = await floopy.experiments.rollback(exp.id);
// console.log("rolled back:", rolledBack.status);

// To inspect results once enough samples accumulate:
// const results = await floopy.experiments.results(exp.id);
// console.log(results);
