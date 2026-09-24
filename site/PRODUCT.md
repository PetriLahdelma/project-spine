# Project Spine website product contract

The website presents Project Spine as a local repository-learning tool for maintainers who build with coding agents.

The primary job is to move a visitor from a familiar failure — a useful correction trapped in code review — to a concrete local trial. The flagship workflow is:

1. Capture explicit evidence from a local JSON case or requested GitHub review metadata.
2. Propose a deterministic `require-text` or `forbid-text` rule scoped by file globs.
3. Replay the rule against recorded broken and corrected Git commits without checking out either commit or rerunning an agent.
4. Enforce verified rules in CI and serve file-relevant context through CLI and MCP.
5. Generate a local HTML report for review.

The separate correction pilot preserves executable proof when a literal rule is
insufficient. It captures user-reviewed, dependency-free JavaScript built-in test
bytes plus an explicit source closure from a fixed commit. Verification transplants
those recorded bytes onto the broken and fixed revisions and runs them in a
digest-pinned Docker image with no network, a read-only root filesystem, a non-root
user, and bounded resources. Execution requires explicit consent. Current-tree
checks revalidate the same controls.

Captured correction context is labelled candidate until controlled execution fails
on the broken revision and passes on the fixed revision. The pilot does not infer or
generate tests, repair failing tests, claim general bug prevention, or publish an
agent-outcome benchmark. Its first slice is dependency-free JavaScript using
`node:test`.

An optional evaluation path can run a configured agent or evaluator with
`spine evaluate <case-id> --adapter adapter.json --allow-execution --runs 1 --json`.
Evaluation is separate from historical replay: it executes the provided adapter
inside temporary clones, has no OS sandbox, and may use the network, call models,
or incur provider costs.

The current learning workflow is the v0.10 beta. The primary quickstart selects the exact published npm beta and runs the Docker-free literal demo. The public command, version, literal demo, correction demo, registry install, and downloaded GitHub asset digest were checked before activation. It requires Node 22.12+ and Git; the install uses the network, while the demo needs no account or model key. The versioned GitHub Release asset and checksum remain available as a secondary reproducibility reference.

The site must not claim repository immunity, guaranteed prevention, autonomous semantic rule or test inference, real external case studies, adoption figures, benchmark results, cost savings, or a hosted fleet product. A passing replay means that a literal rule failed on a recorded broken commit and passed on a recorded correction. A verified correction means the recorded test failed and passed under the documented execution controls; it does not establish broader correctness.

Existing compile, drift, templates, token, and export capabilities remain visible as supported secondary workflows.

Primary conversion: run the one-command npm beta literal demo. Secondary conversions: verify the versioned GitHub Release asset, use the contributor source build, inspect GitHub, read the product boundaries, propose a correction pilot through `.github/ISSUE_TEMPLATE/learning_case.md`, open an issue, and join a technical discussion.

## Release promotion note

The primary quickstart targets the exact published npm selector
`project-spine@0.10.0-beta.3`. The matching `v0.10.0-beta.3` GitHub Release asset
and SHA-256 remain a secondary verification path. The npm `latest` and `next`
tags are not the beta selector and must not replace the exact version in production
copy. Production copy must continue distinguishing historical replay from executable
evaluation and illustrative preview from measured results.
