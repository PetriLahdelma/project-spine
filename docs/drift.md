# Drift detection

The moat piece. Generating instruction files is easy — keeping them aligned as your repo evolves is the value.

## The contract

At compile time, `spine compile` writes two things in addition to the exports:

1. **`.project-spine/spine.json`** — the canonical model (already present).
2. **`.project-spine/export-manifest.json`** — a per-file manifest recording the sha256 of every input (brief, design, template, repo-profile) and every export (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, and each of the nine Markdown exports).

At check time, `spine drift check` re-runs the deterministic pipeline, computes fresh hashes, and compares them against the manifest.

## What counts as drift

| Kind | Signal | Fix |
|------|--------|-----|
| **Input drift** | `brief.md` / `design-rules.md` / repo-profile hash differs from stored | Run `spine compile` to regenerate |
| **Template drift** | Template `contributes` block changed since last compile | Run `spine compile` — confirm template version |
| **Export hand-edit** | Any generated file's current sha256 differs from stored | Edit the upstream input and recompile, or delete the file and recompile |
| **Missing export** | Generated file listed in manifest no longer on disk | Run `spine export --targets all` |
| **Manifest missing** | No `export-manifest.json` — can't check | Run `spine compile` to create one |

## Exit codes

- `0` — no drift
- `1` — drift detected
- `2` — can't check (missing manifest, missing inputs, unreadable files)

## CLI

```bash
# basic check, prints summary, writes drift-report.md
spine drift check

# JSON to stdout, suitable for piping into CI
spine drift check --json

# stricter — fail when any export is hand-edited (default is any drift)
spine drift check --fail-on any

# push the snapshot to the active workspace fleet view
spine drift check --push

# push to a specific workspace and project slug
spine drift check --push --workspace my-agency --project acme-site
```

`--push` is non-fatal for the drift check's own exit-code semantics — if the upload fails, the local check result still determines success/failure. That makes it safe to drop into CI today.

## CI integration

Drop this into `.github/workflows/spine-drift.yml`:

```yaml
name: Spine drift

on:
  pull_request:
    paths:
      - "brief.md"
      - "design-rules.md"
      - ".project-spine/**"
      - "AGENTS.md"
      - "CLAUDE.md"
      - ".github/copilot-instructions.md"
      - "package.json"
      - "tsconfig.json"

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g project-spine
      - run: spine drift check --push --fail-on any --json | tee drift.json
        env:
          # Generated once via `spine login` + `cat ~/.project-spine/config.json`;
          # store as a GitHub Actions secret.
          SPINE_API_TOKEN: ${{ secrets.SPINE_API_TOKEN }}
          SPINE_WORKSPACE: my-agency
      - name: Fail on drift
        run: |
          code=$?
          if [ "$code" != "0" ]; then
            echo "::warning::Project Spine detected drift. See drift-report.md in artifacts."
            exit "$code"
          fi
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: spine-drift-report
          path: |
            .project-spine/drift-report.md
            drift.json
```

> **Auth in CI.** The `spine` CLI reads its token from `~/.project-spine/config.json`. In CI, either mount the token via `SPINE_API_TOKEN` and bootstrap the config file in a pre-step, or skip `--push` entirely if the team prefers the drift check to stay local.

## Design invariants

- **Drift check is deterministic.** Identical repo state produces identical results; no LLM calls, no network.
- **The manifest is the source of truth for export expectations.** We never hash the generated file we're currently writing against itself at write time; only a later check compares to stored state.
- **Hand-edits are treated as drift, not an error.** The report lists them; it's the user's choice whether to accept them (in which case: edit the upstream input so a recompile produces the same result) or recompile (overwriting the hand-edit).
- **Manifest is additive-versioned.** Schema bumps only add optional fields. Older manifests are still readable.
