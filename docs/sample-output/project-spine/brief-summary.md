# Brief summary

_Normalized by Project Spine on 2026-05-04T21:04:10.750Z._

**Project:** Project Spine
**Type:** other _(confidence 1)_

## Goals

- Ship a deterministic context compiler that turns a client brief + a repo + optional design inputs into a repo-native operating layer for coding agents (AGENTS.md / CLAUDE.md / copilot-instructions.md plus a full scaffold plan).
- Stay useful without AI in the loop. Every artefact must be worth keeping even if a human reviews it by hand.
- Keep the OSS CLI the whole pitch: MIT, no telemetry, no account required, no upsell in the code path.
- Drift-aware by default. spine drift check + spine drift diff must be CI-reliable so teams can enforce that exports stay aligned with inputs.

## Audience

- Agency leads kicking off 8–12 client projects a year who are rebuilding the same conventions every time.
- Dev-tool teams evaluating Spine for internal use — they want to read the source and the PRD before they install anything.
- Individual devs who hit "AGENTS.md stale" and want a compiler, not another chatbot.

## Constraints

- Node ≥ 20, TypeScript strict, ESM only. Zero runtime hot reload tricks — the CLI must behave identically on developer machines and in CI.
- No implicit network calls on any compile path. External calls (spine tokens pull, optional LLM enrichment) are behind explicit flags + explicit env vars.
- Generated outputs are deterministic: identical inputs → identical bytes → identical hash. The spine hash is load-bearing for drift detection.
- Bundled templates ship inside the npm tarball; the CLI does not download them at runtime.

## Assumptions

- Teams that adopt a drift check will trust its exit code in CI. The signal has to be right > 99% of the time or it'll be ignored.
- Markdown + YAML frontmatter is the lowest-friction authoring format for briefs and design rules. A custom DSL would lose adoption.
- Agents operating on a repo that already has AGENTS.md / CLAUDE.md will prefer Spine-generated ones over hand-written ones if those files cite their sources.

## Risks

- Scope creep into "another AI coding tool" dilutes the pitch. The compiler framing has to stay front and centre.
- Figma API changes (variables endpoint shape) could break spine tokens pull silently. Need integration checks.
- Hosted-tier code still lives in-tree (dormant) — if it leaks back into the CLI surface, the OSS positioning breaks again.

## Success criteria

- spine --help lists exactly the routed OSS commands — no hosted-tier leakage.
- Determinism test: recompiling with identical inputs yields a byte-identical spine.json and identical export hashes.
- Drift check exits non-zero when any input file's sha256 changes; spine drift diff prints the unified patch for every hand-edited export.
- First run (fresh clone) under 30 seconds from npm install → spine init → spine compile with a usable brief and the saas-marketing template.
- Every rule in spine.json carries a non-empty source.pointer back to brief / repo / design / template / inference.

<!-- spine:deterministic -->
