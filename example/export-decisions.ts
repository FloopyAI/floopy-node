import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const to = new Date().toISOString();

const { rows, trailer } = floopy.export.decisionsWithTrailer({ from, to });

let n = 0;
for await (const row of rows) {
  n += 1;
  if (n <= 3) console.log(row.requestId, row.model, row.costMicroUsd);
}

console.log(`exported ${n} rows`);
if (trailer.value !== null) {
  console.log("trailer:", trailer.value);
}
