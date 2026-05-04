# Product Hunt launch kit

_Last updated: 2026-05-05._

## Listing copy

**Product name:** Project Spine

**Tagline:** Drift-proof context for coding agents

Tagline length: 39 characters.

**Primary URL:** https://projectspine.dev

**Repository URL:** https://github.com/PetriLahdelma/project-spine

**npm URL:** https://www.npmjs.com/package/project-spine

**Description:**

Project Spine is an open-source context compiler for software projects. It turns a brief, repo, and optional design tokens into AGENTS.md, CLAUDE.md, Copilot instructions, Cursor rules, scaffold plans, QA guardrails, backlog, and CI drift checks. Same inputs, same hash, no account, no telemetry.

**Suggested topics:**

- Developer Tools
- Artificial Intelligence
- Open Source
- Productivity

## First maker comment

Hi Product Hunt - I am Petri, the maker of Project Spine.

Most teams now use more than one coding agent, but the project context those agents load is usually hand-written, duplicated, stale, or generated once by an LLM and never audited again.

Project Spine takes a different route: it compiles a real project brief, repo inspection, optional design rules, and optional design tokens into a deterministic `spine.json`. From that one source it emits the files agents already understand: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`, plus scaffold plans, QA guardrails, a sprint-1 backlog, and a drift manifest you can fail in CI.

The OSS CLI is MIT, local-first, no telemetry, no account required, and no implicit network calls in the compile path.

I would especially value feedback from agencies, devtool builders, and teams already juggling Claude Code, Codex, Cursor, and Copilot:

- What instruction files do you maintain today?
- Where do they drift first?
- What would make this worth adding to CI?

## Gallery assets

Regenerate and verify assets with:

```bash
npm run launch:assets
npm run launch:check
```

Generated files:

| Asset | Size | Purpose |
|---|---:|---|
| `docs/product-hunt/assets/product-hunt-thumbnail.png` | 600 x 600 | Product Hunt thumbnail |
| `docs/product-hunt/assets/gallery-01-hero.png` | 1270 x 760 | Gallery image 1: product promise |
| `docs/product-hunt/assets/gallery-02-compile.png` | 1270 x 760 | Gallery image 2: compile command |
| `docs/product-hunt/assets/gallery-03-drift.png` | 1270 x 760 | Gallery image 3: drift detection |
| `docs/product-hunt/assets/gallery-04-agents.png` | 1270 x 760 | Gallery image 4: portable agent files |
| `docs/product-hunt/assets/social-share.png` | 1200 x 630 | Open Graph / social share master |
| `site/public/og.png` | 1200 x 630 | Live site Open Graph image |

## Launch-day checklist

- Product URL points to `https://projectspine.dev`, not a tracking redirect.
- GitHub README install path uses `npm install -g project-spine@next`.
- `npm view project-spine version dist-tags --json` matches the version shown on the site.
- `npm run typecheck`, `npm test`, `npm run build`, and `npm run pack:check` pass.
- `npm run launch:check` passes.
- `cd site && npm run typecheck && npm run build` passes.
- `/`, `/product`, `/docs`, `/security`, `/pricing`, `/changelog`, and `/product/templates/saas-marketing` return 200 in production mode.
- Product Hunt gallery uploads use PNG files from `docs/product-hunt/assets/`.
- First maker comment is posted within the first few minutes after launch.
