# Repository learning delivery

## Product contract

Project Spine turns reviewed failures into scoped, source-linked guardrails, proves
them against historical Git revisions, and serves verified guidance to agents and
CI. The first release uses deterministic literal checks. Historical replay reads
Git objects; it does not run an AI model or establish general immunity to defects.

## Delivery plan

1. Preserve the current compiler/drift/export API and establish baseline tests.
2. Add strict failure-case schema, immutable evidence, candidate storage, historical
   replay, digest-bound verification, scoped enforcement and context retrieval.
3. Add CLI learning/replay/guard/context/report/demo and GitHub evidence import,
   package exports, MCP tools and a reusable GitHub Action.
4. Deliver an offline demonstration that creates actual broken/fixed Git revisions,
   learns a candidate, verifies it, and catches a reintroduced defect. Export an HTML
   report from these real checks; label demo data as a fixture.
5. Update public marketing routes and documentation to match shipped capabilities,
   preserve the existing visual identity, and make the demonstration the first action.
6. Update existing dependency/runtime versions and CI across CLI, site and desktop.
7. Verify unit/integration/CLI/MCP tests, package installation, dependency audits,
   site and desktop builds, and desktop/mobile browser behavior. Review independently.
8. Commit with decision-record trailers and deliver a reviewable pull request.

## Acceptance criteria

- Candidate rules never silently become active. Replaying the broken revision must
  fail and the corrected revision must pass with real matching-file coverage.
- Changing rule content invalidates its verification; deletion and missing glob
  matches cannot produce false proof. No repository scripts execute during replay.
- File boundaries, symlinks, oversized inputs, hostile paths, invalid JSON and
  shell metacharacters are covered by tests. GitHub import uses argument arrays.
- CLI JSON is machine-readable; CI returns failure for violations or unverifiable
  required checks. Context includes only relevant verified rules and provenance.
- Reports escape repository content. Demo works offline without a model key.
- Legacy compiler, drift, exports, MCP tools and package smoke tests still work.
- Public copy distinguishes deterministic replay, illustrative preview and actual
  evidence; no invented customers, savings, immunity scores or release availability.

## Modernization/cleanup boundaries

Reuse existing Zod, CLI, glob, MCP and test infrastructure; add no dependency merely
for the new feature. Retain dormant hosted code and compatibility paths. Replace
obsolete public positioning, not unrelated application behavior. Dependency changes
must have fresh audit/build evidence. Keep historical documents explicitly historical
where they describe previous releases.

## Verification evidence

Recorded in the pull request and delivery report after implementation. Live model
benchmarks, organization fleet services and externally supplied failure corpora are
not represented as implemented by deterministic replay.
