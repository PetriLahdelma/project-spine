---
name: ""
projectType: "monorepo"
---

# Project brief

## Goals
- <!-- e.g. Consolidate 4 repos into one monorepo without disrupting release cadence -->
- <!-- e.g. Cut CI time in half with affected-only builds -->
- <!-- e.g. Share a typed API client between web and mobile without duplicate schemas -->

## Audience
- <!-- Who works across which packages day to day -->
- <!-- External consumers (public npm packages?) vs internal-only -->

## Constraints
- <!-- Tooling: pnpm workspaces / Turborepo / Nx / Rush / Bazel — and why that choice -->
- <!-- Node / runtime version baseline applied across packages -->
- <!-- Existing CI provider (GitHub Actions / Buildkite / CircleCI) and any runtime cost budget -->

## Assumptions
- <!-- Repos being merged share enough convention to coexist (tsconfig, lint, test framework) -->
- <!-- CI has a reliable cache store (S3 / remote cache / workflow cache) -->

## Risks
- <!-- Build-cache cold starts blocking devs on fresh clones -->
- <!-- Circular dependencies discovered mid-migration -->
- <!-- Team conventions differ enough that codegen breaks one package's style but not another -->

## Success criteria
- <!-- Every package builds + tests in isolation -->
- <!-- Affected-only CI completes a no-op PR in under 60s -->
- <!-- Release flow is scripted (changesets or equivalent) — no manual version bumps -->
- <!-- One lockfile, one root tsconfig, one root lint config -->
