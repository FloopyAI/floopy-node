# `floopy-sdk` examples

Runnable snippets for every public surface of the SDK. **Not** part of the
published npm tarball.

## Setup

```sh
# from floopy-node/example
pnpm install            # installs the local workspace copy of floopy-sdk
cp .env.example .env    # add your FLOOPY_API_KEY
pnpm chat               # runs chat.ts
```

By default examples talk to `https://api.floopy.ai/v1`. To point at a local
gateway, set `FLOOPY_BASE_URL=http://localhost:8000/v1`.

## Files

| File | What it shows |
| --- | --- |
| `chat.ts` | Basic chat completion (drop-in for `openai`) |
| `chat-stream.ts` | Streaming SSE response |
| `embeddings.ts` | Single + batch embeddings |
| `feedback.ts` | Submit NPS-style feedback (PR2) |
| `decisions-list.ts` | List + paginate decisions (PR2) |
| `export-decisions.ts` | Async iterator over JSONL export (PR2) |
| `experiments-create.ts` | Create + rollback an experiment (PR2) |
| `constraints.ts` | Read + upsert org constraints (PR2) |
| `routing-explain.ts` | Routing dry-run (PR2) |
