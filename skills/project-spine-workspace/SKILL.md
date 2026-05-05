---
name: project-spine-workspace
description: Use when the user asks about Project Spine hosted workspaces, team sync, shared workspace templates, invites, or commands such as `spine login`, `spine workspace`, `spine publish`, or `spine drift check --push`.
---

# Hosted workspace guardrail

**Goal:** prevent agents from inventing or invoking hosted workspace flows that are not routed in the public OSS CLI.

## Current status

The public Project Spine CLI is OSS-first and local-first. Its routed commands are:

```bash
spine init
spine compile
spine inspect
spine export
spine template list|show|save
spine explain
spine drift check|diff
spine tokens pull
spine doctor
```

Hosted workspace commands are dormant in source but intentionally not exposed from `spine --help`. Do not instruct users to run:

- `spine login`
- `spine logout`
- `spine whoami`
- `spine workspace ...`
- `spine publish ...`
- `spine rationale ...`
- `spine drift check --push`
- `spine template pull`
- `spine template list --workspace`

## What to recommend instead

For team sharing today:

- Commit project-local templates under `./.project-spine-templates/<name>/`.
- Save personal reusable templates with `spine template save --location user`.
- Share generated `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`, and `.project-spine/exports/*` through normal version control.
- Use `spine drift check --fail-on any` in CI without `--push`.

For client-facing summaries:

- Review `.project-spine/exports/rationale.md` locally.
- Share it through the user's existing docs, email, or client portal workflow.

## If the user insists on hosted workspaces

Be explicit:

> Hosted workspace code exists in the repository, but it is not part of the public CLI surface right now. The OSS launch is intentionally local-first. Use project-local templates and CI drift checks until a hosted workspace release is intentionally routed and documented.

Then continue with the local workflow that gets them closest to their goal.
