# Project Spine — drift check (GitHub Action)

Fail your CI when `AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` have drifted from the brief, tokens, or compiled manifest since the last `spine compile`.

## Minimal usage

```yaml
# .github/workflows/spine-drift.yml
name: Spine drift check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: PetriLahdelma/project-spine/.github/actions/drift-check@v0.9.2-alpha.0
```

By default it runs `spine drift check --fail-on any` from the repo root. Non-zero exit fails the job.

## Inputs

| Name | Default | What it does |
|---|---|---|
| `version` | `next` | `project-spine` npm dist-tag or exact version. Pin to a tag (e.g. `0.9.2-alpha.0`) for reproducibility. |
| `node-version` | `20` | Node major version for the CLI. |
| `repo-path` | `.` | Repo root. Must contain a `.project-spine/` directory produced by a prior `spine compile`. |
| `fail-on` | `any` | One of `none` / `any` / `inputs` / `exports`. |
| `json` | `false` | When `true`, emits the structured drift report as JSON into the job log. Useful for downstream steps that parse the output. |

## Outputs

| Name | Value |
|---|---|
| `clean` | `'true'` if no drift, `'false'` otherwise. |

## Examples

### Only fail on input drift (brief / tokens changed), ignore hand-edits to exports

```yaml
- uses: PetriLahdelma/project-spine/.github/actions/drift-check@v0.9.2-alpha.0
  with:
    fail-on: inputs
```

### Emit JSON for a downstream summary step

```yaml
- id: drift
  uses: PetriLahdelma/project-spine/.github/actions/drift-check@v0.9.2-alpha.0
  with:
    fail-on: any
    json: true
- if: failure()
  run: echo "Drift detected — see prior step for the JSON report."
```

### Pin to an exact CLI version

```yaml
- uses: PetriLahdelma/project-spine/.github/actions/drift-check@v0.9.2-alpha.0
  with:
    version: "0.9.2-alpha.0"
```

## What it does under the hood

1. Sets up Node (`actions/setup-node@v4`).
2. Installs `project-spine` globally at the requested version.
3. Runs `spine drift check --repo <repo-path> --fail-on <fail-on>`.
4. Sets the `clean` output based on the CLI exit code.

Source: [`action.yml`](./action.yml). Composite action — no Docker, no Node build step in your repo. Runs in ~30 seconds cold.

## Typical workflow

Pair this with a second step that calls `spine compile` when drift is caused by *input* changes you want to accept. The usual pattern:

- Default branch CI: `drift-check` with `fail-on: any` — fail the build if anything is out of sync.
- On a separate workflow that triggers on brief/tokens changes only: `spine compile` then commit the refreshed `AGENTS.md` / `.project-spine/`.

## Status

- Alpha, same train as the CLI (`0.9.x`).
- Not listed on GitHub Marketplace yet. Reference by full repo path: `PetriLahdelma/project-spine/.github/actions/drift-check@<ref>`.
- License: MIT, same as the CLI.
