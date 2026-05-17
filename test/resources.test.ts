import { describe, expect, it, vi } from "vitest";

import { FLOOPY_CONFIRM_VALUES, FLOOPY_HEADERS } from "../src/constants/headers.js";
import { Floopy } from "../src/client.js";

function makeClient(handler: (req: Request) => Response | Promise<Response>): Floopy {
  const fetchImpl = vi.fn().mockImplementation(async (url, init) => {
    const req = new Request(url, init);
    return handler(req);
  });
  return new Floopy({
    apiKey: "fl_test",
    baseURL: "https://gw.test/v1",
    maxRetries: 0,
    fetch: fetchImpl as unknown as typeof fetch,
  });
}

describe("FeedbackResource", () => {
  it("posts feedback with snake_case body", async () => {
    let captured: { url: string; body: string | null } | undefined;
    const c = makeClient(async (req) => {
      captured = { url: req.url, body: await req.text() };
      return new Response(JSON.stringify({ duplicate: false, session_id: "sess_1" }), {
        status: 200,
      });
    });
    const res = await c.feedback.submit({ score: 9, useful: true, sessionId: "sess_1" });
    expect(res.duplicate).toBe(false);
    expect(res.sessionId).toBe("sess_1");
    expect(captured?.url).toBe("https://gw.test/v1/feedback");
    expect(JSON.parse(captured?.body ?? "{}")).toEqual({
      score: 9,
      useful: true,
      session_id: "sess_1",
    });
  });
});

describe("DecisionsResource", () => {
  it("maps wire format to camelCase", async () => {
    const c = makeClient(
      async () =>
        new Response(
          JSON.stringify({
            request_id: "req_1",
            session_id: null,
            request_created_at: "2026-05-10T00:00:00Z",
            provider: "openai",
            model: "gpt-4o",
            status: "ok",
            latency_ms: 123,
            cost_micro_usd: 4500,
            cache_enabled: true,
            threat: null,
            decision_trace: { nodes: [] },
            confidence: 0.9,
            confidence_reason: null,
            explanation: null,
          }),
          { status: 200 },
        ),
    );
    const d = await c.decisions.get("req_1");
    expect(d.requestId).toBe("req_1");
    expect(d.latencyMs).toBe(123);
    expect(d.cacheEnabled).toBe(true);
  });

  it("paginates via pages() generator", async () => {
    const pages = [
      { items: [decisionWire("req_1")], next_cursor: "cur_1", has_more: true },
      { items: [decisionWire("req_2")], next_cursor: null, has_more: false },
    ];
    let i = 0;
    const c = makeClient(async () => new Response(JSON.stringify(pages[i++]), { status: 200 }));
    const all = [];
    for await (const page of c.decisions.pages({ from: "2026-05-01T00:00:00Z" })) {
      all.push(...page.items);
    }
    expect(all.map((d) => d.requestId)).toEqual(["req_1", "req_2"]);
  });
});

describe("ExperimentsResource", () => {
  it("injects X-Floopy-Confirm on create and rollback", async () => {
    const captured: Headers[] = [];
    const c = makeClient(async (req) => {
      captured.push(req.headers);
      return new Response(JSON.stringify(experimentWire("exp_1")), { status: 200 });
    });
    await c.experiments.create({
      name: "test",
      variantARoutingRuleId: "rule_a",
      variantBRoutingRuleId: "rule_b",
    });
    await c.experiments.rollback("exp_1");
    expect(captured).toHaveLength(2);
    for (const h of captured) {
      expect(h.get(FLOOPY_HEADERS.CONFIRM)).toBe(FLOOPY_CONFIRM_VALUES.EXPERIMENTS);
    }
  });
});

describe("ConstraintsResource", () => {
  it("maps null fields and uses PUT", async () => {
    let method = "";
    const c = makeClient(async (req) => {
      method = req.method;
      return new Response(
        JSON.stringify({
          cost_limit_monthly_usd: 100,
          token_window_seconds: null,
          max_tokens_per_window: null,
          max_requests_per_minute: 60,
        }),
        { status: 200 },
      );
    });
    const res = await c.constraints.put({ costLimitMonthlyUsd: 100, maxRequestsPerMinute: 60 });
    expect(method).toBe("PUT");
    expect(res.costLimitMonthlyUsd).toBe(100);
    expect(res.tokenWindowSeconds).toBeNull();
  });
});

