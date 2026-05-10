import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const current = await floopy.constraints.get();
console.log("current:", current);

// PUT replaces all fields — pass null to clear, omit to reset.
const updated = await floopy.constraints.put({
  costLimitMonthlyUsd: 250,
  maxRequestsPerMinute: 120,
});

console.log("updated:", updated);
