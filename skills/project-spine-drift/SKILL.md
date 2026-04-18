---
name: project-spine-drift
description: Use when the user mentions drift, says AGENTS.md / CLAUDE.md / copilot-instructions are "stale" or "out of date", asks about CI catching docs drift, or says "check if my spine is still current". Runs `spine drift check`, interprets each drift category, and guides resolution. For initial setup use project-spine-kickoff.
---

# Drift detection and resolution

**Goal:** determine whether the generated files still match the current inputs, and if not, help the user pick the right fix for each drift category.

## Prerequisites

- `.project-spine/export-manifest.json` exists. If not, the project was never compiled — switch to project-spine-kickoff.
- CLI ≥ 0.8.1.

## Step 1 — run the check

From the project root:

```bash
spine drift check
```

Exit codes:

- `0` — clean; nothing to do.
- `1` — drift detected; continue.
- `2` — can't check (missing manifest, unreadable inputs); investigate before proceeding.

The command prints a summary with three counters and writes `drift-report.md` + `drift-report.json` under `.project-spine/`.

## Step 2 — interpret each drift category

### Input drift

One or more of: `brief.md`, `design-rules.md`, repo profile, or the spine hash itself changed.

**Fix:** `spine compile --brief ./brief.md --repo .` (add the same `--template` the project uses). This regenerates all exports from the new inputs.

### Export hand-edits

A generated file (e.g. `AGENTS.md`) was edited manually after the last compile.

**Two valid responses — ask the user which they want:**

1. **"Accept my edits as canonical"** → the user wants the hand-edit to survive. They must edit the upstream input (`brief.md`, `design-rules.md`, or the workspace template) so a recompile reproduces the edit. Otherwise the next recompile reverts it.
2. **"Discard my edits, regenerate"** → run `spine export --targets all` to rewrite the exports from the stored `spine.json`.

The second option is only safe if the user confirms they don't need the hand-edited text. Never auto-discard.

### Missing exports

A file listed in the manifest isn't on disk (deleted, moved, gitignored).

**Fix:** `spine export --targets all` to regenerate.

## Step 3 — resolve and verify

After applying fixes, run `spine drift check` again. It should report clean.

## CI usage (for automation conversations)

If the user is setting this up in CI:

```yaml
# .github/workflows/spine-drift.yml
jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: 20 }
      - run: npm install -g project-spine
      - run: spine drift check --fail-on any
```

To push the drift report to a workspace fleet view (requires `spine login` setup):

```yaml
      - run: spine drift check --push --fail-on any
        env:
          SPINE_API_TOKEN: ${{ secrets.SPINE_API_TOKEN }}
          SPINE_WORKSPACE: my-agency
```

`--fail-on` levels: `none`, `any` (default when `--push`), `inputs` (only fail on brief/design changes), `exports` (only hand-edits + missing files).

## What to tell the user after resolving

If drift was caused by **input** changes, emphasise: *"This is normal — you changed the brief or repo, so the generated files need to regenerate. The new `spine.json` hash is `<hash>`; keep that visible in commit messages."*

If drift was caused by **hand-edits**, emphasise: *"Hand-edits get overwritten on recompile. The fix is to edit the upstream `brief.md` / `design-rules.md` / template so the content regenerates naturally."*

## What NOT to do

- Do not manually edit `spine.json` to "fix" a hash mismatch. It's content-addressable — any edit desyncs everything.
- Do not suggest ignoring drift. The whole point is early detection.
- Do not recompile as a reflex. Run the drift check first and tell the user what it found before applying any changes.
