# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `7040c29c1d1f2ab2`, project type `api-service`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: Every endpoint documented in the generated OpenAPI spec with examples + error-envelope shape. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: Integration tests cover happy path, 4xx auth, 4xx validation, 5xx upstream-down — per endpoint. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: p95 latency budgets met under synthetic load for both read and write paths. <sup>`brief:brief.md#section5/item2`</sup>
- Success criterion to verify before launch: Zero raw stack traces in client responses across 7 days of beta traffic. <sup>`brief:brief.md#section5/item3`</sup>
- Success criterion to verify before launch: One-line log per request including requestId, userId, route, status, duration_ms. <sup>`brief:brief.md#section5/item4`</sup>
- Every 4xx / 5xx response conforms to the ErrorEnvelope shape; no raw framework errors leak. <sup>`template:template:api-service/contributes#0`</sup>
- Every handler has a typed input schema (zod or equivalent); invalid payloads get 400 with field-level details. <sup>`template:template:api-service/contributes#1`</sup>
- /health and /ready are always reachable, never gated by auth, and respond in under 50ms. <sup>`template:template:api-service/contributes#2`</sup>
- No secrets in logs, even at debug level. Redaction applied before the log line is emitted. <sup>`template:template:api-service/contributes#3`</sup>
- p95 latency budget declared per route and monitored; SLOs published. <sup>`template:template:api-service/contributes#4`</sup>
- Integration tests hit a real database / cache (or ephemeral container), not mocks. <sup>`template:template:api-service/contributes#5`</sup>

## Accessibility baseline

- All interactive elements must be reachable and operable with the keyboard alone. <sup>`inference:inferred:keyboard`</sup>
- Focus must be visible at all times; never remove outlines without replacing them. <sup>`inference:inferred:focus`</sup>
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text). <sup>`inference:inferred:contrast`</sup>
- Every form control has a programmatic label. <sup>`inference:inferred:labels`</sup>
- Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order. <sup>`inference:inferred:landmarks`</sup>
- Respect `prefers-reduced-motion` for any non-essential animation. <sup>`inference:inferred:motion`</sup>
- Responses include explicit Content-Language when returning localised error messages. <sup>`template:template:api-service/contributes#0`</sup>

## Definition of done (starter)

- [ ] Brief's success criteria all verified on a real environment.
- [ ] `tsc --noEmit` passes (if TypeScript).
- [ ] Lint passes with zero warnings on changed files.
- [ ] Tests run in CI and pass.
- [ ] All interactive surfaces tested with keyboard only.
- [ ] Screen reader pass on primary flows.
- [ ] No new dependencies added without explicit rationale.
- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, `project-spine.mdc`) reflect the current spine hash.

## Open warnings

- **[warn] repo:framework-uncertain** — Framework detection confidence 0.4. Evidence: no framework dep; looks like a node library
