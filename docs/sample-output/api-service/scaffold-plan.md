# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `d4f9df671b0e81f3`, project type `api-service`._

<!-- spine:deterministic -->

## Routes

- /health — liveness probe. 200 {status:"ok",commit:...}. No external deps.
- /ready — readiness probe. Fails if downstream deps (db, cache, upstream API) are unhealthy.
- /metrics — Prometheus text exposition. Restricted by network or bearer token.
- /v1/* — versioned public surface. Breaking changes move to /v2/, never rename in place.

## Component buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Sprint 1 seed

- Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/project-spine.mdc` after review. <sup>`inference:inferred:setup/agent-files`</sup>
- Pick and configure a linter (Biome or ESLint) with a minimal rule set. <sup>`inference:inferred:setup/lint`</sup>
- Deliver: Ship v1 of the Ledger billing API for internal consumers in 8 weeks. <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: p95 read-path latency under 120ms; p95 write-path under 250ms. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: One stable error envelope across every endpoint — no raw stack traces ever reach a client. <sup>`brief:brief.md#section0/item2`</sup>
- Deliver: OpenAPI spec generated from the same type definitions the runtime uses. <sup>`brief:brief.md#section0/item3`</sup>

## Stack notes

- **Framework:** `node-app`
- **Language:** `typescript`
- **Styling:** `unknown`
- **Package manager:** `unknown`
- **Testing:** `vitest`
