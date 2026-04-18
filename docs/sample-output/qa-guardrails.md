# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `3333f867f40d3e43`, project type `saas-marketing`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: Homepage, 3 product pages, pricing, /compliance, /security, 2 case studies live. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: 99th-percentile page weight <250KB on mobile. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: All interactive elements keyboard-operable and screen-reader labeled. <sup>`brief:brief.md#section5/item2`</sup>
- Success criterion to verify before launch: 40+ qualified trial signups in the first month. <sup>`brief:brief.md#section5/item3`</sup>
- LCP under 2.0s on mobile (p75), CLS under 0.1, INP under 200ms. <sup>`template:template:saas-marketing/contributes#0`</sup>
- Total transferred page weight under 250KB on /, /product, /pricing at mobile viewport. <sup>`template:template:saas-marketing/contributes#1`</sup>
- Every CTA path tested from keyboard; no click-only interactions. <sup>`template:template:saas-marketing/contributes#2`</sup>
- Forms validate inline and expose errors to screen readers via aria-live. <sup>`template:template:saas-marketing/contributes#3`</sup>

## Accessibility baseline

- All interactive elements must be reachable and operable with the keyboard alone. <sup>`inference:inferred:keyboard`</sup>
- Focus must be visible at all times; never remove outlines without replacing them. <sup>`inference:inferred:focus`</sup>
- Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text). <sup>`inference:inferred:contrast`</sup>
- Every form control has a programmatic label. <sup>`inference:inferred:labels`</sup>
- Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order. <sup>`inference:inferred:landmarks`</sup>
- Respect `prefers-reduced-motion` for any non-essential animation. <sup>`inference:inferred:motion`</sup>
- Images decorative vs informative is explicit; informative images have real alt text. <sup>`template:template:saas-marketing/contributes#0`</sup>
- Hero headline uses a single h1; no competing h1s on the page. <sup>`template:template:saas-marketing/contributes#1`</sup>

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
- **[info] repo:no-agent-files** — No agent instruction files found. Spine will generate them on `spine compile`.
