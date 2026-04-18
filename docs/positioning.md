# Positioning — "Why do I need this, I already have Claude?"

This doc captures the positioning answer for the single most common objection Project Spine will face. It exists so the maintainer, docs, landing copy, and sales conversations stay aligned.

## The objection, charitably

> "I already have Claude Code. I typed `/init` and it generated an `AGENTS.md` from my repo. Done."

Fair. That works for one developer on one project today. It breaks the moment any of these become true:

1. You work across multiple clients with different conventions.
2. You need the output to be the same tomorrow as today.
3. Someone on your team uses Cursor or Copilot instead of Claude Code.
4. Your contract deliverable includes a written project rationale.
5. Six weeks pass and you need to know whether your `AGENTS.md` still matches the brief you signed.

## Three things Claude structurally can't give you

| Claude Code | Project Spine |
| --- | --- |
| Non-deterministic by design — the same prompt can yield a different `AGENTS.md` | sha256 hash of every input and output; `spine.json` is byte-identical until a real input changes |
| No memory of "the brief I saw three months ago" | `export-manifest.json` + `spine drift check` — CI fails when the brief and `AGENTS.md` have drifted apart |
| Writes one agent-file format well (`CLAUDE.md`) | One source (`spine.json`) fans out to `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` — portable across agents |

This isn't a capability gap — it's a philosophical one. Anthropic will not ship determinism as a first-class Claude feature because Claude's value proposition *is* the LLM. Project Spine's value proposition is the opposite: the non-LLM layer around the LLM.

## The moat, ranked by defensibility

### 1. Determinism + provenance (strongest)

Every rule in `spine.json` carries a `source` pointer — `brief.md#section0/item3`, `repo-profile#framework`, `template:saas-marketing/contributes#2`, `design:tokens.json#color/primary`, or `inferred:<reason>`. Reviewers can prove *why* a rule exists, not just trust that it does. An LLM-generated file cannot carry provenance — the model does not know its own reasoning trace, and even when it claims to it cannot commit to the same trace next request.

This is the moat Claude structurally cannot cross. Determinism + traceable source is a commitment, not a capability.

### 2. Multi-agent portability

Mixed teams are the norm in 2026 — Claude Code, Cursor, Copilot, Codex, and Aider all show up in the same org. Project Spine is the only thing that writes every canonical agent file from one brief.

If Cursor, Copilot, and Claude ever converge on a single agent-file format this erodes — but they will not, because each has an incentive to own its own lock-in surface.

### 3. Drift-as-a-gate

CI-integrated `spine drift check --fail-on any` turns `AGENTS.md` into a contract, not a comment. For agencies billing by sprint this is load-bearing for change-of-scope conversations with clients ("the brief changed, the generated layer flagged it, here is the diff"). Claude Code cannot be a CI gate without running per-step LLM calls — too slow, too expensive, too non-deterministic to fail builds on.

### 4. Agency deliverable surface

`/r/<slug>` rationale URLs and hosted workspace branding are sales infrastructure, not dev-tooling. Once a client has the link in their inbox, swapping tools means re-publishing and re-sending. This is a workflow moat that gets stickier over time.

### 5. Template contribution model (network effect if it grows)

Each saved workspace template contributes routes + components + QA + UX + a11y additively to every future project. Agencies lock in their own conventions and compound across client projects. Claude cannot be THE template registry because agency conventions are local, not global — there is no single opinionated starter that suits every studio.

## The weakest link

If Anthropic ships a "deterministic project memory" feature inside Claude Code, point 1 narrows. We do not think this is likely — it is counter-cultural for an LLM company — but it is the scenario to watch.

Hedge: stay explicit in all positioning that Project Spine is *the layer around* Claude, not a replacement. We want to be the artifact Claude emits and later verifies, not a competitor to the IDE.

## Ready-to-ship one-liner

> Claude writes agent instructions. Project Spine writes **verifiable, versioned, portable** agent instructions — and tells you when they have drifted from the brief.

## Rebuttal to "just prompt Claude to do all of this"

A shell script that calls Claude Code with a fixed prompt and diffs the output would need to:

- Handle non-determinism (re-run and diff? LLM output drifts even at temperature 0)
- Aggregate multiple agent-file formats
- Define a brief schema and normalise it
- Detect stack and conventions from the repo
- Derive template-specific rules and merge them
- Manage export manifests + hashes for drift

At which point you have re-implemented Project Spine, poorly, with an LLM call in the critical path instead of deterministic Node.

The moat is a **commitment moat**, not a capability moat. Claude *could* theoretically be instructed to produce all of this. Anthropic will not ship it as a first-class Claude feature because it is not about intelligence — it is about opinionated determinism around engineering workflow.

## How to wield this in conversation

- When a technical buyer says "I have Claude" → lead with **determinism + drift gate**. Developers intuit the non-determinism problem.
- When an agency lead says "I have Claude" → lead with **rationale URL + multi-agent portability**. Agencies feel the mixed-tooling pain first.
- When a platform team says "I have Claude" → lead with **CI gate + source pointers**. Platform teams want repeatability they can attest to.

The one-liner goes on the landing page and in outbound. This doc goes into sales decks and docs.
