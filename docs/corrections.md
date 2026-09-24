# Preserve a reviewed regression test

`spine correction` captures a reviewer-approved test from a corrected Git commit,
runs that same test against the broken and corrected code, and checks the current
working tree without letting edits replace the captured test. It preserves a
correction's test, source and lesson together.

This is an executable-check pilot alongside the existing literal
[`learn` / `replay` / `guard` workflow](learning.md). It does **not** infer which
commit is broken, generate an assertion from a review, or measure agent performance.

## First try

The fastest Docker-free introduction is the literal replay demo from the exact
published beta. The install uses the network and requires Node 22.12+ (or Node 24)
and Git. It needs no account or model key. The version is pinned because npm's
unqualified `latest` tag still points to `0.9.2-beta.2`.

```sh
npx --yes --package=project-spine@0.10.0-beta.3 spine demo
```

For reproducibility or registry-independent installation, the identical
[GitHub Release asset](https://github.com/PetriLahdelma/project-spine/releases/download/v0.10.0-beta.3/project-spine-0.10.0-beta.3.tgz)
has SHA-256 `ff0d733988e87cd0ee75029eea4599fd214c171896a3a40862d89b87928770a1`.

The executable pilot targets Linux and macOS with a local Unix-socket Docker
daemon (including Docker Desktop). Native Windows Docker contexts are not yet
supported by this new path; the existing CLI workflows are unchanged.
Docker must be running locally. Review and explicitly pull the runtime once; Spine
does not download an image or install dependencies during a check. This example
pins the official Node 22 Alpine image used for the pilot's verification:

```sh
SPINE_CHECK_IMAGE='node@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32'
docker pull "$SPINE_CHECK_IMAGE"
npx --yes \
  --package=project-spine@0.10.0-beta.3 \
  spine correction demo --image "$SPINE_CHECK_IMAGE" --allow-execution
```

The demo is **synthetic**. It creates a new Git repository containing a tenant
filter bug, its correction and a behavioral test. It is not a customer case study,
an AI-agent benchmark or a security guarantee. Keep the printed fixture directory
to inspect or experiment with it. The original `spine demo` remains available for
a faster, Docker-free demonstration of literal replay.

Contributors who need a persistent checkout can build the maintained source:

```sh
git clone https://github.com/PetriLahdelma/project-spine.git
cd project-spine
npm ci
npm run build
node dist/cli.js demo
```

## Use a correction from your repository

Start with an already-reviewed, dependency-free JavaScript `node:test` file in the
fixed commit. Prefer `.mjs` and `node:assert/strict`. The first version has no npm
installation, package-script, transpiler, custom-loader or arbitrary-command path.
It does not run a project's Vitest or Jest configuration. Extract a small public
reproduction when the full application needs services or third-party dependencies.

Identify the actual broken and fixed commits yourself. A pull request's base/head
pair does not automatically establish that relationship. List the exact source
files the test imports, including any necessary package metadata. The test path
must not also be a source path.

From the target repository, using a built/installed `spine` executable:

```sh
spine correction capture \
  --id tenant-boundary \
  --title 'Keep invoice reads inside the requested tenant' \
  --lesson 'Filter invoices by the requested tenant before returning them.' \
  --broken broken-commit \
  --fixed corrected-commit \
  --image "$SPINE_CHECK_IMAGE" \
  --test test/invoices.test.mjs \
  --files-json '["src/invoices.mjs"]' \
  --out tenant-boundary.correction.json
```

Replace the two illustrative commit names and paths with your reviewed evidence.
`--from-pr https://github.com/owner/repository/pull/123` can record provenance; it
does not fetch a PR, infer revisions, or certify the supplied test. Capture resolves
the refs to immutable SHAs, saves the fixed test and its hash, and executes no
repository code. Review the resulting JSON and original test before proceeding.
Titles, lessons and file paths must be single-line text without terminal control
or directional-override characters. Spaces, commas and ordinary Unicode text are
supported; control-bearing content cannot impersonate a verification status.

```sh
spine correction verify --case tenant-boundary.correction.json --allow-execution --json
spine correction check --case tenant-boundary.correction.json --allow-execution --json
spine correction context --case tenant-boundary.correction.json --files-json '["src/invoices.mjs"]'
```

`verify` requires the captured test to fail an assertion on broken code and pass
on fixed code. `check` reruns those historical controls before testing a fresh
snapshot of current source files. The case and historical commits must remain
available, including in CI. A changed working-tree test does not replace the test
stored in the case.

No-execution `context` returns **candidate** guidance. A successful verification
or check report carries currently verified historical guidance and provenance.
Reports are observations, not signed credentials: editing a saved green report
does not authorize future checks. Read the current result as well as its controls;
historically verified guidance is not proof that the current code passes.

Reports fingerprint the exact source and captured-test bytes in each snapshot.
Per-file hashes and an aggregate snapshot hash distinguish the current observation
from its historical controls. A different, valid implementation can pass while
producing a different current snapshot hash. No-execution context with no matching
source files returns no lesson.

## Execution boundary

Every executable invocation requires `--allow-execution`. Spine uses a fresh
bounded snapshot and a digest-pinned, already-local Docker image. Containers have
no network, a read-only snapshot/root filesystem, a non-root user, dropped Linux
capabilities and resource/time/output bounds. The caller's checkout, home directory,
credentials and Docker socket are not mounted into the container. Local Docker is
required; remote execution is not a way to upload source silently.

Run Spine as a non-root host user. Containers use that numeric UID/GID so temporary
source and harness directories can remain private to the caller. Images declaring
writable volumes are rejected. Git and Docker executables must resolve outside the
target repository and its dependency directories; repository-local wrappers and
relative PATH entries are rejected rather than executed on the host.
Git object reads disable lazy fetching, replacement refs and credential prompts.
Fetch the required history explicitly before capture; missing historical objects
must fail locally rather than trigger a hidden network request.

Missing imports, syntax errors, zero/skipped tests, timeouts and container failures
are not evidence that a regression was reproduced. Inspect failures and fix the
harness or case; do not turn infrastructure failure into a passing negative control.

The test, selected source, container runtime and image still need review. Container
isolation reduces host exposure; it does not prove semantic correctness against
deliberately malicious JavaScript or protect against every kernel/runtime defect.
Use a disposable machine or VM for hostile code. A narrow test can miss other bugs.

This execution boundary differs from [`spine evaluate`](evaluation.md), whose
explicitly configured agent/evaluator programs execute on the host in temporary
clones and can incur model costs. Correction checks do not call models.

## Keep the ordinary test

Do not replace your test suite with Spine. Keep the reviewed test in normal CI.
Spine adds a portable historical control, immutable reviewed test material and
file-scoped guidance. It earns its place only if those help your review workflow.

For CI, check out full history, install the verified Spine release, explicitly pull
the reviewed image and run `spine correction check --case ... --allow-execution`.
Do not add repository secrets to that job. The existing root Project Spine Guard
Action remains a **literal-rule** guard; it does not silently execute corrections.

## Help test the pilot

Bring a real correction, a benign alternative that should pass and a recurrence
that should fail through the [case issue form](https://github.com/PetriLahdelma/project-spine/issues/new?template=learning_case.md).
Include permission, attribution, CLI version, image digest, commands, raw results
after secret review and any onboarding friction. Negative results are useful.
See the [pilot gates](growth-plan.md) before making adoption or benchmark claims.
Maintainers running permissioned trials should use the
[five-maintainer pilot runbook](pilot-runbook.md) so timing, assistance and
follow-up outcomes are recorded consistently without collecting telemetry.
