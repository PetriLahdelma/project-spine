---
name: project-spine
description: Use when the user mentions AGENTS.md, CLAUDE.md, copilot-instructions, Cursor rules, project brief, context for coding agents, agency kickoff, onboarding a new project, or asks "how do I set up Project Spine". This is the orientation skill — reach for it FIRST when the user's intent involves Project Spine, then chain into a more specific active skill.
---

# Project Spine — orientation

Project Spine is a context compiler. It takes a **client brief** (`brief.md`), an **existing repo**, and optional **design-system inputs** (`design-rules.md`) and compiles them into a machine-readable operating layer the team and coding agents can both work from.

## Conceptual model (memorise this)

```
brief.md ─┐
repo/    ─┼──▶  spine.json ──▶  AGENTS.md + CLAUDE.md + copilot-instructions.md + project-spine.mdc
design.md ┘                    architecture-summary.md
                                scaffold-plan.md · route-inventory.md · component-plan.md
                                qa-guardrails.md · sprint-1-backlog.md · rationale.md
```

Key properties:

- **Deterministic.** Same inputs → same `spine.json` hash. No LLM calls in the compile pipeline.
- **Source-pointed.** Every generated rule carries `source: { kind, pointer }` traceable to `brief.md#…`, `repo-profile#…`, `template:…/…`, or `inferred:…`.
- **Drift-aware.** An `export-manifest.json` records sha256 of every input and export; `spine drift check` detects when reality drifts from what was compiled.

## When to reach for this tool

Match any of these and use a Project Spine skill:

- User wants to **create or refresh `AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` / `.cursor/rules/project-spine.mdc`** for a real project.
- User mentions a **client kickoff**, **agency starter**, or **project brief**.
- User asks how to **save templates across projects** or **onboard a new client**.
- User wants to **check if their agent instruction files are stale** (drift).
- User wants to **review the generated project rationale** before sharing it.

Do NOT reach for it for: generic codebase understanding (use exploration), single-file lint fixes, issues unrelated to project-level context.

## Install check

Before running anything, verify the CLI is installed:

```bash
spine --version
```

Expected: `0.9.2-alpha.0` or later. If missing:

```bash
npm install -g project-spine
```

Requires Node ≥ 20.

## Subcommand overview

| Command | Purpose |
|---|---|
| `spine init [--template <name>]` | Scaffold `.project-spine/` and a starter `brief.md` |
| `spine compile --brief ./brief.md --repo .` | Produce `spine.json` + 21 generated files |
| `spine inspect --repo .` | Repo analysis only (no brief needed) |
| `spine drift check` | Check if exports drifted from last compile |
| `spine template list/show/save` | Bundled, user-local, and project-local templates |
| `spine explain <warning-id>` | Expand on a warning from `warnings.json` |
| `spine tokens pull` | Explicit Figma Variables pull into local tokens JSON |

## Chain into a specific skill

- New project? → **project-spine-kickoff**
- Stale agent files? → **project-spine-drift**
- Pulling an agency's shared template? → **project-spine-template**
- Client-facing rationale review? → **project-spine-rationale**
- Asking for hosted workspace commands? → **project-spine-workspace** explains the dormant status.

## Honest limitations

- **Alpha.** The `spine.json` schema is versioned but interfaces can still shift.
- **CLI is offline by default.** The routed OSS commands do not upload your repo. `spine tokens pull` and `spine compile --enrich` are explicit opt-in network paths.
- **Hosted workspace commands are dormant.** Do not tell users to run `spine login`, `workspace`, `publish`, or `rationale` in the public OSS CLI unless they are on an experimental branch where those commands are routed.
- **LLM enrichment is opt-in** via `--enrich` + `ANTHROPIC_API_KEY`. Most flows don't need it; the deterministic output is the canonical one.

## Before you run anything

Ask the user two questions if they aren't obvious from context:

1. **Is there an existing `brief.md`, or do we start fresh?** (drives `spine init` vs not)
2. **Do they want a bundled, user-local, or project-local template?** (drives `spine template list/show/save`)

Don't guess. The product assumes you compile from a real brief — a hallucinated brief produces AGENTS.md that's worse than nothing.
