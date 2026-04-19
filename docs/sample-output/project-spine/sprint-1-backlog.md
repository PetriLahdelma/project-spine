# Sprint 1 — backlog seed

> Starter items with acceptance criteria. Setup items clear the runway; delivery items trace to brief goals.

_Generated from `spine.json` — hash `b5db78b43a41f5e7`, project type `other`._

<!-- spine:deterministic -->

## Setup — clear the runway

### S1. Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, and `.gi…

**Detail:** Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` after review.

**Acceptance:**
- [ ] Change landed on main (or a release branch) and merged.
- [ ] Verified locally and in CI where applicable.

**Source:** `inference:inferred:setup/agent-files`

### S2. Pick and configure a linter (Biome or ESLint) with a minimal rule set.

**Detail:** Pick and configure a linter (Biome or ESLint) with a minimal rule set.

**Acceptance:**
- [ ] Change landed on main (or a release branch) and merged.
- [ ] Verified locally and in CI where applicable.

**Source:** `inference:inferred:setup/lint`

## Deliver — sprint goals

### 1. Ship a deterministic context compiler that turns a client brief + a r…

**Detail:** Deliver: Ship a deterministic context compiler that turns a client brief + a repo + optional design inputs into a repo-native operating layer for coding agents (AGENTS.md / CLAUDE.md / copilot-instructions.md plus a full scaffold plan).

**Acceptance:**
- [ ] Implemented behind the stack and conventions declared in `AGENTS.md`.
- [ ] Typecheck + lint + tests pass locally and in CI.
- [ ] No `any` introduced. No new dependency without rationale.
- [ ] Keyboard-only walkthrough completes the flow.
- [ ] Screen reader announces labels and state changes.

**Source:** `brief:brief.md#section0/item0`

### 2. Stay useful without AI in the loop. Every artefact must be worth keep…

**Detail:** Deliver: Stay useful without AI in the loop. Every artefact must be worth keeping even if a human reviews it by hand.

**Acceptance:**
- [ ] Implemented behind the stack and conventions declared in `AGENTS.md`.
- [ ] Typecheck + lint + tests pass locally and in CI.
- [ ] No `any` introduced. No new dependency without rationale.
- [ ] Keyboard-only walkthrough completes the flow.
- [ ] Screen reader announces labels and state changes.

**Source:** `brief:brief.md#section0/item1`

### 3. Keep the OSS CLI the whole pitch: MIT, no telemetry, no account requi…

**Detail:** Deliver: Keep the OSS CLI the whole pitch: MIT, no telemetry, no account required, no upsell in the code path.

**Acceptance:**
- [ ] Implemented behind the stack and conventions declared in `AGENTS.md`.
- [ ] Typecheck + lint + tests pass locally and in CI.
- [ ] No `any` introduced. No new dependency without rationale.
- [ ] Keyboard-only walkthrough completes the flow.
- [ ] Screen reader announces labels and state changes.

**Source:** `brief:brief.md#section0/item2`

### 4. Drift-aware by default. spine drift check + spine drift diff must be …

**Detail:** Deliver: Drift-aware by default. spine drift check + spine drift diff must be CI-reliable so teams can enforce that exports stay aligned with inputs.

**Acceptance:**
- [ ] Implemented behind the stack and conventions declared in `AGENTS.md`.
- [ ] Typecheck + lint + tests pass locally and in CI.
- [ ] No `any` introduced. No new dependency without rationale.
- [ ] Keyboard-only walkthrough completes the flow.
- [ ] Screen reader announces labels and state changes.

**Source:** `brief:brief.md#section0/item3`
