# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `ce09cb93352dfefb`, project type `other`._

<!-- spine:deterministic -->

## Routes

_(none)_

## Component buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Sprint 1 seed

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

## Warnings worth resolving before build

- **[warn] repo:framework-uncertain** — Framework detection confidence 0.4. Evidence: no framework dep; looks like a node library
