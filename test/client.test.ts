import { describe, expect, it, vi } from "vitest";

import { FLOOPY_HEADERS } from "../src/constants/headers.js";
import { Floopy } from "../src/client.js";
import { FloopyError } from "../src/errors.js";

describe("Floopy client", () => {
  it("requires apiKey", () => {
    expect(() => new Floopy({ apiKey: "" })).toThrow(FloopyError);
  });

  it("exposes lazy openai delegate", () => {
    const c = new Floopy({ apiKey: "fl_test" });
    expect(c.openai).toBeDefined();
    expect(c.openai).toBe(c.openai); // same instance reused
    expect(c.chat).toBeDefined();
    expect(c.embeddings).toBeDefined();
    expect(c.models).toBeDefined();
  });

  it("includes Floopy headers when client options are set", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const c = new Floopy({
      apiKey: "fl_test",
      baseURL: "https://gw.local/v1",
      fetch: fakeFetch as unknown as typeof fetch,
      options: {
        cache: { enabled: true, bucketMaxSize: 4 },
        promptId: "p1",
        llmSecurityEnabled: true,
      },
    });
    await c._http.request("GET", "/decisions/abc");
    expect(fakeFetch).toHaveBeenCalledOnce();
    const [url, init] = fakeFetch.mock.calls[0]!;
    expect(url).toBe("https://gw.local/v1/decisions/abc");
    const headers = init.headers as Record<string, string>;
    expect(headers[FLOOPY_HEADERS.AUTHORIZATION]).toBe("Bearer fl_test");
    expect(headers[FLOOPY_HEADERS.CACHE_ENABLED]).toBe("true");
    expect(headers[FLOOPY_HEADERS.CACHE_BUCKET_MAX_SIZE]).toBe("4");
    expect(headers[FLOOPY_HEADERS.PROMPT_ID]).toBe("p1");
    expect(headers[FLOOPY_HEADERS.LLM_SECURITY_ENABLED]).toBe("true");
  });

  it("maps non-2xx into FloopyError subclasses", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "rate_limited", message: "slow down" } }), {
        status: 429,
        headers: { "Retry-After": "5", [FLOOPY_HEADERS.REQUEST_ID]: "req_x" },
      }),
    );
    const c = new Floopy({
      apiKey: "fl_test",
      maxRetries: 0,
      fetch: fakeFetch as unknown as typeof fetch,
    });
    await expect(c._http.request("GET", "/decisions")).rejects.toMatchObject({
      name: "FloopyRateLimitError",
      status: 429,
      requestId: "req_x",
      retryAfterSeconds: 5,
    });
  });

  it("retries 5xx up to maxRetries", async () => {
    const responses = [
      new Response("{}", { status: 503 }),
      new Response("{}", { status: 503 }),
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ];
    const fakeFetch = vi.fn().mockImplementation(() => Promise.resolve(responses.shift()!));
    const c = new Floopy({
      apiKey: "fl_test",
      maxRetries: 2,
      fetch: fakeFetch as unknown as typeof fetch,
    });
    const { data } = await c._http.request<{ ok: boolean }>("GET", "/decisions");
    expect(data.ok).toBe(true);
    expect(fakeFetch).toHaveBeenCalledTimes(3);
  });
});
