# Brief summary

_Normalized by Project Spine on 2026-05-04T21:04:10.735Z._

**Project:** Ledger API
**Type:** api-service _(confidence 1)_

## Goals

- Ship v1 of the Ledger billing API for internal consumers in 8 weeks.
- p95 read-path latency under 120ms; p95 write-path under 250ms.
- One stable error envelope across every endpoint — no raw stack traces ever reach a client.
- OpenAPI spec generated from the same type definitions the runtime uses.

## Audience

- Internal services within the Acme platform (3 consumers today, 6 planned by v1).
- Consumer SDK authors who will codegen typed clients from the OpenAPI spec.
- Oncall engineers who need structured logs that answer "what went wrong for request X."

## Constraints

- Node 20 + Fastify 4 + PostgreSQL 16 (managed). No ORM for v1 — typed query layer over pg.
- Auth is API-key only for v1 (internal service mesh). OAuth 2.1 client-credentials is a v2 follow-up.
- Deployment target: containers on the shared Acme platform (not serverless).
- Observability stack is fixed: structured JSON logs → Loki; traces → Tempo; metrics → Prometheus.

## Assumptions

- Traffic stays under 500 rps during the alpha window; headroom is fine.
- Internal consumers accept alpha-level SLAs (99.5% availability, 48h incident-response).
- No public-internet exposure in v1 — mTLS at the mesh layer handles transport security.

## Risks

- Downstream dependency on the legacy Pricing service (SLA not formally documented).
- Schema drift between services during migration from the existing monolith — need a contract-check step.
- Pager fatigue from over-alerting on structured log volume; need explicit log-level discipline.

## Success criteria

- Every endpoint documented in the generated OpenAPI spec with examples + error-envelope shape.
- Integration tests cover happy path, 4xx auth, 4xx validation, 5xx upstream-down — per endpoint.
- p95 latency budgets met under synthetic load for both read and write paths.
- Zero raw stack traces in client responses across 7 days of alpha traffic.
- One-line log per request including requestId, userId, route, status, duration_ms.

<!-- spine:deterministic -->
