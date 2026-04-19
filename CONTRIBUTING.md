# Contributing to Project Spine

Thanks for the interest. This is an early-stage project; the surface area is small on purpose. Keep contributions focused and the discussion sharp.

## Before you start

- Open an issue first for anything non-trivial. Bugfixes and small polish can go straight to a PR.
- Read [PRD.md](./PRD.md) before proposing features — the MVP scope is deliberately narrow. "Useful for drift detection or kickoff" is the two-way test.
- The codebase is TypeScript-strict. No `any`. Prefer `unknown` and narrow at the boundary.

## Getting set up

```bash
git clone https://github.com/PetriLahdelma/project-spine.git
cd project-spine
npm install
npm run typecheck
npm test
```

Everything should pass on a fresh clone. If it doesn't on your machine, that's a bug — open an issue.

## Working agreement

- **One concern per PR.** If you're fixing a bug and notice something else, open a separate PR or issue.
- **Tests for new behavior.** Every new rule, detector, or export target gets at least one test. Determinism tests (identical inputs → identical output) are required for anything that touches the compiler or exporters.
- **Source pointers stay honest.** Every generated rule in `spine.json` must trace back to a real input: `brief.md#...`, `repo-profile#...`, `design.md#...`, `template:name/...`, or `inferred:...`. Never invent sources.
- **Deterministic before enriched.** The core pipeline (parser → analyzer → compiler → exporter) is deterministic and offline. LLM calls, if you introduce them, are opt-in and never load-bearing.
- **No implicit network calls.** Reading the repo is allowed. Uploading it anywhere without the user opting in is not.
- **Small files.** Every generated Markdown file should stay human-readable. If an export exceeds ~200 lines by default, break it up or restructure.

## Commit and PR style

- Commit messages: imperative subject, meaningful body for non-trivial changes (the *why*). Reference an issue if there is one.
- PR description: link to the issue, describe the user-visible change, call out any behavior change that affects the spine hash or export content.
- Keep PRs small enough to review in one sitting.

## Adding a template

1. Create `templates/<name>/template.yaml` with the manifest (see [src/templates/model.ts](./src/templates/model.ts)).
2. Add `templates/<name>/brief.md` — a starter brief with prompts keyed to the template's project type.
3. Optionally add `templates/<name>/design-rules.md`.
4. Add a test in `src/templates/templates.test.ts` that asserts the template's contributions land in the compiled spine.
5. Update the README template table.

## Adding a detector (repo analyzer)

New detectors live under `src/analyzer/`. The contract: take `(root, pkg)` and return a `Detection<T>` with `value`, `confidence`, and `evidence[]`. Confidence must be calibrated — don't return `1` unless you're certain. Add a fixture and a test.

## Adding an exporter

New exporters live under `src/exporters/`. The contract: take a `SpineModel` and return a string. No file I/O in the renderer — the orchestrator in `src/exporters/index.ts` handles writes. Add a test verifying non-empty output, stable content across identical inputs, and any invariants (e.g., "no rule traces leak into client-facing rationale").

## Releasing

### Why we're still on the alpha train

The core pipeline (brief → `spine.json` → exports) is stable, tested end-to-end, and dogfooded against this repo's own brief. Despite that, versions stay `0.9.x-alpha.N` on purpose: the CLI surface, template shape, and drift semantics can still move in response to real usage before 1.0.

The bar for cutting `1.0.0-beta` is external: agencies or dev-tool teams actively asking for stability guarantees. Until then, each alpha release is honest about what it is, and `@next` on npm keeps things explicit — no silent stability promises we haven't earned.

### Release flow

Tag push is the contract. [.github/workflows/release.yml](./.github/workflows/release.yml) installs, typechecks, tests, builds, verifies the tag matches `package.json`, publishes to npm with `--tag next`, and creates a GitHub Release with notes diffed from the previous tag.

From the maintainer's workstation:

1. Bump `package.json` `version` (e.g. `npm version prerelease --preid=alpha --no-git-tag-version`). `src/cli.ts` reads it at runtime — no second bump.
2. `npm run build` and verify `node dist/cli.js --version` prints the new value locally.
3. Commit as `vX.Y.Z-alpha.N: <short summary>` on a release branch, open a PR, squash-merge to `main`.
4. Tag the merge commit: `git tag vX.Y.Z-alpha.N && git push --tags`. The Action takes over from here.

Prefer patch bumps for polish-only changes. Keep breaking changes out of the alpha train or flag them in the PR description.

**Fallback (manual publish)** — if the Action is red or npm access needs to happen offline:

```bash
npm run typecheck && npm test && npm run build
npm publish --tag next
gh release create vX.Y.Z-alpha.N --prerelease --notes "…"
```

The `NPM_TOKEN` secret is the only credential the Action needs. Rotate when a maintainer leaves.

## Non-goals for contributions

- Making this "another AI coding tool." It isn't.
- Making it do everything. It's a context compiler.
- Replacing the design system tool. Consume its exports, don't become one.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
