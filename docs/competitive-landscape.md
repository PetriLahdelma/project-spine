# Competitive landscape

_Last researched: 2026-05-04._

Project Spine is not competing with coding agents directly. It competes with the ways teams currently feed persistent project context to those agents.

## The current field

| Tool / pattern | What it does better today | What Spine should not copy blindly | Spine wedge |
|---|---|---|---|
| OpenAI Codex `AGENTS.md` | Native discovery, precedence, nested overrides, and verification commands for loaded instruction sources. | It is an instruction-consumption standard, not a compiler. It does not create a source-traced project model or drift gate by itself. | Compile `AGENTS.md` plus companion files from brief + repo + template, then prove when they drift. |
| Claude Code `CLAUDE.md`, `.claude/rules/`, auto memory | Clear split between human-authored project instructions and agent-written memory; path-scoped rules reduce context noise. | Auto memory is useful but inherently non-deterministic. It should not become the source of truth for client/project contracts. | Generate the project contract deterministically; let Claude import it and keep personal/auto memory separate. |
| Cursor project rules | `.cursor/rules` gives reusable, scoped instructions with `globs`, descriptions, manual invocation, and always-on modes. | Cursor-specific MDC is not portable across tools, and rules are still prompt context, not enforceable configuration. | Emit a Cursor-native rule from the same `spine.json` source of truth and keep drift detection portable. |
| Repomix | Extremely low-friction: `npx repomix@latest` creates an AI-friendly full-repo context file. It also has token counting, git-aware output, multiple formats, sensitive-info detection, MCP, GitHub Actions, and skills. | Full-repo packing optimizes for analysis context, not durable operating rules. It can be too much context for repeated agent work. | Be the durable context compiler: smaller, auditable, source-pointed, CI-gated, and worth committing. |

## Product gaps to close

1. **Instruction scoping.** The first Cursor-native export is now in place. A remaining step is path-scoped sub-rules for large monorepos and framework-specific folders.
2. **Loaded-context debugging.** Codex and Claude document ways to verify which instruction files loaded. Spine should add a `spine doctor` or `spine inspect --agent-files` mode that explains what each target agent will see.
3. **Token budget visibility.** Spine now reports byte budgets for the root agent files. A remaining step is approximate token counts and threshold warnings in `spine inspect`.
4. **Launch demo credibility.** Repomix wins on one-command clarity. Spine should keep the happy path brutally simple: install, init, compile, drift check.
5. **Package-surface hygiene.** The public npm tarball should ship only the routed OSS surface. Dormant hosted experiments can remain in source, but they must not appear in build output or package contents.

## Upgrades landed from this pass

- Public build now cleans `dist` before compiling.
- Dormant hosted command modules and hosted template sync are excluded from the public TypeScript build.
- `npm run pack:check` fails if dormant/private files would ship.
- E2E tests now guard the exact template-help mismatch that previously shipped.
- `spine compile` now emits `.cursor/rules/project-spine.mdc` and drift-tracks its canonical export.
- Compile output now reports per-file byte budgets for `AGENTS.md`, `CLAUDE.md`, Copilot, and Cursor.

## Sources

- OpenAI Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md
- Claude Code memory guide: https://code.claude.com/docs/en/memory
- Cursor rules docs: https://docs.cursor.com/en/context/rules
- Repomix getting started: https://repomix.com/guide/
