import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const stream = await floopy.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Stream a haiku about gateways." }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta !== undefined) process.stdout.write(delta);
}
process.stdout.write("\n");
