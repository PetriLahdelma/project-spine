# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `6314a0c307118ea7`, project type `app-dashboard`._

<!-- spine:deterministic -->

## Routes

- /login — Auth entry; supports SSO and email/password paths as configured.
- /app — Default authenticated surface, role-aware landing.
- /app/settings — User/workspace settings.
- /app/team — Members, roles, invites.
- /app/billing — Subscription and invoices (admin-only).

## Component buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Sprint 1 seed

- Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/project-spine.mdc` after review. <sup>`inference:inferred:setup/agent-files`</sup>
- Pick and configure a linter (Biome or ESLint) with a minimal rule set. <sup>`inference:inferred:setup/lint`</sup>
- Deliver: Ship a role-aware operations dashboard for support leads within 8 weeks. <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: Reduce manual queue triage by surfacing priority accounts and stale cases. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: Give managers exportable weekly metrics without ad-hoc SQL requests. <sup>`brief:brief.md#section0/item2`</sup>

## Stack notes

- **Framework:** `next`
- **Language:** `typescript`
- **Styling:** `tailwind`
- **Package manager:** `unknown`
- **Testing:** `vitest`