describe("ExportResource", () => {
  it("yields rows from JSONL stream and skips trailer", async () => {
    const lines = [
      JSON.stringify({
        request_id: "req_1",
        session_id: null,
        organization_id: "org_1",
        provider: "openai",
        model: "gpt-4o",
        status: "ok",
        latency_ms: 100,
        cost_micro_usd: 1000,
        cache_enabled: false,
        threat: null,
        created_at: "2026-05-10T00:00:00Z",
      }),
      JSON.stringify({
        request_id: "req_2",
        session_id: null,
        organization_id: "org_1",
        provider: "openai",
        model: "gpt-4o",
        status: "ok",
        latency_ms: 200,
        cost_micro_usd: 2000,
        cache_enabled: false,
        threat: null,
        created_at: "2026-05-10T00:01:00Z",
      }),
      JSON.stringify({ trailer: true, rows_emitted: 2, truncated: false, reason: null }),
    ].join("\n");
    const c = makeClient(
      async () =>
        new Response(lines, {
          status: 200,
          headers: { "Content-Type": "application/x-ndjson" },
        }),
    );
    const rows = [];
    for await (const row of c.export.decisions({
      from: "2026-05-01T00:00:00Z",
      to: "2026-06-01T00:00:00Z",
    })) {
      rows.push(row);
    }
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.requestId)).toEqual(["req_1", "req_2"]);
  });

  it("captures trailer via decisionsWithTrailer", async () => {
    const lines = [
      JSON.stringify({
        request_id: "req_1",
        session_id: null,
        organization_id: "org_1",
        provider: null,
        model: null,
        status: "ok",
        latency_ms: null,
        cost_micro_usd: null,
        cache_enabled: null,
        threat: null,
        created_at: "2026-05-10T00:00:00Z",
      }),
      JSON.stringify({ trailer: true, rows_emitted: 1, truncated: true, reason: "deadline" }),
    ].join("\n");
    const c = makeClient(async () => new Response(lines, { status: 200 }));
    const { rows, trailer } = c.export.decisionsWithTrailer({
      from: "2026-05-01T00:00:00Z",
      to: "2026-06-01T00:00:00Z",
    });
    const collected = [];
    for await (const r of rows) collected.push(r);
    expect(collected).toHaveLength(1);
    expect(trailer.value).toEqual({
      trailer: true,
      rowsEmitted: 1,
      truncated: true,
      reason: "deadline",
    });
  });
});

describe("RoutingResource", () => {
  it("maps explain wire shape", async () => {
    const c = makeClient(
      async () =>
        new Response(
          JSON.stringify({
            would_select: { provider: "openai", model: "gpt-4o-mini" },
            firewall_decision: "allow",
            reasoning: null,
            routing_rule_id: "rule_1",
          }),
          { status: 200 },
        ),
    );
    const res = await c.routing.explain({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(res.wouldSelect).toEqual({ provider: "openai", model: "gpt-4o-mini" });
    expect(res.firewallDecision).toBe("allow");
  });
});

describe("EvaluationsResource", () => {
  it("creates and retrieves a run", async () => {
    let captured: { method: string; path: string; body: string | null } | undefined;
    const c = makeClient(async (req) => {
      captured = {
        method: req.method,
        path: new URL(req.url).pathname,
        body: req.body !== null ? await req.text() : null,
      };
      return new Response(JSON.stringify(evaluationRunWire("eval_1")), { status: 201 });
    });
    const run = await c.evaluations.create({ datasetId: "ds_1", model: "gpt-4o" });
    expect(captured?.method).toBe("POST");
    expect(captured?.path).toBe("/v1/evaluations");
    expect(JSON.parse(captured?.body ?? "{}")).toEqual({ dataset_id: "ds_1", model: "gpt-4o" });
    expect(run.id).toBe("eval_1");
  });
});

describe("SessionsResource", () => {
  it("maps wire format to camelCase and hits the encoded path", async () => {
    let captured: { method: string; path: string } | undefined;
    const c = makeClient(async (req) => {
      const u = new URL(req.url);
      captured = { method: req.method, path: u.pathname };
      return new Response(
        JSON.stringify({
          session_id: "sess/1",
          messages: [
            { role: "user", content: "hi" },
            { role: "assistant", content: "hello" },
          ],
          turn_count: 1,
          turns: [
            {
              request_id: "r1",
              created_at: "2026-05-17T10:00:00Z",
              model: "gpt-4o",
              provider: "openai",
            },
          ],
        }),
        { status: 200 },
      );
    });

    const s = await c.sessions.get("sess/1");

    expect(captured?.method).toBe("GET");
    expect(captured?.path).toBe("/v1/session/sess%2F1");
    expect(s.sessionId).toBe("sess/1");
    expect(s.turnCount).toBe(1);
    expect(s.messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
    expect(s.turns).toEqual([
      {
        requestId: "r1",
        createdAt: "2026-05-17T10:00:00Z",
        model: "gpt-4o",
        provider: "openai",
      },
    ]);
  });

  it("forwards per-request options (headers)", async () => {
    let auth: string | null = null;
    const c = makeClient(async (req) => {
      auth = req.headers.get("x-trace");
      return new Response(
        JSON.stringify({ session_id: "s", messages: [], turn_count: 0, turns: [] }),
        { status: 200 },
      );
    });

    const s = await c.sessions.get("s", { headers: { "x-trace": "abc" } });

    expect(auth).toBe("abc");
    expect(s.turnCount).toBe(0);
    expect(s.messages).toEqual([]);
    expect(s.turns).toEqual([]);
  });
});

function decisionWire(id: string) {
  return {
    request_id: id,
    session_id: null,
    request_created_at: "2026-05-10T00:00:00Z",
    provider: null,
    model: null,
    status: "ok",
    latency_ms: null,
    cost_micro_usd: null,
    cache_enabled: null,
    threat: null,
    decision_trace: null,
    confidence: null,
    confidence_reason: null,
    explanation: null,
  };
}

function experimentWire(id: string) {
  return {
    id,
    name: "test",
    description: null,
    status: "active",
    variant_a_routing_rule_id: "rule_a",
    variant_b_routing_rule_id: "rule_b",
    split_percentage: 50,
    created_at: "2026-05-10T00:00:00Z",
    rolled_back_at: null,
  };
}

function evaluationRunWire(id: string) {
  return {
    id,
    dataset_id: "ds_1",
    model: "gpt-4o",
    prompt_id: null,
    status: "pending",
    config: null,
    created_at: "2026-05-10T00:00:00Z",
    started_at: null,
    finished_at: null,
  };
}
