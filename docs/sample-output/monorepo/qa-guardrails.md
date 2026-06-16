# QA guardrails

> What 'done' means for this project. Every item here is actionable.

_Generated from `spine.json` — hash `5632a143e1b77025`, project type `monorepo`._

<!-- spine:deterministic -->

## Project-level checks

- Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic. <sup>`inference:inferred:vitest`</sup>
- `tsc --noEmit` must pass on every PR. <sup>`inference:inferred:typecheck`</sup>
- Success criterion to verify before launch: Every workspace builds and tests in isolation. <sup>`brief:brief.md#section5/item0`</sup>
- Success criterion to verify before launch: A no-op PR finishes affected-only CI in under 60 seconds. <sup>`brief:brief.md#section5/item1`</sup>
- Success criterion to verify before launch: Release flow uses changesets; no manual package version bumps. <sup>`brief:brief.md#section5/item2`</sup>
- Every package compiles in isolation: `cd packages/<name> && npm run build` succeeds without repo-root tooling on PATH. <sup>`template:template:monorepo/contributes#0`</sup>
- Cross-package imports go through the package name, not a relative ../../../../ path. <sup>`template:template:monorepo/contributes#1`</sup>
- CI uses affected-only runs and caches build artefacts. A no-op PR finishes in under 60s. <sup>`template:template:monorepo/contributes#2`</sup>
- Every publishable package has a CHANGELOG.md updated via changesets or equivalent — never hand-edited in the release commit. <sup>`template:template:monorepo/contributes#3`</sup>
- Version bumps flow through a single tool (changesets / lerna / nx release) — no manual `npm version` in a package. <sup>`template:template:monorepo/contributes#4`</sup>
- Lockfile is a single source of truth (pnpm-lock.yaml or package-lock.json). No per-package lockfiles. <sup>`template:template:monorepo/contributes#5`</sup>

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
- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, `project-spine.mdc`) reflect the current spine hash.

## Open warnings

- **[warn] repo:monorepo-detected** — Detected a pnpm monorepo with 2 workspaces. Framework detection at the root is unreliable; compile against a specific workspace instead.
