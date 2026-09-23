# Project Spine website product contract

The website presents Project Spine as a local repository-learning tool for maintainers who build with coding agents.

The primary job is to move a visitor from a familiar failure — a useful correction trapped in code review — to a concrete local trial. The flagship workflow is:

1. Capture explicit evidence from a local JSON case or requested GitHub review metadata.
2. Propose a deterministic `require-text` or `forbid-text` rule scoped by file globs.
3. Replay the rule against recorded broken and corrected Git commits without checking out either commit or rerunning an agent.
4. Enforce verified rules in CI and serve file-relevant context through CLI and MCP.
5. Generate a local HTML report for review.

An optional evaluation path can run a configured agent or evaluator with
`spine evaluate <case-id> --adapter adapter.json --allow-execution --runs 1 --json`.
Evaluation is separate from historical replay: it executes the provided adapter
inside temporary clones, has no OS sandbox, and may use the network, call models,
or incur provider costs.

The current learning workflow is described as the forthcoming v0.10 beta and evaluated through a source build. The published npm beta is clearly identified as the earlier compile-first product until a matching release exists.

The site must not claim repository immunity, guaranteed prevention, autonomous semantic rule inference, agent reruns, adoption figures, benchmark results, cost savings, or a hosted fleet product. A passing replay means that a literal rule failed on a recorded broken commit and passed on a recorded correction.

Existing compile, drift, templates, token, and export capabilities remain visible as supported secondary workflows.

Primary conversion: run the source build and local demo. Secondary conversions: inspect GitHub, read the product boundaries, open an issue, and join a technical discussion.

## Release promotion note

While the preview pull request is pending, every source-build command must clone
`--branch feat/repository-learning`. Remove the branch flag from the homepage,
docs, agent-discovery documents, WebMCP response, and install component as part
of merging the feature to the default branch or publishing the matching beta.
