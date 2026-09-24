# Correction pilot launch kit

Status: draft. Do not publish this as a validated adoption story. Confirm the
release installation, replace source-build instructions only with verified package
commands, and attach a real recording before submitting it to a community.

## Technical introduction

**Project Spine: preserve a reviewed regression test and prove its history**

A useful correction can disappear into a pull-request discussion. Project Spine's
correction pilot keeps the reviewed test, broken/fixed commits, runtime and lesson
together. It runs the same test against the old failure, the fix and later source
changes. Editing the working-tree test does not replace the captured check.

The first version is deliberately small: dependency-free JavaScript `node:test`,
explicit file lists and opt-in local Docker execution with no network. It neither
generates assertions automatically nor replaces your normal tests. The existing
literal guardrails and context compiler remain available without Docker.

The included tenant-filter example is synthetic. We are looking for maintainers
willing to try one real correction and tell us where setup or verification fails.
The question is whether keeping the historical proof and lesson alongside an
ordinary test is worth the extra step. Negative findings are welcome.

- Source: <https://github.com/PetriLahdelma/project-spine>
- Quickstart: <https://github.com/PetriLahdelma/project-spine/blob/main/docs/corrections.md>
- Submit a case: <https://github.com/PetriLahdelma/project-spine/issues/new?template=learning_case.md>

## Recording script

Keep a terminal and the relevant source visible. Record actual commands/output;
do not animate fictional execution or splice a failure into a successful run.

1. Label the fixture synthetic and show the tenant-filter mistake.
2. Show the corrected code and reviewed behavioral assertion.
3. Run the documented correction demo with explicit container consent.
4. Show the failed broken control and successful fixed/current controls.
5. Reintroduce the original source bug in the disposable fixture and run `check`.
6. Show the nonzero result, then restore the fixture. Explain that historical
   verification is not a guarantee against all future bugs or malicious tests.

Keep installation and the one-time image pull in the written quickstart. State the
tested CLI version and image digest beside the recording.

## Permission-based pilot invitation

Use only with an existing contact or a maintainer who has opted in:

> I'm testing a small open-source workflow that preserves a reviewed regression
> test and checks it against the broken commit, the fix and later changes. Do you
> have a correction you already wanted to keep as a test? I'd like to help try one
> case and learn whether the historical proof is useful. No account or model key
> is needed. We would only publish your code or feedback with your permission.

## Launch gate

- [ ] Public package/artifact installed and demo exercised on a clean machine.
- [ ] CLI and runtime requirements match the actual release.
- [ ] Recording contains actual output and labels synthetic data.
- [ ] At least three permissioned real case studies before claiming real-world proof.
- [ ] Support/issue triage capacity for the launch window.
- [ ] Destination community's current submission/promotion rules checked.

Stars, customer logos, testimonials and measured agent improvements must not be
added without evidence. No outreach or community submission is automated by this
file. Follow the [growth plan](growth-plan.md) and report pilot denominators.
