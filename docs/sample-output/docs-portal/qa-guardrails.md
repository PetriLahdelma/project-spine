# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `cbac2972d9a29995`, project type `docs-portal`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: Quickstart command sequence runs from a clean machine without edits. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: Broken-link count is zero in CI. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: Every generated reference page links back to its source. <sup>`brief:brief.md#section5/item2`</sup>
- Docs build passes on every PR; broken-link check enforced. <sup>`template:template:docs-portal/contributes#0`</sup>
- Search index rebuild runs on each deploy. <sup>`template:template:docs-portal/contributes#1`</sup>
- Every code block is copy-verified (pastes + runs without edit). <sup>`template:template:docs-portal/contributes#2`</sup>
- All generated reference pages link back to source. <sup>`template:template:docs-portal/contributes#3`</sup>

## Accessibility baseline

- All interactive elements must be reachable and operable with the keyboard alone. <sup>`inference:inferred:keyboard`</sup>
- Focus must be visible at all times; never remove outlines without replacing them. <sup>`inference:inferred:focus`</sup>
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text). <sup>`inference:inferred:contrast`</sup>
- Every form control has a programmatic label. <sup>`inference:inferred:labels`</sup>
- Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order. <sup>`inference:inferred:landmarks`</sup>
- Respect `prefers-reduced-motion` for any non-essential animation. <sup>`inference:inferred:motion`</sup>
- Skip-to-content link is the first focusable element. <sup>`template:template:docs-portal/contributes#0`</sup>
- Code block copy buttons have an aria-label and visible focus state. <sup>`template:template:docs-portal/contributes#1`</sup>

## Definition of done (starter)

- [ ] Brief's success criteria all verified on a real environment.
- [ ] `tsc --noEmit` passes (if TypeScript).
- [ ] Lint passes with zero warnings on changed files.
- [ ] Tests run in CI and pass.
- [ ] All interactive surfaces tested with keyboard only.
- [ ] Screen reader pass on primary flows.
- [ ] No new dependencies added without explicit rationale.
- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, `project-spine.mdc`) reflect the current spine hash.
