---
name: Learning case
about: Propose a reproducible failure and a guardrail that catches it
title: '[case] '
labels: ''
assignees: ''
---

## Observed failure

What happened, and where is the correction or review evidence?

## Reproduction

Provide a public minimal repository or fixture with explicit broken and corrected
commit SHAs. Remove credentials, private data and proprietary source.

## Reviewed check or proposed rule

For an executable correction, include a dependency-free `node:test` regression
test from the corrected commit and the exact source files it needs. Explain the
behavior being asserted. Do not include installation scripts or credentials.

For a literal guardrail, include a version-1 failure-case JSON, scope, exact
literal, and why it distinguishes the broken and corrected versions.

## Permission and attribution

Is this a real correction or a synthetic fixture? Link the source license and
confirm you can share the code and review. Do not name private users or projects
without their permission. A minimal public reproduction is welcome.

## Counterexample

What valid change must this rule allow? What failures cannot it detect?

## Evidence

Attach the relevant replay/check JSON and CLI version. For executable checks,
include the reviewed case and container image digest; for literal checks use
`spine replay <case-id> --json` and `spine guard --json`.
If sharing an agent evaluation, include adapter, model version, run count and
failures as well as successes. Label simulations clearly.

## Pilot feedback (optional)

How long did the first useful result take? What assistance was needed? Would you
keep this check in CI, and may the maintainer follow up here in two weeks?
