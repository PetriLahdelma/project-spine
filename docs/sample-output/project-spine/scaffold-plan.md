# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `ae5e8a737294995d`, project type `other`._

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
- Deliver: Ship a deterministic context compiler that turns a client brief + a repo + optional design inputs into a repo-native operating layer for coding agents (AGENTS.md / CLAUDE.md / copilot-instructions.md plus a full scaffold plan). <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: Stay useful without AI in the loop. Every artefact must be worth keeping even if a human reviews it by hand. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: Keep the OSS CLI the whole pitch: MIT, no telemetry, no account required, no upsell in the code path. <sup>`brief:brief.md#section0/item2`</sup>
- Deliver: Drift-aware by default. spine drift check + spine drift diff must be CI-reliable so teams can enforce that exports stay aligned with inputs. <sup>`brief:brief.md#section0/item3`</sup>

## Stack notes

- **Framework:** `node-library`
- **Language:** `typescript`
- **Styling:** `unknown`
- **Package manager:** `npm`
- **Testing:** `vitest`
