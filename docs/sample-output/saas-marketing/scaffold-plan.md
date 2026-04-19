# Scaffold plan

> Concrete setup decisions derived from the brief, the repo profile, and any design-system input.

_Generated from `spine.json` — hash `8976dc15b57e7f67`, project type `saas-marketing`._

<!-- spine:deterministic -->

## Routes

- / — Home: hero, social proof, primary CTA above the fold.
- /product — Core product overview and key features.
- /pricing — Plans, tiers, FAQ.
- /customers — Customer stories / case studies.
- /security — Security posture and compliance certifications.
- /legal/privacy — Privacy policy.
- /legal/terms — Terms of service.

## Component buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Sprint 1 seed

- Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` after review. <sup>`inference:inferred:setup/agent-files`</sup>
- Pick and configure a linter (Biome or ESLint) with a minimal rule set. <sup>`inference:inferred:setup/lint`</sup>
- Set up a test runner (Vitest recommended) and land a smoke test. <sup>`inference:inferred:setup/tests`</sup>
- Add a minimal CI workflow that runs typecheck + lint + tests on every PR. <sup>`inference:inferred:setup/ci`</sup>
- Deliver: Launch a marketing site for Acme Payroll's new SMB product line within 6 weeks. <sup>`brief:brief.md#section0/item0`</sup>
- Deliver: Generate qualified trial signups from SMB founders in the US and UK. <sup>`brief:brief.md#section0/item1`</sup>
- Deliver: Replace the legacy WordPress site with a repo-native, versionable build. <sup>`brief:brief.md#section0/item2`</sup>
- Deliver: Pass Lighthouse a11y ≥95 on all key pages. <sup>`brief:brief.md#section0/item3`</sup>

## Stack notes

- **Framework:** `next`
- **Language:** `typescript`
- **Styling:** `tailwind`
- **Package manager:** `unknown`
- **Testing:** _none_

## Warnings worth resolving before build

- **[info] repo:no-agent-files** — No agent instruction files found.
