import { describe, expect, it, vi } from "vitest";

import { Floopy } from "../src/client.js";
import { resolveBatchOptions } from "../src/resources/batch-options.js";

interface Captured {
  method: string;
  url: string;
  provider: string | null;
  trace: string | null;
  body: string | null;
  form: FormData | null;
}

function makeClient(
  handler: (req: Request) => Response | Promise<Response>,
): { client: Floopy; captured: () => Captured | undefined } {
  let cap: Captured | undefined;
  const fetchImpl = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
    const req = new Request(url, init);
    const ct = req.headers.get("content-type") ?? "";
    let body: string | null = null;
    let form: FormData | null = null;
    if (ct.includes("multipart/form-data")) form = await req.clone().formData();
    else body = await req.clone().text();
    cap = {
      method: req.method,
      url: req.url,
      provider: req.headers.get("floopy-provider"),
      trace: req.headers.get("x-trace"),
      body,
      form,
    };
    return handler(req);
  });
  const client = new Floopy({
    apiKey: "fl_test",
    baseURL: "https://gw.test/v1",
    maxRetries: 0,
    fetch: fetchImpl as unknown as typeof fetch,
  });
  return { client, captured: () => cap };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("resolveBatchOptions", () => {
  it("returns undefined when no options", () => {
    expect(resolveBatchOptions(undefined)).toBeUndefined();
  });

  it("returns the rest untouched when no provider", () => {
    expect(resolveBatchOptions({ timeout: 5 })).toEqual({ timeout: 5 });
  });

  it("injects floopy-provider when no prior headers", () => {
    expect(resolveBatchOptions({ provider: "openai" })).toEqual({
      headers: { "floopy-provider": "openai" },
    });
  });

  it("merges floopy-provider on top of existing headers", () => {
    expect(
      resolveBatchOptions({ provider: "groq", headers: { "x-trace": "t1" }, timeout: 9 }),
    ).toEqual({
      timeout: 9,
      headers: { "x-trace": "t1", "floopy-provider": "groq" },
    });
  });
});

describe("FilesResource", () => {
  it("uploads multipart with purpose, filename and provider header", async () => {
    const { client, captured } = makeClient(async () =>
      json({ id: "file-1", object: "file", purpose: "batch", status: "processed" }),
    );
    const blob = new Blob(["{}\n"], { type: "application/jsonl" });
    const res = await client.files.upload(
      { file: blob, filename: "in.jsonl", purpose: "batch" },
      { provider: "openai" },
    );
    expect(res.id).toBe("file-1");
    const c = captured();
    expect(c?.method).toBe("POST");
    expect(c?.url).toBe("https://gw.test/v1/files");
    expect(c?.provider).toBe("openai");
    expect(c?.form?.get("purpose")).toBe("batch");
    const file = c?.form?.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("in.jsonl");
  });

  it("uploads without an explicit filename", async () => {
    const { client, captured } = makeClient(async () => json({ id: "file-2" }));
    await client.files.upload({ file: new Blob(["x"]), purpose: "batch" });
    expect(captured()?.form?.get("file")).toBeInstanceOf(Blob);
    expect(captured()?.provider).toBeNull();
  });

  it("lists files with query params", async () => {
    const { client, captured } = makeClient(async () => json({ object: "list", data: [] }));
    const res = await client.files.list({ purpose: "batch", limit: 10, after: "file-9" });
    expect(res.data).toEqual([]);
    expect(captured()?.url).toBe(
      "https://gw.test/v1/files?purpose=batch&limit=10&after=file-9",
    );
  });

  it("lists files with no params", async () => {
    const { client, captured } = makeClient(async () => json({ object: "list", data: [] }));
    await client.files.list();
    expect(captured()?.url).toBe("https://gw.test/v1/files");
  });

  it("retrieves a file", async () => {
    const { client, captured } = makeClient(async () => json({ id: "file-1" }));
    const res = await client.files.retrieve("file-1", { provider: "openai" });
    expect(res.id).toBe("file-1");
    expect(captured()?.url).toBe("https://gw.test/v1/files/file-1");
    expect(captured()?.provider).toBe("openai");
  });

  it("downloads raw file content", async () => {
    const { client, captured } = makeClient(
      async () => new Response('{"a":1}\n', { status: 200 }),
    );
    const res = await client.files.content("file-out");
    expect(await res.text()).toBe('{"a":1}\n');
    expect(captured()?.url).toBe("https://gw.test/v1/files/file-out/content");
  });

  it("deletes a file", async () => {
    const { client, captured } = makeClient(async () =>
      json({ id: "file-1", object: "file", deleted: true }),
    );
    const res = await client.files.delete("file-1");
    expect(res.deleted).toBe(true);
    expect(captured()?.method).toBe("DELETE");
  });
});

describe("BatchesResource", () => {
  it("creates a batch with provider header and JSON body", async () => {
    const { client, captured } = makeClient(async () =>
      json({ id: "batch_1", status: "validating" }),
    );
    const res = await client.batches.create(
      { input_file_id: "file-1", endpoint: "/v1/chat/completions", completion_window: "24h" },
      { provider: "openai" },
    );
    expect(res.id).toBe("batch_1");
    const c = captured();
    expect(c?.method).toBe("POST");
    expect(c?.url).toBe("https://gw.test/v1/batches");
    expect(c?.provider).toBe("openai");
    expect(JSON.parse(c?.body ?? "{}")).toEqual({
      input_file_id: "file-1",
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
    });
  });

  it("lists batches with and without params", async () => {
    const { client, captured } = makeClient(async () => json({ object: "list", data: [] }));
    await client.batches.list({ limit: 5, after: "batch_9" });
    expect(captured()?.url).toBe("https://gw.test/v1/batches?limit=5&after=batch_9");
    await client.batches.list();
    expect(captured()?.url).toBe("https://gw.test/v1/batches");
  });

  it("retrieves a batch", async () => {
    const { client, captured } = makeClient(async () =>
      json({ id: "batch_1", status: "completed", output_file_id: "file-out" }),
    );
    const res = await client.batches.retrieve("batch_1");
    expect(res.status).toBe("completed");
    expect(captured()?.url).toBe("https://gw.test/v1/batches/batch_1");
  });

  it("cancels a batch", async () => {
    const { client, captured } = makeClient(async () =>
      json({ id: "batch_1", status: "cancelling" }),
    );
    const res = await client.batches.cancel("batch_1", {
      headers: { "x-trace": "t1" },
    });
    expect(res.status).toBe("cancelling");
    const c = captured();
    expect(c?.method).toBe("POST");
    expect(c?.url).toBe("https://gw.test/v1/batches/batch_1/cancel");
    expect(c?.trace).toBe("t1");
  });
});
