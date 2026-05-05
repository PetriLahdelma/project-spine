# Placements — registries and awesome-lists

Prepared submission content for ecosystem visibility. Fire these **after** the MCP server has shipped to npm in a public release — each submission links to `spine-mcp` as a first-class capability.

All submissions can be filed by Petri in under 30 minutes total.

## Order of operations

1. Release `project-spine` on npm with `spine-mcp` bin included. Verify `npm install -g project-spine@beta` drops both binaries on PATH.
2. Open the six PRs below (or fewer, depending on which lists are alive).
3. Reply to any reviewer comments within a day. Single-maintainer lists often want a line about what the server actually does.

## 1. MCP servers registry

**Repo:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) — the official registry.

**What to do:** Open a PR adding Project Spine to the "Community Servers" section of the README.

**Entry to paste (alphabetically placed among siblings):**

```markdown
- **[Project Spine](https://github.com/PetriLahdelma/project-spine)** – Compile a client brief, repo, and design tokens into repo-native agent instructions (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, Cursor rules) with drift detection. MCP server exposes `spine_compile`, `spine_doctor`, `spine_drift_check`, `spine_drift_diff`, `spine_init`, and `spine_tokens_pull`.
```

**PR title:** `docs: add Project Spine to community servers`

**PR body:**

> Adding Project Spine — OSS CLI that compiles a brief, repo, and design tokens into `AGENTS.md` / `CLAUDE.md` / `copilot-instructions.md` with drift detection. The `spine-mcp` server exposes the compile, drift-check, drift-diff, init, and tokens-pull flows as tools. MIT, stdio transport, no hosted dependency.
>
> Source: https://github.com/PetriLahdelma/project-spine
> Docs: https://projectspine.dev
> MCP setup: https://github.com/PetriLahdelma/project-spine/blob/main/docs/mcp.md

## 2. awesome-mcp-servers

**Repo:** [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

**Section:** Developer Tools.

**Entry:**

```markdown
- [PetriLahdelma/project-spine](https://github.com/PetriLahdelma/project-spine) 🎖️📇 🏠 – Compile a client brief, repo, and design tokens into `AGENTS.md` / `CLAUDE.md` / `copilot-instructions.md` with drift detection. Exposes compile, drift-check, drift-diff, init, and Figma-tokens-pull as MCP tools.
```

(Emojis match the list's legend: 🎖️ official/first-party-adjacent, 📇 TypeScript, 🏠 local server.)

## 3. awesome-claude-code

**Repo:** [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) (the most active list as of 2026-04).

**Section:** "CLIs & Tools" or "MCP Servers" (check list ordering at time of submission).

**Entry:**

```markdown
- [Project Spine](https://github.com/PetriLahdelma/project-spine) — Compile a brief + repo + design tokens into `AGENTS.md` / `CLAUDE.md`. Deterministic, drift-checkable, MCP-callable from Claude Code.
```

## 4. awesome-cursorrules / awesome-cursor

**Repo:** [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) — if the list has an "MCP servers" or "tools" section, submit there. If not, skip this one; the list is `.cursorrules` files, and Spine doesn't fit that shape.

Alternative: [pontusab/cursor.directory](https://github.com/pontusab/cursor.directory) — content-managed, has an MCP servers category.

**Entry (same as Claude list, adjust the pitch if needed):**

```markdown
- [Project Spine](https://github.com/PetriLahdelma/project-spine) — Compile briefs and repos into Cursor-ready `AGENTS.md` / `copilot-instructions.md` with drift detection. MCP server exposes the full CLI.
```

## 5. Copilot ecosystem listings

**Repo:** [github/awesome-copilot](https://github.com/github/awesome-copilot) — GitHub's own curated list (check it's still alive; historically flaky).

**Entry:**

```markdown
- [Project Spine](https://github.com/PetriLahdelma/project-spine) — Generates `.github/copilot-instructions.md` as part of a compiled repo-native operating layer. Drift detection + Figma tokens import. MIT.
```

Often faster to skip this one and lean on the awesome-mcp-servers placement; Copilot users discover MCP tools via generic lists more than Copilot-specific ones.

## 6. awesome-devtools

**Repo:** [stackrole/awesome-developer-tools](https://github.com/stackrole/awesome-developer-tools) or [Awesome Lists index](https://github.com/sindresorhus/awesome) — broad, small per-submission payoff but cumulatively useful.

**Skip if low priority.** This is more useful at 500+ stars when you're optimizing for the long tail.

---

## Tone notes

- **Don't oversell.** "OSS CLI / MCP server / drift detection" is enough. Every list has a contributor who reflex-closes PRs that read like marketing.
- **Respect the list's format exactly.** If they use hyphens, use hyphens. If they alphabetize, alphabetize. If they want 80-char bullets, cut to 80.
- **Reply to review within 24h.** A merged PR that sat three weeks idle isn't worth a fast one you let die.

## Expected outcome

Realistic star yield per accepted submission:
- MCP servers (official): 100–300 stars over 4 weeks (highest-quality traffic)
- awesome-mcp-servers: 50–150 stars
- awesome-claude-code: 20–80 stars
- cursor.directory: 10–40 stars
- awesome-copilot: 5–30 stars (if alive)

Cumulative: 200–600 stars over the month after MCP ships, for ~30 minutes of submission work. That's the best hourly rate on the growth list.
