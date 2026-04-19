# Sample output

Committed snapshots of what `spine compile` produces against three different repos. Read these to see the *shape* of the outputs before you install anything — the AGENTS.md / CLAUDE.md files are the ones your coding agents will actually load.

## [saas-marketing/](./saas-marketing) — marketing-site kickoff

`spine compile` run against the `saas-marketing` template and `examples/brief.md`. The hot path for most agency work.

```bash
spine compile \
  --brief ./examples/brief.md \
  --repo . \
  --template saas-marketing \
  --name "Project Spine"
```

## [api-service/](./api-service) — HTTP API backend

`spine compile` run against the `api-service` template with a Fastify / PostgreSQL stack. Shows how the compiler lifts template-contributed conventions (error envelope, versioned `/v{N}/` routes, cursor pagination, zod-parsed inputs) into the export set.

```bash
spine compile \
  --brief ./docs/sample-output/api-service/brief.md \
  --repo . \
  --template api-service \
  --name "Ledger API"
```

## [project-spine/](./project-spine) — dogfood

`spine compile` run against **this repo's own brief**, with no template. The CLI compiles itself. The files here are what Spine produces on a devtool codebase of this shape.

```bash
spine compile \
  --brief ./docs/sample-output/project-spine/brief.md \
  --repo . \
  --name "Project Spine"
```

The briefs live alongside their snapshots (`project-spine/brief.md`, `api-service/brief.md`). `saas-marketing/` uses the shared `examples/brief.md` at the repo root. Recompiling against current repo state will produce different hashes whenever the brief or the repo itself changes — that's drift detection doing its job.

---

## What's in each folder

Every snapshot is the full 19-file output of a compile run:

| File | Purpose |
|---|---|
| `brief.md` *(input, in `project-spine/` and `api-service/`)* | The source brief fed to `spine compile`. |
| `AGENTS.md` | Agent instructions per [agents.md](https://agents.md/) convention. |
| `CLAUDE.md` | Claude Code instruction file with `@import` links to deeper docs. |
| `copilot-instructions.md` | Self-contained Copilot instructions. |
| `architecture-summary.md` | Detected stack, conventions, tool presence. |
| `brief-summary.md` | Normalized brief for human review. |
| `scaffold-plan.md` | Routes, component buckets, sprint-1 seed. |
| `route-inventory.md` | Routes with rationale traced back to goals. |
| `component-plan.md` | Component buckets and usage guidance. |
| `qa-guardrails.md` | Actionable QA checklist + definition of done. |
| `sprint-1-backlog.md` | Sprint 1 items with acceptance criteria. |
| `rationale.md` | Client-facing project rationale (no rule traces). |
| `spine.json` | Canonical machine-readable model, hashed. |
| `brief.normalized.json` | Parsed brief. |
| `repo-profile.json` | Detected stack + conventions. |
| `warnings.json` | Ambiguities surfaced during compile. |
| `export-manifest.json` | Hashed inventory used by `spine drift check`. |

**Every rule in every file traces back to an upstream input** via source pointers — `brief.md#section0/item3`, `repo-profile#framework`, `template:saas-marketing/contributes#2`, or `inferred:...`. If a rule is wrong, the fix is to edit the upstream input and recompile, not to hand-edit the export.

Timestamps drift on every recompile. The `hash` field in each file is the integrity signal — identical inputs produce an identical hash.
