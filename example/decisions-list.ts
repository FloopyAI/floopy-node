import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

let count = 0;
for await (const decision of floopy.decisions.iterate({ from: since, limit: 50 })) {
  count += 1;
  if (count <= 5) {
    console.log(decision.requestId, decision.provider, decision.model, decision.status);
  }
}
console.log(`total: ${count}`);
