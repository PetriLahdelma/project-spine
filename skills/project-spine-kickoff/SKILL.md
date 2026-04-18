---
name: project-spine-kickoff
description: Use when the user wants to set up Project Spine for a new project — phrases like "new client project", "kickoff", "create AGENTS.md from scratch", "generate agent instructions for this repo", "set up project context". Runs `spine init` → edits brief → `spine compile` → reviews outputs. For team workspaces use project-spine-workspace instead; for stale files use project-spine-drift.
---

# Kickoff flow for a new project

**Goal:** produce the 18 canonical Project Spine files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, plus scaffold/QA/rationale docs) from a real brief + the current repo.

## Prerequisites — check before proceeding

1. CLI installed: `spine --version` returns `0.8.1-alpha.0` or later
2. Current directory is the project root (has `package.json` or equivalent)
3. No `.project-spine/` directory yet (if there is, this is probably a **drift** scenario — switch to project-spine-drift)

## Step 1 — pick a template (optional but strongly recommended)

List available starter templates:

```bash
spine template list
```

Bundled templates cover these project types:

- `saas-marketing` — marketing site (hero, pricing, customer pages, compliance)
- `app-dashboard` — authenticated product with data tables, settings, role gating
- `design-system` — component library, tokens, Storybook
- `docs-portal` — technical documentation site

If the user mentions one of these project types, pick the matching template. If they describe something unusual (extension, CLI tool, data pipeline), skip the template and compile without it — the brief carries the intent.

## Step 2 — scaffold

```bash
spine init --template <template-name>
# or, without a template:
spine init
```

This creates:

- `brief.md` at the repo root, with prompts for each section (Goals, Audience, Constraints, Assumptions, Risks, Success criteria)
- `.project-spine/` directory for outputs

## Step 3 — ask the user for brief content

**Do not fill the brief yourself from general knowledge.** Ask the user directly:

> I scaffolded a brief at `brief.md`. To generate useful agent instructions I need your help filling a few sections. Could you tell me:
>
> 1. What are the 3–5 core **goals** for this project? (measurable, not aspirational)
> 2. Who is the **audience**? (role, scale, prior tools)
> 3. Any hard **constraints**? (stack, compliance, budget)
> 4. What's **out of scope** that you want agents to not touch?
>
> I'll fill the rest from the repo analysis.

Edit `brief.md` with their answers. Preserve the YAML frontmatter including `projectType`.

## Step 4 — compile

```bash
spine compile --brief ./brief.md --repo . --template <template-name>
```

(Omit `--template` if you skipped Step 1.)

## Step 5 — read the output summary

The compile prints a summary. The three things that matter:

- `hash: ...` — content-addressable signature of the inputs. Useful later for drift.
- `project type: ...` — should match what the user said.
- `warnings: N (E error, W warn, I info)` — always surface these to the user.

If there are warnings, show them and offer to resolve. Call `spine explain <warning-id>` to get the fix for each.

## Step 6 — review key outputs with the user

Show these files to the user and summarise (don't dump):

- **`AGENTS.md`** at the repo root — "this is what other coding agents will see. Key rules it derived from your brief + repo: [3–5 bullets]"
- **`.project-spine/exports/scaffold-plan.md`** — "here's the proposed route/component plan for sprint 1"
- **`.project-spine/exports/sprint-1-backlog.md`** — "starter backlog items with acceptance criteria traced back to your goals"

Ask: **"Does this match what you had in mind? Anything worth editing in `brief.md` and recompiling?"**

## Common follow-ups

- **"The stack is wrong"** → `spine inspect --repo .` to see what was detected; edit repo state (add framework dep) or pass explicit `--template`, then recompile.
- **"I want to commit these files"** → The repo-root `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` are the canonical tool-discovery locations. Commit them. Gitignore `.project-spine/` internals if desired.
- **"How do I share this with my team?"** → Switch to project-spine-workspace skill.
- **"How do I send a client-facing version?"** → Switch to project-spine-rationale skill.

## What NOT to do

- Do NOT edit the generated `AGENTS.md` / `CLAUDE.md` by hand. Edit `brief.md` and recompile. Hand-edits trigger drift warnings and defeat the source-of-truth model.
- Do NOT compile without a brief that actually describes the project. Generic briefs produce generic AGENTS.md which is exactly what Project Spine exists to prevent.
- Do NOT run `spine compile` twice without a reason. It's idempotent, but needless recompiles churn the timestamps in the export manifest.
