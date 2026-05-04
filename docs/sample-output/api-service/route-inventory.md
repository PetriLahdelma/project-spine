# Route inventory

> Proposed routes for the project, derived from project type and brief goals.

_Generated from `spine.json` — hash `7040c29c1d1f2ab2`, project type `api-service`._

<!-- spine:deterministic -->

## Routes

- /health — liveness probe. 200 {status:"ok",commit:...}. No external deps. <sup>`template:template:api-service/contributes#0`</sup>
- /ready — readiness probe. Fails if downstream deps (db, cache, upstream API) are unhealthy. <sup>`template:template:api-service/contributes#1`</sup>
- /metrics — Prometheus text exposition. Restricted by network or bearer token. <sup>`template:template:api-service/contributes#2`</sup>
- /v1/* — versioned public surface. Breaking changes move to /v2/, never rename in place. <sup>`template:template:api-service/contributes#3`</sup>

## Brief goals these routes serve

- Ship v1 of the Ledger billing API for internal consumers in 8 weeks.
- p95 read-path latency under 120ms; p95 write-path under 250ms.
- One stable error envelope across every endpoint — no raw stack traces ever reach a client.
- OpenAPI spec generated from the same type definitions the runtime uses.
