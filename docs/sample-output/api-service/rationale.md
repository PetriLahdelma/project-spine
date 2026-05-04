# Ledger API — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `7040c29c1d1f2ab2`, project type `api-service`._

<!-- spine:deterministic -->

## What we are building

- Ship v1 of the Ledger billing API for internal consumers in 8 weeks.
- p95 read-path latency under 120ms; p95 write-path under 250ms.
- One stable error envelope across every endpoint — no raw stack traces ever reach a client.
- OpenAPI spec generated from the same type definitions the runtime uses.

## Who we are building it for

- Internal services within the Acme platform (3 consumers today, 6 planned by v1).
- Consumer SDK authors who will codegen typed clients from the OpenAPI spec.
- Oncall engineers who need structured logs that answer "what went wrong for request X."

## Constraints we accepted

- Node 20 + Fastify 4 + PostgreSQL 16 (managed). No ORM for v1 — typed query layer over pg.
- Auth is API-key only for v1 (internal service mesh). OAuth 2.1 client-credentials is a v2 follow-up.
- Deployment target: containers on the shared Acme platform (not serverless).
- Observability stack is fixed: structured JSON logs → Loki; traces → Tempo; metrics → Prometheus.

## Assumptions we are making

- Traffic stays under 500 rps during the beta window; headroom is fine.
- Internal consumers accept beta-level SLAs (99.5% availability, 48h incident-response).
- No public-internet exposure in v1 — mTLS at the mesh layer handles transport security.

## Risks we are watching

- Downstream dependency on the legacy Pricing service (SLA not formally documented).
- Schema drift between services during migration from the existing monolith — need a contract-check step.
- Pager fatigue from over-alerting on structured log volume; need explicit log-level discipline.

## The stack we are using

Framework: **node-library**. Language: **typescript** (strict). Testing: **vitest**.

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.

## Open questions

- Framework detection confidence 0.4. Evidence: no framework dep; looks like a node library
