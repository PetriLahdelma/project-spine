# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `045611f6e141e981`, project type `design-system`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: Button, Input, Field, Dialog, Tooltip, and Toast ship with docs and tests. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: Axe checks pass for every primitive story. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: First downstream app replaces 80% of raw form controls with primitives. <sup>`brief:brief.md#section5/item2`</sup>
- Every primitive has at least one Storybook story covering default, hover, focus, disabled, and loading where applicable. <sup>`template:template:design-system/contributes#0`</sup>
- Visual regression (Chromatic / Playwright snapshots) runs on every PR. <sup>`template:template:design-system/contributes#1`</sup>
- Axe accessibility check passes per primitive at default and interactive states. <sup>`template:template:design-system/contributes#2`</sup>
- Bundle-size budget enforced per primitive; new primitives require a budget entry. <sup>`template:template:design-system/contributes#3`</sup>

## Accessibility baseline

- All interactive elements must be reachable and operable with the keyboard alone. <sup>`inference:inferred:keyboard`</sup>
- Focus must be visible at all times; never remove outlines without replacing them. <sup>`inference:inferred:focus`</sup>
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text). <sup>`inference:inferred:contrast`</sup>
- Every form control has a programmatic label. <sup>`inference:inferred:labels`</sup>
- Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order. <sup>`inference:inferred:landmarks`</sup>
- Respect `prefers-reduced-motion` for any non-essential animation. <sup>`inference:inferred:motion`</sup>
- Every interactive primitive exposes a focus ring by default; removal requires an explicit prop. <sup>`template:template:design-system/contributes#0`</sup>
- Labels, descriptions, and error states are composable via documented slot props. <sup>`template:template:design-system/contributes#1`</sup>

## Definition of done (starter)

- [ ] Brief's success criteria all verified on a real environment.
- [ ] `tsc --noEmit` passes (if TypeScript).
- [ ] Lint passes with zero warnings on changed files.
- [ ] Tests run in CI and pass.
- [ ] All interactive surfaces tested with keyboard only.
- [ ] Screen reader pass on primary flows.
- [ ] No new dependencies added without explicit rationale.
- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, `project-spine.mdc`) reflect the current spine hash.
