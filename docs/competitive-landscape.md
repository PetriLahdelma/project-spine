# Competitive landscape

_Last researched: 2026-05-05._

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
2. **Loaded-context debugging.** Codex and Claude document ways to verify which instruction files loaded. Spine now has `spine doctor` for version/channel/runtime/drift readiness; a later `spine inspect --agent-files` mode should explain what each target agent will see.
3. **Token budget visibility.** Spine now reports byte budgets for the root agent files. A remaining step is approximate token counts and threshold warnings in `spine inspect`.
4. **Launch demo credibility.** Repomix wins on one-command clarity. Spine should keep the happy path brutally simple: install, init, compile, drift check.
5. **Package-surface hygiene.** The public npm tarball should ship only the routed OSS surface. Dormant hosted experiments can remain in source, but they must not appear in build output or package contents.

## Product Hunt benchmark pass — 2026 agent launches

| Benchmark pattern | Products checked | What they do better | Spine response |
|---|---|---|---|
| Visual agent-feedback loops | Agentation | Shows the workflow in one glance: click UI, produce agent-ready tasks. | Homepage now leads with the concrete pain and shows compile, drift, and doctor proof instead of relying on abstract "context compiler" language alone. |
| Rule/context management | Straion, Knowns CLI | Puts the pain in plain language: stop copy-pasting context, manage rules for agents. | Copy now says "Stop re-explaining your repo" and the comparison section explains compiled, source-pointed rules versus manual rule libraries. |
| Repo self-setup / agent orchestration | Keystone, Mngr, Baton, Open Agents | One memorable action plus visible proof that agents can work across a repo. | `spine doctor` gives Project Spine a launch-friendly proof command for version, beta channel, runtime, routed commands, hosted guardrails, network posture, and drift. |
| Security / sandbox posture | SuperHQ | Makes trust concrete instead of burying it in docs. | Homepage trust strip and security copy now surface offline-by-default, no telemetry/account, and no routed upload path. |
| Design-to-agent workflow | Figma for Agents | Makes design-system context feel native to agent work. | Homepage and launch copy keep tokens/design drift in the first-screen promise, not only in docs. |

Source pages reviewed: Product Hunt product pages for Agentation, Straion, Knowns CLI, Keystone / Mngr by Imbue, Baton, Open Agents, SuperHQ, Claude Code /ultrareview, and Figma for Agents.

## Upgrades landed from this pass

- Public build now cleans `dist` before compiling.
- Dormant hosted command modules and hosted template sync are excluded from the public TypeScript build.
- `npm run pack:check` fails if dormant/private files would ship.
- E2E tests now guard the exact template-help mismatch that previously shipped.
- `spine compile` now emits `.cursor/rules/project-spine.mdc` and drift-tracks its canonical export.
- Compile output now reports per-file byte budgets for `AGENTS.md`, `CLAUDE.md`, Copilot, and Cursor.
- `spine doctor` verifies beta version/channel, Node runtime, routed command surface, hosted-command guardrails, network posture, and local drift state.
- `spine-mcp` exposes `spine_doctor` so MCP clients can verify readiness before compiling or editing generated files.
- Homepage now includes a trust strip, source-pointer/drift proof panels, and a category-positioning table grounded in the Product Hunt benchmark pass.

## Sources

- OpenAI Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md
- Claude Code memory guide: https://code.claude.com/docs/en/memory
- Cursor rules docs: https://docs.cursor.com/en/context/rules
- Repomix getting started: https://repomix.com/guide/
