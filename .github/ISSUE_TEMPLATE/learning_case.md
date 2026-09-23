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

## Proposed rule

Include a version-1 failure-case JSON, scope, exact literal, and why this condition
distinguishes the broken and corrected versions.

## Counterexample

What valid change must this rule allow? What failures cannot it detect?

## Evidence

Attach `spine replay <case-id> --json`, `spine guard --json` and the CLI version.
If sharing an agent evaluation, include adapter, model version, run count and
failures as well as successes. Label simulations clearly.
