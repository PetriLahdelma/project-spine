# Contributing to Project Spine

Help a repository retain the lessons from a reviewed failure. Contributions can
be code, clearer instructions, reproducible failure cases, test coverage or useful
counterexamples. You do not need a model subscription, npm publishing access or
production credentials to work on the core project.

The current product records maintainer-authored literal rules, verifies them
against broken/corrected Git revisions, checks later changes and serves scoped
context to agents. The optional evaluator runs explicitly configured programs.
Read the [learning guide](docs/learning.md) and [evaluation contract](docs/evaluation.md)
for the boundaries; the original compiler specification in PRD.md is historical.

The [executable correction pilot](docs/corrections.md) is separate: it preserves a
reviewer-approved Node built-in test and runs it in restricted Docker containers
against historical and current source. No model account is required. Start with a
real correction you can share, or a counterexample that exposes a brittle check;
see the [pilot goals and measurement rules](docs/growth-plan.md).

## Choose a starting point

| Task | Starting point |
| --- | --- |
| Explain guard outcomes with runnable examples | [#87](https://github.com/PetriLahdelma/project-spine/issues/87) — good first issue |
| Add focused HTML-report tests | [#88](https://github.com/PetriLahdelma/project-spine/issues/88) — good first issue |
| Ship an offline evaluation-adapter example | [#89](https://github.com/PetriLahdelma/project-spine/issues/89) |
| Preserve comma-containing filenames in CLI/MCP | [#90](https://github.com/PetriLahdelma/project-spine/issues/90) |
| Verify Windows process-tree termination | [#91](https://github.com/PetriLahdelma/project-spine/issues/91) |

Check whether an issue is still open before starting; comment with your intended
approach so others can coordinate. You can also browse current
[good first issues](https://github.com/PetriLahdelma/project-spine/labels/good%20first%20issue)
and [help wanted](https://github.com/PetriLahdelma/project-spine/labels/help%20wanted).
Questions and documentation corrections are welcome. Small fixes can go directly
to a pull request; discuss schema changes, new rule types, dependencies or execution
policy changes in an issue first.

## Run the product locally

Prerequisites for development: **Node.js 22.12+ or Node 24**, npm and Git. Vitest 5
requires the newer Node 22 minor; `.nvmrc` selects the current 22.x release. CI
exercises Node 22 and 24 on Linux. The published CLI's runtime floor remains Node
22.0. GitHub CLI (`gh`) is needed only for explicit PR evidence import.
Windows-specific evaluation behavior is still being expanded; include your OS
and Node/Git versions when reporting a platform problem.

For a contribution, fork the repository on GitHub and clone your fork. To try the
maintained source first:

```sh
git clone https://github.com/PetriLahdelma/project-spine.git
cd project-spine
npm ci
npm run build
node dist/cli.js demo
```

The demo needs no account or network after installation. It creates a disposable
Git fixture, verifies a reviewed correction, catches a reintroduced defect, and
prints an HTML report path. Its data is synthetic. To use a chosen directory,
pass `demo --out ./my-demo`; the directory must not already exist.

Contributor setup uses the source checkout. Do not assume the npm beta and GitHub
release have the same version: check the [release notes](https://github.com/PetriLahdelma/project-spine/releases).
No publishing credentials should be added to a contributor's environment or PR.

## Find the relevant code

| Area | Files |
| --- | --- |
| Failure-case schema and evidence storage | [src/learning/model.ts](src/learning/model.ts), [storage.ts](src/learning/storage.ts) |
| Historical replay, guard, context and HTML reports | [src/learning/engine.ts](src/learning/engine.ts) |
| Configured-agent evaluation and controls | [src/evaluation/](src/evaluation/) |
| Executable correction capture and container controls | [src/corrections/](src/corrections/), [correction quickstart](docs/corrections.md) |
| GitHub PR evidence import | [src/github/](src/github/) |
| CLI commands and offline demo | [src/commands/learning.ts](src/commands/learning.ts), [src/demo.ts](src/demo.ts) |
| Agent tools and public library exports | [src/mcp/](src/mcp/), [src/index.ts](src/index.ts) |
| Existing context compiler | [src/compiler/](src/compiler/), [src/analyzer/](src/analyzer/), [src/exporters/](src/exporters/) |
| Starter templates | [templates/](templates/), [src/templates/](src/templates/) |
| Marketing site | [site/app/](site/app/), [site/DESIGN.md](site/DESIGN.md) |
| Optional desktop wrapper | [apps/desktop/](apps/desktop/) |

## Contribute a failure case or adapter

A useful case includes the observed failure, source attribution, explicit broken
and corrected revisions, a narrowly scoped rule, and a valid counterexample that
the rule must allow. Use the [case template](https://github.com/PetriLahdelma/project-spine/issues/new?template=learning_case.md)
or adapt a temporary-repository fixture from [the learning tests](src/learning/learning.test.ts).
Include permission/license information for external code. Remove private data and
secrets; label synthetic examples as synthetic. Do not commit a nested `.git` directory.

Cases stay inactive until deterministic replay succeeds. New tests should prove
both the original failure and the correction, plus missing/deleted-file and false
positive behavior where relevant. A literal match is not a security or semantic
correctness guarantee. Do not present it as one.

For an evaluation adapter, document its executable/argument arrays, environment
requirements, outcome verifier, cleanup and possible provider costs. Start with an
offline fixture from [the evaluation tests](src/evaluation/evaluate.test.ts). Keep
the evaluator independent of edits the agent makes, preserve explicit execution
opt-in, and never make CI require a paid model account. Negative results are useful:
report failures and limitations alongside successful runs.

## Verify your change

For runtime code, run the relevant tests while iterating, then the root checks:

```sh
npm test -- src/learning/learning.test.ts
# Or: npm test -- src/evaluation/evaluate.test.ts
# Or: npm test -- src/commands/learning-e2e.test.ts src/mcp/server.test.ts
npm run typecheck
npm test
npm run build
```

The test harness builds the CLI when necessary. Tests that invoke Git use
temporary repositories; keep fixtures isolated from the contributor's checkout.

The executable correction tests are opt-in. On Linux/macOS with local Docker,
explicitly pull the reviewed image from the [correction guide](docs/corrections.md),
then run them serially so container-cleanup assertions are not competing with
another correction run:

```sh
SPINE_DOCKER_TEST=1 npm test -- --maxWorkers=1 src/corrections src/correction-demo.test.ts
node --test .github/scripts/release-registry-state.test.mjs
```

Do not run another Spine correction command during that container suite. It
includes a real 30-second timeout case. The default unit suite does not run Docker;
CI has a separate disposable hosted-runner job for these controls.

For packaging, exports or release scripts, also run:

```sh
npm run pack:check
npm run release:readiness
npm run stable:check
```

`stable:check` installs the package tarball into a temporary project and exercises
both the learning demo and original compiler/drift workflow. It needs registry
access to install dependencies. Documentation-only changes need valid links and
tested commands, not artificial unit tests.

The site and desktop have separate lockfiles. From the repository root:

All three projects use TypeScript 7. The site explicitly uses Next's TypeScript CLI
integration, including generated route validation. TypeScript 7.0 does not expose
the legacy compiler API; editor-only Next language-service plugin diagnostics are
not covered by these build checks. No TypeScript 6 compatibility package is bundled.

```sh
# Site
npm --prefix site ci
npm --prefix site run typecheck
npm --prefix site run build
npm --prefix site run start -- --port 3000
```

With that server running, use another terminal for
`node site/scripts/check-marketing-routes.mjs`. Check changed UI at desktop/mobile
widths, keyboard navigation, focus and reduced motion. Follow [site/DESIGN.md](site/DESIGN.md).
Use a production build for performance measurements; report observed results rather
than invented scores. Accessibility changes should not introduce new axe violations.

```sh
# Desktop build/contract checks (no GUI launch required)
npm --prefix apps/desktop ci
npm --prefix apps/desktop run verify
```

For manual desktop use, build the root CLI first, then run
`npm --prefix apps/desktop start`. Report GUI testing separately from build checks.

## Keep the change reviewable

- Keep one concern per PR and reuse existing dependencies and helpers.
- Use strict TypeScript; validate untrusted input with `unknown` and narrowing.
- Keep `@types/node` on major 22 while Node 22 is the minimum supported runtime.
  Newer type majors can allow APIs unavailable to consumers. Dependabot continues
  compatible type updates; revisit the major only when the runtime policy changes.
- Preserve immutable cases, honest source pointers, path boundaries, bounded reads,
  missing-coverage failures and the distinction between replay and execution.
- Keep deterministic compiler/export output stable for identical inputs.
- Network access and executing repository/agent programs must remain explicit.
- Never put credentials, private incident data or fabricated benchmark claims in a PR.

For an existing compiler extension, add a focused fixture alongside its current
tests. Templates live in `templates/<name>/template.yaml` with a `brief.md` and
optional `design-rules.md`; test contributions in [templates.test.ts](src/templates/templates.test.ts).
Exporters render a model to text; filesystem writes belong to their orchestrator.

## Submit your pull request

Push a topic branch to your fork and open a PR against `main`. Link the issue,
explain the user-visible change and why it helps, list the commands you ran, and
state anything not tested. Include before/after images for visual changes and
sample output for CLI/report changes. Call out schema, hash, exit-code or generated
output changes so maintainers can assess compatibility.

Commit subjects explain why the change is needed. Native Git trailers can record
constraints and verification; for example:

```text
Keep guard outcomes understandable on the first run

Add a disposable walkthrough showing the difference between a violation and
missing coverage, using output from the built CLI.

Confidence: high
Scope-risk: narrow
Tested: All documented commands on Node 22
Not-tested: Windows
```

AI-assisted contributions are welcome when the submitter understands and verifies
the change. Include reproducible evidence, review the diff, and do not submit
unvalidated generated code or examples as if they were observed results.

Release credentials, tags and publishing are maintainer responsibilities. See
[the maintainer release guide](docs/maintainer-release.md) and
[production readiness](docs/production-readiness.md).

Follow the [code of conduct](CODE_OF_CONDUCT.md). Report security vulnerabilities
privately using [SECURITY.md](SECURITY.md), not a public issue.
