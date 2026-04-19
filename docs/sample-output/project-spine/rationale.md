# Project Spine — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `b5db78b43a41f5e7`, project type `other`._

<!-- spine:deterministic -->

## What we are building

- Ship a deterministic context compiler that turns a client brief + a repo + optional design inputs into a repo-native operating layer for coding agents (AGENTS.md / CLAUDE.md / copilot-instructions.md plus a full scaffold plan).
- Stay useful without AI in the loop. Every artefact must be worth keeping even if a human reviews it by hand.
- Keep the OSS CLI the whole pitch: MIT, no telemetry, no account required, no upsell in the code path.
- Drift-aware by default. spine drift check + spine drift diff must be CI-reliable so teams can enforce that exports stay aligned with inputs.

## Who we are building it for

- Agency leads kicking off 8–12 client projects a year who are rebuilding the same conventions every time.
- Dev-tool teams evaluating Spine for internal use — they want to read the source and the PRD before they install anything.
- Individual devs who hit "AGENTS.md stale" and want a compiler, not another chatbot.

## Constraints we accepted

- Node ≥ 20, TypeScript strict, ESM only. Zero runtime hot reload tricks — the CLI must behave identically on developer machines and in CI.
- No implicit network calls on any compile path. External calls (spine tokens pull, optional LLM enrichment) are behind explicit flags + explicit env vars.
- Generated outputs are deterministic: identical inputs → identical bytes → identical hash. The spine hash is load-bearing for drift detection.
- Bundled templates ship inside the npm tarball; the CLI does not download them at runtime.

## Assumptions we are making

- Teams that adopt a drift check will trust its exit code in CI. The signal has to be right > 99% of the time or it'll be ignored.
- Markdown + YAML frontmatter is the lowest-friction authoring format for briefs and design rules. A custom DSL would lose adoption.
- Agents operating on a repo that already has AGENTS.md / CLAUDE.md will prefer Spine-generated ones over hand-written ones if those files cite their sources.

## Risks we are watching

- Scope creep into "another AI coding tool" dilutes the pitch. The compiler framing has to stay front and centre.
- Figma API changes (variables endpoint shape) could break spine tokens pull silently. Need integration checks.
- Hosted-tier code still lives in-tree (dormant) — if it leaks back into the CLI surface, the OSS positioning breaks again.

## The stack we are using

Framework: **node-library**. Language: **typescript** (strict). Testing: **vitest**.

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.

## Open questions

- Framework detection confidence 0.4. Evidence: no framework dep; looks like a node library
