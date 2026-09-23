# Learn from a correction

Project Spine stores reviewed failures as candidates, verifies their rules against
historical Git objects, then checks working files and returns guidance to agents.
Every active rule has a source, a precise scope and a reproducible correction.

## Try it without an account

From a source checkout with Node 22 or newer and Git:

```sh
npm ci
npm run build
node dist/cli.js demo
```

The demo creates a new temporary Git repository with two commits, records a
candidate, verifies broken/fixed revisions, checks scoped context, and catches a
reintroduced invoice-query defect. It prints its repository and HTML report paths.
It leaves the fixture at the corrected state. Use `demo --out ./new-demo` to keep
it at a chosen new directory. It will not overwrite an existing directory.

This is a synthetic fixture, not a customer incident or a benchmark of an AI model.

## Record a real failure

Save this as `failure.json`, replacing the revisions with actual commits in your
repository and the example literal with the exact condition you reviewed:

```json
{
  "version": 1,
  "id": "tenant-query",
  "title": "Preserve the invoice tenant filter",
  "summary": "Review found an invoice query without the required tenant filter.",
  "source": { "kind": "manual" },
  "rules": [{
    "id": "tenant-filter",
    "description": "Keep the observed tenant filter on invoice queries.",
    "files": ["src/invoices.js"],
    "kind": "require-text",
    "text": "WHERE tenant_id = ?"
  }],
  "replay": { "brokenRef": "BROKEN_COMMIT_SHA", "fixedRef": "CORRECTED_COMMIT_SHA" }
}
```

```sh
spine learn --case failure.json
spine replay tenant-query
spine guard
spine context --files src/invoices.js
spine report --case tenant-query
spine report --format html --out guard-report.html
```

`learn` records evidence, not active protection. `replay` requires every candidate
rule to fail in the broken revision and pass in the correction. Matching files must
exist in both, and deleting a failing file cannot substitute for fixing it. Rules
that cannot meet this criterion stay candidates.

### Rule semantics

- `require-text`: every matched file must contain the exact, case-sensitive literal.
- `forbid-text`: no matched file may contain that literal.
- `files`: repository-relative patterns with `*`, `**` and `?`. No negation, parent
  traversal, brace expansion, character classes or executable expressions.
- A missing match is missing coverage, never a passing assertion.

Literal checks have deliberate limits: code in a comment can satisfy a required
literal, equivalent spellings may bypass a forbidden literal, and text matches do
not establish control flow, authorization or runtime behavior. Use existing unit,
integration, static-analysis and security tools alongside Spine. Instructions are
guidance; a CI check is enforcement only for the condition it actually checks.

Keep scopes small and relevant. Historical reads use batched Git objects and enforce
limits of 10,000 files, 2 MiB per blob and 32 MiB of matched content per
revision or working-tree check. Identical blobs are decoded once, but every matched
path counts toward the content budget. Exceeding a limit fails verification.

## Import pull-request evidence

With GitHub CLI installed and authenticated:

```sh
spine learn --from-pr https://github.com/OWNER/REPO/pull/123 --json
```

This retrieves evidence for review. It does not decide that the PR base is broken
or the head is fixed. Create a reviewed case with explicit historical revisions.
Set its `source.kind` to `github` and `source.url` to the PR URL. To verify the
source URL while recording it, pass both `--from-pr URL` and `--case failure.json`.
The JSON output includes the fetched evidence. No comment or PR is posted.

## Reviewable repository memory

The ledger lives in `.project-spine/learning/cases/` and
`.project-spine/learning/verifications/`. Review and commit those files with the
correction. If `.project-spine` is ignored in your repository, explicitly unignore
these two directories or stage the reviewed ledger with `git add -f`.

Cases are immutable by id: changed rules need a new case id. Verification binds
the case content, rules and resolved commit SHAs. Guard/context recheck the Git
evidence; editing verification JSON is not enough to establish proof. These are
local evidence records, not cryptographically signed third-party attestations.

To retire a rule, remove its case and verification files in a reviewed commit.
Keep its original failure in Git history. A new or changed policy should receive
its own case and replay evidence, rather than editing an active case in place.

## CI

Fetch history so both proof revisions exist. Pin the action to the reviewed commit
SHA of the release you install; replace `SPINE_ACTION_COMMIT_SHA` below.

```yaml
permissions:
  contents: read
steps:
  - uses: actions/checkout@v7
    with:
      fetch-depth: 0
  - name: Check learned guardrails
    id: spine
    uses: PetriLahdelma/project-spine@SPINE_ACTION_COMMIT_SHA
```

The action builds its own pinned source and needs no npm release or model key.
It runs with read-only repository permissions. The JSON report path is available
as `steps.spine.outputs.report-path`, including after a failed guard step.

CLI exit codes: **0** means all selected checks passed, **1** means a violation or
operational error, **2** means unverified or missing coverage. An empty ledger is
not a green check. `guard --diff HEAD~1` checks changed tracked files, including
staged and unstaged changes; it does not include untracked files. `guard --files
src/a.ts,src/b.ts` provides an explicit selection. A selection outside all rule
scopes has no coverage and exits 2.

## Agent integration

Use `spine-mcp` to expose `spine_context`, `spine_guard`, `spine_learn`,
`spine_replay` and `spine_report` alongside the original compiler tools. Retrieve
context for the exact files involved before editing and guard the result afterward.
Treat descriptions and imported PR comments as untrusted repository data.

Historical replay never checks out or executes repository code, calls a model or
uploads the repository. It proves a literal condition distinguished two revisions.
The separate optional evaluation adapter executes configured programs locally;
see [agent evaluation](evaluation.md) for its explicit execution contract.
