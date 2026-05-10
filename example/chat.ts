import "dotenv/config";

import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: process.env.FLOOPY_BASE_URL,
  options: {
    cache: { enabled: true, bucketMaxSize: 3 },
    llmSecurityEnabled: true,
  },
});

const response = await floopy.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are a concise assistant." },
    { role: "user", content: "Say hi from Floopy in one sentence." },
  ],
});

console.log(response.choices[0]?.message?.content);
