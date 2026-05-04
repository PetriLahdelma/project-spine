---
name: project-spine-template
description: Use when the user wants to apply a bundled, user-local, or project-local template to a new project, or save the current project as a reusable template. Phrases like "use our agency starter", "save this as a template for future clients", "apply the shared saas-marketing starter".
---

# Template save / apply flow

**Goal:** reuse a team's agreed-upon project structure (brief scaffold + design rules + compile-time contributions) across client projects.

## Template sources, priority order

Project Spine resolves templates from these roots (highest priority first):

1. **Project-local** — `./.project-spine-templates/<name>/` committed to the current repo.
2. **User-local** — `~/.project-spine/templates/<name>/` on this machine.
3. **Bundled** — `saas-marketing`, `app-dashboard`, `design-system`, `docs-portal`, `api-service`, and `monorepo` ship with the CLI.

Same name in a higher tier overrides lower tiers.

## Flow A — apply an existing template to a new project

```bash
spine template list
```

Shows all templates reachable from this shell. The `[source]` column tells the user where each one comes from.

```bash
spine init --template <name>
```

Scaffolds `brief.md` from the template's starter content. Then follow project-spine-kickoff from Step 3.

## Flow B — save the current project as a template

Prerequisite: the user already has a `brief.md` and ran `spine compile` at least once. The compiled `.project-spine/spine.json` is used to derive the template's `contributes` block automatically.

```bash
spine template save \
  --name my-agency-saas \
  --title "My agency SaaS starter" \
  --description "Our marketing site template (Acme Inc.)" \
  --location user
```

`--location` options:

- `user` (default) — saves to `~/.project-spine/templates/<name>/`; follows you across projects on this machine.
- `project` — saves to `./.project-spine-templates/<name>/`; commits to the repo, shared via VCS.

## When to recommend saving as project-local vs user-local

Save **project-local** if:

- The template represents a shared agency convention
- Multiple teammates will use it across client projects
- The brief scaffold / design rules include decisions the team has consensus on

Save **user-local** if:

- It's a personal preference (your favorite starter)
- You're experimenting with a template before committing the team to it
- The team hasn't set up a workspace yet

## What NOT to do

- Don't save a template from an uncompiled project. The `contributes` block derives from `spine.json`; without it the template is just a brief scaffold with empty rules.
- Don't name templates generically (`my-template`, `template1`). `spine template save` requires lowercase-kebab names; pick something meaningful (`my-agency-saas`, `client-admin-dashboard`).

## Follow-up conversations

If they ask for hosted workspace sync, switch to project-spine-workspace so the agent explains that workspace commands are dormant in the public OSS CLI.
If they want to share the template's output (rationale) with a client → switch to project-spine-rationale for local review.
