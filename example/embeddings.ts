import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const single = await floopy.embeddings.create({
  model: "text-embedding-3-small",
  input: "Floopy routes any OpenAI-compatible call.",
});

const batch = await floopy.embeddings.create({
  model: "text-embedding-3-small",
  input: ["batch item 1", "batch item 2", "batch item 3"],
});

console.log("single dims:", single.data[0]?.embedding.length);
console.log("batch count:", batch.data.length);
