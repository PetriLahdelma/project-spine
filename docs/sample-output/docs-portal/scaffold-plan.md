# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `cbac2972d9a29995`, project type `docs-portal`._

<!-- spine:deterministic -->

## Routes

- / — Landing with quickstart CTA and top guides.
- /quickstart — Minimum viable setup in under 5 minutes.
- /guides — Topic index; each guide is task-oriented.
- /reference — Generated API reference.
- /changelog — Release notes, newest first.

## Component buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Sprint 1 seed

- Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/project-spine.mdc` after review. <sup>`inference:inferred:setup/agent-files`</sup>
- Pick and configure a linter (Biome or ESLint) with a minimal rule set. <sup>`inference:inferred:setup/lint`</sup>
- Deliver: Launch a technical docs portal that gets new users to hello world in under 5 minutes. <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: Keep guides, reference pages, and changelog entries versioned with the repo. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: Make stale docs fail CI through broken-link and copyable-code checks. <sup>`brief:brief.md#section0/item2`</sup>

## Stack notes

- **Framework:** `next`
- **Language:** `typescript`
- **Styling:** `tailwind`
- **Package manager:** `unknown`
- **Testing:** `vitest`
