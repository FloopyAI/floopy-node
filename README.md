# `floopy-sdk`

> Official Floopy AI Gateway SDK for Node and TypeScript. **Drop-in
> replacement for the [`openai`](https://www.npmjs.com/package/openai) SDK**
> with Floopy's cache, audit, experiments, routing, and security on top.

[![npm](https://img.shields.io/npm/v/floopy-sdk?color=22c55e&label=npm)](https://www.npmjs.com/package/floopy-sdk)
[![docs](https://img.shields.io/badge/docs-floopy.ai-blue)](https://floopy.ai/docs/sdk/node)

## Why

`floopy-sdk` wraps the official `openai-node` package and points it at the
Floopy gateway, so:

- **Zero migration cost** for `chat.completions` and `embeddings` — same
  types, same methods.
- **Security updates** to the OpenAI SDK reach you on `pnpm update` without
  forks or paritydrift.
- **Floopy-only features** (audit, experiments, constraints, decision export,
  feedback, routing dry-run) get **first-class typed methods** instead of raw
  `fetch` calls.

## Install

```sh
pnpm add floopy-sdk          # or: npm i floopy-sdk / bun add floopy-sdk
```

Requires Node `>= 20`.

## Quick start

```ts
import { Floopy } from "floopy-sdk";

const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
});

const response = await floopy.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello from Floopy!" }],
});

console.log(response.choices[0]?.message?.content);
```

That's the entire migration path. The next sections show how to opt in to
Floopy-specific behavior.

### Migrating from `openai`

```diff
- import OpenAI from "openai";
- const client = new OpenAI({
-   apiKey: process.env.OPENAI_API_KEY,
- });
+ import { Floopy } from "floopy-sdk";
+ const client = new Floopy({
+   apiKey: process.env.FLOOPY_API_KEY!,
+ });

 const r = await client.chat.completions.create({
   model: "gpt-4o",
   messages: [{ role: "user", content: "..." }],
 });
```

The `client.chat`, `client.embeddings`, and `client.models` getters return
the underlying `openai-node` resources, so types and runtime behavior are
identical.

Full guide: <https://floopy.ai/docs/sdk/migrating-from-openai>.

## Floopy options (cache, prompt versioning, security firewall)

```ts
const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  options: {
    cache: { enabled: true, bucketMaxSize: 3 },
    promptId: "cd4249d5-44d5-46c8-8961-9eb3861e1f7e",
    promptVersion: "1",
    llmSecurityEnabled: true,
  },
});
```

These map to `Floopy-*` headers and are forwarded to **every** request
(both OpenAI-compat calls and Floopy-only ones). Per-call overrides are
available on every Floopy resource.

| Option | Header | Purpose |
| --- | --- | --- |
| `cache.enabled` | `Floopy-Cache-Enabled` | Toggle exact + semantic cache |
| `cache.bucketMaxSize` | `Floopy-Cache-Bucket-Max-Size` | Max entries per semantic bucket |
| `promptId` | `Floopy-Prompt-Id` | Stored prompt to resolve |
| `promptVersion` | `Floopy-Prompt-Version` | Pinned version for `promptId` |
| `llmSecurityEnabled` | `floopy-llm-security-enabled` | LLM firewall pre-check |

See <https://floopy.ai/docs/concepts/cache> and
<https://floopy.ai/docs/concepts/security> for the full feature docs.

## Floopy-only resources

Each resource maps to a public `/v1/*` endpoint of the gateway and is
typed end-to-end. Errors are `FloopyError` subclasses (see below).

### `feedback`

```ts
const r = await floopy.chat.completions.create({ /* ... */ });
await floopy.feedback.submit({ score: 9, useful: true, sessionId: r.id });
```

### `decisions`

```ts
const decision = await floopy.decisions.get(requestId);

const page = await floopy.decisions.list({ from, to, limit: 50 });

for await (const d of floopy.decisions.iterate({ from })) { /* one at a time */ }
for await (const p of floopy.decisions.pages({ from })) { /* page at a time */ }
```

### `experiments`

```ts
const exp = await floopy.experiments.create({
  name: "cost-vs-quality",
  variantARoutingRuleId: ruleA,
  variantBRoutingRuleId: ruleB,
});
const results = await floopy.experiments.results(exp.id);
await floopy.experiments.rollback(exp.id);
```

`create` and `rollback` automatically include the `X-Floopy-Confirm:
experiments` header the gateway requires (SEC-009).

### `constraints`

```ts
const current = await floopy.constraints.get();
await floopy.constraints.put({ costLimitMonthlyUsd: 100 });
```

`put` is full-replace: omitted fields are reset.

### `export`

```ts
for await (const row of floopy.export.decisions({ from, to })) {
  // streamed JSONL, parsed and typed
}

// to also read the trailer (truncation reasons, totals):
const { rows, trailer } = floopy.export.decisionsWithTrailer({ from, to });
for await (const r of rows) { /* ... */ }
console.log(trailer.value); // populated after iteration completes
```

### `evaluations`

```ts
const run = await floopy.evaluations.create({ datasetId, model: "gpt-4o" });
const status = await floopy.evaluations.get(run.id);
const results = await floopy.evaluations.results(run.id, { limit: 100 });
await floopy.evaluations.cancel(run.id);
```

### `routing.explain`

```ts
const explain = await floopy.routing.explain({ model, messages });
console.log(explain.wouldSelect, explain.firewallDecision);
```

Pro plan only. `wouldSelect` is `null` if the firewall blocks the request.

Per-resource references with full options live under
<https://floopy.ai/docs/sdk/node>.

## Streaming

`chat.completions` streaming is delegated to `openai-node` and returns an
`AsyncIterable<ChatCompletionChunk>`. The `export.decisions` resource
returns a `AsyncIterable<DecisionRow>` over the gateway's JSONL stream
(0.2.0).

## Error handling

Every Floopy-only call rejects with a `FloopyError` subclass:

```ts
import { FloopyRateLimitError, FloopyPlanError } from "floopy-sdk";

try {
  await floopy.export.decisions({ from, to });
} catch (err) {
  if (err instanceof FloopyRateLimitError) {
    await sleep((err.retryAfterSeconds ?? 1) * 1000);
  } else if (err instanceof FloopyPlanError) {
    console.error(`Upgrade plan: feature ${err.feature} not in current plan`);
  } else throw err;
}
```

Errors from `chat.completions` and `embeddings` are emitted by the OpenAI
SDK (`OpenAI.APIError` and friends).

## Self-hosting / custom base URL

```ts
const floopy = new Floopy({
  apiKey: process.env.FLOOPY_API_KEY!,
  baseURL: "https://gateway.internal.acme.com/v1",
});
```

## Links

- Full SDK reference: <https://floopy.ai/docs/sdk/node>
- API reference: <https://floopy.ai/docs/api>
- Migrating from `openai`: <https://floopy.ai/docs/sdk/migrating-from-openai>
- Cache concepts: <https://floopy.ai/docs/concepts/cache>
- Audit concepts: <https://floopy.ai/docs/concepts/audit>
- Experiments concepts: <https://floopy.ai/docs/concepts/experiments>
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## License

Apache-2.0 © Floopy
