---
name: project-spine-rationale
description: Use when the user wants to review, polish, or share the generated Project Spine rationale file locally. Phrases like "show the project rationale", "send the client a project summary", "review rationale.md", or "make the client-facing overview safer".
---

# Local rationale review

**Goal:** help the user review `.project-spine/exports/rationale.md` before they share it through their normal channel. The public OSS CLI generates the file locally; it does not publish hosted rationale URLs.

## Prerequisites

1. Project compiled — `.project-spine/exports/rationale.md` exists. If not, switch to project-spine-kickoff.
2. Generated outputs are current — run `spine drift check` first if the user mentions stale instructions or changed inputs.

## Step 1 — inspect the rationale

```bash
sed -n '1,220p' .project-spine/exports/rationale.md
```

Review the headings and content with the user. Do not paste the whole file into a public channel unless they explicitly ask.

## Step 2 — check client-safety

Before the user shares the rationale, call out these sections:

- **Risks** — may contain internal language that should be softened.
- **Constraints** — may mention vendor costs, private process, or trade secrets.
- **Warnings** — may reveal missing brief details or repo uncertainty.
- **Assumptions** — should be phrased as assumptions, not promises.

If anything needs changing, edit the upstream `brief.md` or design inputs and rerun `spine compile`. Do not hand-edit `rationale.md` unless the user accepts that drift will be reported later.

## Step 3 — prepare a shareable note

If the file is safe, summarize it into a short client note:

```text
Here is the Project Spine rationale generated from the current brief and repo.
It captures goals, audience, constraints, assumptions, risks, stack summary,
and the first scaffold direction. The generated files are local and versionable;
future drift is checked with `spine drift check`.
```

## Hosted publishing status

Do not tell users to run `spine publish rationale`, `spine rationale list`, or `spine rationale revoke` in the public OSS CLI. Those hosted commands exist in dormant source files but are intentionally not routed from `spine --help`.

## What NOT to do

- Do not publish or share rationale content that includes credentials, internal URLs, PII, or trade secrets.
- Do not manually edit generated rationale files as the canonical fix. Edit inputs and recompile.
- Do not claim there is a hosted branded URL flow in the public CLI.
