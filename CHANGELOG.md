# Changelog

All notable changes to `floopy-sdk` are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/).

Releases are produced by `release-please` from Conventional Commits.

## [Unreleased]

### Added

- Initial scaffold: `Floopy` client wrapping `openai-node` via lazy
  delegation, typed Floopy options mapped to `Floopy-*` headers, internal
  HTTP layer with retries/timeouts, and the `FloopyError` hierarchy.
  `chat.completions`, `embeddings`, and `models` reach the gateway 1:1
  with the upstream `openai` SDK.
- Floopy-only resources: `feedback`, `decisions` (+ paginated iterators),
  `experiments` (with auto `X-Floopy-Confirm`), `constraints`, `export`
  (JSONL async iterator with optional trailer capture), `evaluations`,
  and `routing.explain`. Each resource is fully typed end-to-end and
  rejects with the appropriate `FloopyError` subclass.
