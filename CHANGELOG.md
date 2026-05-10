# Changelog

All notable changes to `floopy-sdk` are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/).

Releases are produced by `release-please` from Conventional Commits.

## [0.2.1](https://github.com/FloopyAI/floopy-node/compare/floopy-sdk-v0.2.0...floopy-sdk-v0.2.1) (2026-05-10)


### Fixed

* package repository url ([d46cb09](https://github.com/FloopyAI/floopy-node/commit/d46cb09b8713f694d97f478d58e5e021bc958cdd))

## [0.2.0](https://github.com/FloopyAI/floopy-node/compare/floopy-sdk-v0.1.0...floopy-sdk-v0.2.0) (2026-05-10)


### Added

* new node SDK initial commit ([f2b7b29](https://github.com/FloopyAI/floopy-node/commit/f2b7b2993e703bff9229517918a509fa97518cbf))

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
