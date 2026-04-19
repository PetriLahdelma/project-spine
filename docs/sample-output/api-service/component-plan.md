# Component plan

> How components are organized and how agents should extend them.

_Generated from `spine.json` — hash `bcaf67e27f36d134`, project type `api-service`._

<!-- spine:deterministic -->

## Buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Usage guidance

- ErrorEnvelope — one JSON shape for every 4xx/5xx: { error: { code, message, requestId, details? } }. <sup>`template:template:api-service/contributes#0`</sup>
- RequestContext — per-request { requestId, traceId, user?, origin } carried through the handler stack. <sup>`template:template:api-service/contributes#1`</sup>
- RouteHandler — typed (req, ctx) => Promise<Response>. Zod-parses input, narrows at the edge, never leaks internal fields. <sup>`template:template:api-service/contributes#2`</sup>
- RateLimiter — middleware keyed on (user || ip, route). Returns 429 with Retry-After when tripped. <sup>`template:template:api-service/contributes#3`</sup>
- Logger — structured JSON only. One line per request (method, path, status, duration_ms, requestId, userId). <sup>`template:template:api-service/contributes#4`</sup>

## UX rules

- Error codes are stable strings ("auth.invalid_token", "ratelimit.exceeded"), not HTTP numbers. Clients switch on them. <sup>`template:template:api-service/contributes#0`</sup>
- Pagination uses cursor tokens, not offset+limit — drop offset from the public surface entirely. <sup>`template:template:api-service/contributes#1`</sup>
- Timestamps are ISO-8601 UTC strings. No unix epochs, no timezone guessing. <sup>`template:template:api-service/contributes#2`</sup>
