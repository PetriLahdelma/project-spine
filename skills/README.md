# Project Spine — agent skills

Drop-in skills that teach coding agents (Claude Code, Cursor, Codex CLI, any MCP-aware runtime) how to operate the `project-spine` CLI correctly.

**Without these**, an agent asked to "set up Project Spine for this repo" will guess at the commands and get half of them wrong on the first try. **With them**, the agent recognises the right moment to reach for each flow, invokes the canonical command, and interprets the output.

## Install

### Claude Code (user-wide)

```bash
mkdir -p ~/.claude/skills
for dir in skills/*/; do
  [ -f "$dir/SKILL.md" ] && ln -sf "$(pwd)/$dir" ~/.claude/skills/
done
```

Or for a single project, scope it to `.claude/skills/` at your repo root. Claude Code auto-discovers skills in both locations.

### Codex CLI

Codex reads skills from `~/.codex/skills/`. Same layout:

```bash
mkdir -p ~/.codex/skills
for dir in skills/*/; do
  [ -f "$dir/SKILL.md" ] && ln -sf "$(pwd)/$dir" ~/.codex/skills/
done
```

### Cursor

Cursor doesn't have native skills, but each `SKILL.md` works as a `.cursor/rules/*.mdc` — copy the body into your project's rules directory.

### Manual

Each skill is a single self-contained `SKILL.md` with frontmatter. Paste the relevant one into whatever rule/instruction system your agent uses.

## What ships

| Skill | Triggers on | What it teaches |
|---|---|---|
| [`project-spine`](./project-spine/SKILL.md) | "AGENTS.md", "CLAUDE.md", "context for coding agents", "project brief", "agency kickoff" | Orientation: what the product is, when to reach for it, conceptual model (brief + repo + design → spine.json → exports) |
| [`project-spine-kickoff`](./project-spine-kickoff/SKILL.md) | "new client project", "start a project", "set up AGENTS.md from scratch" | init → edit brief → compile → review the 18 files |
| [`project-spine-drift`](./project-spine-drift/SKILL.md) | "drift", "stale AGENTS.md", "agent instructions out of date", "CI drift check" | drift check semantics, `--push` for CI, how to resolve each drift type |
| [`project-spine-template`](./project-spine-template/SKILL.md) | "use our agency template", "pull team starter", "apply workspace template" | login → workspace switch → template pull → init from template |
| [`project-spine-rationale`](./project-spine-rationale/SKILL.md) | "share project rationale with client", "publish a branded project summary", "send client overview" | compile → publish rationale → revoke when engagement ends |
| [`project-spine-workspace`](./project-spine-workspace/SKILL.md) | "join workspace", "share templates with teammates", "invite teammate" | workspace create + invite + members flow |

## Design principles these skills follow

1. **Deterministic paths only.** Skills tell the agent to run the exact command and check the exact output. No "try a few things".
2. **Surface the offline-safe defaults.** Skills never assume the hosted features (workspaces, rationale publish) are configured — they teach the agent to detect state and adapt.
3. **Cite source pointers.** Every generated rule in `spine.json` carries a traceable origin. The skills teach the agent to reference those pointers when reviewing output with the user.
4. **Small and composable.** Each skill covers one coherent flow. Agents chain them naturally.

## Compatibility

- CLI version: **`project-spine@0.8.1-alpha.0`** or later (compile, drift, workspace, template, rationale, publish are all referenced).
- Runtime: Node ≥ 20.
- Hosted features (workspace, rationale, drift push) require `spine login` first; the skills detect this and instruct the agent accordingly.

## Contributing

Skills are Markdown files with YAML frontmatter. The canonical format:

```markdown
---
name: my-skill-name
description: Short description of when to reach for this skill. This is the trigger — agents match user intent against it.
---

# Skill body

Step-by-step instructions, expected outputs, failure modes.
```

Keep `description` short and **specific** — it's what the agent matches against. Generic descriptions ("helps with Project Spine") won't trigger correctly.

PRs welcome at [github.com/PetriLahdelma/project-spine](https://github.com/PetriLahdelma/project-spine).
