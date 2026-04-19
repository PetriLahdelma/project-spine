# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `b5db78b43a41f5e7`, project type `other`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: spine --help lists exactly the routed OSS commands — no hosted-tier leakage. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: Determinism test: recompiling with identical inputs yields a byte-identical spine.json and identical export hashes. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: Drift check exits non-zero when any input file's sha256 changes; spine drift diff prints the unified patch for every hand-edited export. <sup>`brief:brief.md#section5/item2`</sup>
- Success criterion to verify before launch: First run (fresh clone) under 30 seconds from npm install → spine init → spine compile with a usable brief and the saas-marketing template. <sup>`brief:brief.md#section5/item3`</sup>
- Success criterion to verify before launch: Every rule in spine.json carries a non-empty source.pointer back to brief / repo / design / template / inference. <sup>`brief:brief.md#section5/item4`</sup>

## Accessibility baseline

- All interactive elements must be reachable and operable with the keyboard alone. <sup>`inference:inferred:keyboard`</sup>
- Focus must be visible at all times; never remove outlines without replacing them. <sup>`inference:inferred:focus`</sup>
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text). <sup>`inference:inferred:contrast`</sup>
- Every form control has a programmatic label. <sup>`inference:inferred:labels`</sup>
- Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order. <sup>`inference:inferred:landmarks`</sup>
- Respect `prefers-reduced-motion` for any non-essential animation. <sup>`inference:inferred:motion`</sup>

## Definition of done (starter)

- [ ] Brief's success criteria all verified on a real environment.
- [ ] `tsc --noEmit` passes (if TypeScript).
- [ ] Lint passes with zero warnings on changed files.
- [ ] Tests run in CI and pass.
- [ ] All interactive surfaces tested with keyboard only.
- [ ] Screen reader pass on primary flows.
- [ ] No new dependencies added without explicit rationale.
- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`) reflect the current spine hash.

## Open warnings

- **[warn] repo:framework-uncertain** — Framework detection confidence 0.4. Evidence: no framework dep; looks like a node library
- **[info] repo:no-agent-files** — No agent instruction files found.
