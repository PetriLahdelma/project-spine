# Atlas Workspace — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `5632a143e1b77025`, project type `monorepo`._

<!-- spine:deterministic -->

## What we are building

- Consolidate the web app and shared UI package into one workspace.
- Cut CI time with affected-only builds and cached task outputs.
- Share a typed UI package without allowing apps to become package dependencies.

## Who we are building it for

- Product engineers working in apps/web daily.
- Platform maintainers who own packages/ui and build tooling.
- Release managers who need predictable package versioning.

## Constraints we accepted

- pnpm workspaces with Turborepo task orchestration.
- Node 20 baseline across every package.
- One lockfile, one root tsconfig, one root CI workflow.

## Assumptions we are making

- Packages can build in isolation once dependencies are declared correctly.
- Remote cache access is available in CI but not required locally.

## Risks we are watching

- Cross-package relative imports could bypass the declared graph.
- Circular dependencies may appear during migration.

## The stack we are using

Framework: **node-app**. Language: **typescript** (strict). Testing: **vitest**.

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.

## Open questions

- Detected a pnpm monorepo with 2 workspaces. Framework detection at the root is unreliable; compile against a specific workspace instead.
