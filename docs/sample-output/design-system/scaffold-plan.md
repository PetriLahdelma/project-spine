# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `045611f6e141e981`, project type `design-system`._

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
- Deliver: Standardize product UI primitives across three web apps. <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: Move all color, spacing, radius, and typography decisions into semantic tokens. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: Publish a stable React package with Storybook docs and migration examples. <sup>`brief:brief.md#section0/item2`</sup>

## Stack notes

- **Framework:** `node-library`
- **Language:** `typescript`
- **Styling:** `unknown`
- **Package manager:** `unknown`
- **Testing:** `vitest`, `testing-library`
