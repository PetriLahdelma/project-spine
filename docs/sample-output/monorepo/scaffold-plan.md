# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `5632a143e1b77025`, project type `monorepo`._

<!-- spine:deterministic -->

## Routes

_(none)_

## Component buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Sprint 1 seed

- Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/project-spine.mdc` after review. <sup>`inference:inferred:setup/agent-files`</sup>
- Pick and configure a linter (Biome or ESLint) with a minimal rule set. <sup>`inference:inferred:setup/lint`</sup>
- Deliver: Consolidate the web app and shared UI package into one workspace. <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: Cut CI time with affected-only builds and cached task outputs. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: Share a typed UI package without allowing apps to become package dependencies. <sup>`brief:brief.md#section0/item2`</sup>

## Stack notes

- **Framework:** `node-app`
- **Language:** `typescript`
- **Styling:** `unknown`
- **Package manager:** `unknown`
- **Testing:** `vitest`

## Warnings worth resolving before build

- **[warn] repo:monorepo-detected** — Detected a pnpm monorepo with 2 workspaces. Framework detection at the root is unreliable; compile against a specific workspace instead.
