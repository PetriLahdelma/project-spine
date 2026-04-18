# Sample output

This folder is a **committed snapshot** of what `spine compile` produces — run against [`examples/brief.md`](../../examples/brief.md) with the `saas-marketing` template applied to this very repo.

```bash
spine compile \
  --brief ./examples/brief.md \
  --repo . \
  --template saas-marketing \
  --name "Project Spine"
```

The files below are the human-readable exports. See [PRD.md §9](../../PRD.md#9-output-structure) for the full output tree, including `spine.json` (the canonical machine-readable model) and `warnings.json` (ambiguities surfaced during compile).

| File | Purpose |
|---|---|
| [AGENTS.md](./AGENTS.md) | Agent instructions per [agents.md](https://agents.md/) convention |
| [CLAUDE.md](./CLAUDE.md) | Claude Code instruction file with `@import` links to deeper docs |
| [copilot-instructions.md](./copilot-instructions.md) | Self-contained Copilot instructions |
| [architecture-summary.md](./architecture-summary.md) | Detected stack, conventions, tool presence |
| [brief-summary.md](./brief-summary.md) | Normalized brief for human review |
| [scaffold-plan.md](./scaffold-plan.md) | Routes, component buckets, sprint-1 seed |
| [route-inventory.md](./route-inventory.md) | Routes with rationale traced back to goals |
| [component-plan.md](./component-plan.md) | Component buckets and usage guidance |
| [qa-guardrails.md](./qa-guardrails.md) | Actionable QA checklist + definition of done |
| [sprint-1-backlog.md](./sprint-1-backlog.md) | Sprint 1 items with acceptance criteria, each traced to a brief goal |
| [rationale.md](./rationale.md) | Client-facing project rationale (no rule traces) |

**Every rule in these files traces back to an upstream input** via source pointers — `brief.md#section0/item3`, `repo-profile#framework`, `template:saas-marketing/contributes#2`, or `inferred:...`. If a rule is wrong, the fix is to edit the upstream input and recompile, not to hand-edit the export.

The timestamps in the headers will drift on every recompile; the `hash` in each file is the source-of-truth integrity signal. Identical inputs produce an identical hash.
