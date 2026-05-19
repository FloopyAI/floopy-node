# Changelog

All notable changes to `floopy-sdk` are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/).

Releases are produced by `release-please` from Conventional Commits.

## [0.4.0](https://github.com/FloopyAI/floopy-node/compare/floopy-sdk-v0.3.0...floopy-sdk-v0.4.0) (2026-05-19)


### Added

* add Batch and Files API resources ([8159d77](https://github.com/FloopyAI/floopy-node/commit/8159d77869d54f654718e31f03eedcd22b7e9d01))
* Batch and Files API ([f557b12](https://github.com/FloopyAI/floopy-node/commit/f557b1239864db8d64089efea694909cb6a9296a))

## [0.3.0](https://github.com/FloopyAI/floopy-node/compare/floopy-sdk-v0.2.1...floopy-sdk-v0.3.0) (2026-05-17)


### Added

* add sessions.get() to restore a stored conversation ([d9da600](https://github.com/FloopyAI/floopy-node/commit/d9da600333c2fe1fa695c366e6928d2d2e784788))
* add sessions.get() to restore a stored conversation ([36d5b2a](https://github.com/FloopyAI/floopy-node/commit/36d5b2ab9cd0bb0894798029f551fca639f55b36))


### Dependencies

* bump openai from 6.37.0 to 6.38.0 ([fcc0f98](https://github.com/FloopyAI/floopy-node/commit/fcc0f98ce2210be4c8bd56c419835aa7d7c05c71))

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
