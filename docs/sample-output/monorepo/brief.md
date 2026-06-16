---
name: "Atlas Workspace"
projectType: "monorepo"
---

# Project brief

## Goals
- Consolidate the web app and shared UI package into one workspace.
- Cut CI time with affected-only builds and cached task outputs.
- Share a typed UI package without allowing apps to become package dependencies.

## Audience
- Product engineers working in apps/web daily.
- Platform maintainers who own packages/ui and build tooling.
- Release managers who need predictable package versioning.

## Constraints
- pnpm workspaces with Turborepo task orchestration.
- Node 20 baseline across every package.
- One lockfile, one root tsconfig, one root CI workflow.

## Assumptions
- Packages can build in isolation once dependencies are declared correctly.
- Remote cache access is available in CI but not required locally.

## Risks
- Cross-package relative imports could bypass the declared graph.
- Circular dependencies may appear during migration.

## Success criteria
- Every workspace builds and tests in isolation.
- A no-op PR finishes affected-only CI in under 60 seconds.
- Release flow uses changesets; no manual package version bumps.
