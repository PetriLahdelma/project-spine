# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `6314a0c307118ea7`, project type `app-dashboard`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: New support lead reaches the default queue view in under 2 minutes. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: Role-gated routes deny access with a clear recovery path. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: Queue table handles 10,000 rows through server-side pagination. <sup>`brief:brief.md#section5/item2`</sup>
- Every data surface has loading, empty, error, and partial states covered. <sup>`template:template:app-dashboard/contributes#0`</sup>
- Role-gated routes denied with a clear affordance, never a silent 404. <sup>`template:template:app-dashboard/contributes#1`</sup>
- No PII in client-side logs or analytics payloads. <sup>`template:template:app-dashboard/contributes#2`</sup>
- Session timeout and re-auth flow tested end-to-end. <sup>`template:template:app-dashboard/contributes#3`</sup>

## Accessibility baseline

- All interactive elements must be reachable and operable with the keyboard alone. <sup>`inference:inferred:keyboard`</sup>
- Focus must be visible at all times; never remove outlines without replacing them. <sup>`inference:inferred:focus`</sup>
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text). <sup>`inference:inferred:contrast`</sup>
- Every form control has a programmatic label. <sup>`inference:inferred:labels`</sup>
- Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order. <sup>`inference:inferred:landmarks`</sup>
- Respect `prefers-reduced-motion` for any non-essential animation. <sup>`inference:inferred:motion`</sup>
- Modals trap focus and restore focus to the trigger on close. <sup>`template:template:app-dashboard/contributes#0`</sup>
- All interactive tables are keyboard-navigable (ArrowKeys, Home/End, Enter/Space). <sup>`template:template:app-dashboard/contributes#1`</sup>

## Definition of done (starter)

- [ ] Brief's success criteria all verified on a real environment.
- [ ] `tsc --noEmit` passes (if TypeScript).
- [ ] Lint passes with zero warnings on changed files.
- [ ] Tests run in CI and pass.
- [ ] All interactive surfaces tested with keyboard only.
- [ ] Screen reader pass on primary flows.
- [ ] No new dependencies added without explicit rationale.
- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, `project-spine.mdc`) reflect the current spine hash.
