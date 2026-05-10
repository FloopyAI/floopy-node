import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
});

const r = await floopy.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Reply with: 'hello world'" }],
});

const result = await floopy.feedback.submit({
  score: 9,
  useful: true,
  sessionId: r.id,
});

console.log("feedback duplicate?", result.duplicate);
