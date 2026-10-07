import { expect, it, vi } from "vitest";
import { Floopy } from "../src/client.js";

const output = { id: "resp_test", object: "response", created_at: 1, model: "gpt-6-luna", status: "completed", output: [{ id: "msg_1", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: "Olá", annotations: [] }] }], usage: { input_tokens: 3, output_tokens: 2, total_tokens: 5 } };

it("creates native responses with configured transport and gateway headers", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(output), { headers: { "content-type": "application/json" } }));
  const client = new Floopy({ apiKey: "fl_test", baseURL: "https://gw.local/v1", fetch: fetcher, maxRetries: 0, timeout: 1234, options: { llmSecurityEnabled: true, promptId: "p1" } });
  const result = await client.responses.create({ model: "gpt-6-luna", input: "hi", reasoning: { effort: "medium" }, tools: [{ type: "function", name: "lookup", parameters: {}, strict: false, description: "lookup" }], store: false });
  expect(result.output_text).toBe("Olá");
  expect(client.responses).toBe(client.openai.responses);
  expect(client.openai.timeout).toBe(1234);
  const [url, init] = fetcher.mock.calls[0]!;
  expect(String(url)).toBe("https://gw.local/v1/responses");
  const headers = new Headers(init.headers);
  expect(headers.get("authorization")).toBe("Bearer fl_test");
  expect(headers.get("floopy-llm-security-enabled")).toBe("true");
  expect(headers.get("floopy-prompt-id")).toBe("p1");
  expect(JSON.parse(init.body)).toMatchObject({ reasoning: { effort: "medium" }, tools: [{ name: "lookup" }] });
});

it("reads native typed streaming events", async () => {
  const event = { type: "response.output_text.delta", sequence_number: 0, delta: "Olá", item_id: "msg_1", output_index: 0, content_index: 0 };
  const frames = `event: response.output_text.delta\ndata: ${JSON.stringify(event)}\n\nevent: response.completed\ndata: ${JSON.stringify({ type: "response.completed", sequence_number: 1, response: output })}\n\n`;
  const fetcher = vi.fn().mockResolvedValue(new Response(frames, { headers: { "content-type": "text/event-stream" } }));
  const client = new Floopy({ apiKey: "fl_test", fetch: fetcher, maxRetries: 0 });
  const stream = await client.responses.create({ model: "gpt-6-luna", input: "hi", stream: true });
  const events = [];
  for await (const item of stream) events.push(item);
  expect(events[0]).toEqual(event);
  expect(events[1]?.type).toBe("response.completed");
});
