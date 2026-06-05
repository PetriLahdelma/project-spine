# Production readiness

Project Spine is still on the `0.9.x-beta` train, but release work should
behave like a production package: deterministic, evidence-backed, and easy to
smoke test after publication.

## Current release gate

Run this before a release branch or tag:

```bash
npm run typecheck
npm test
npm run build
npm run pack:check
npm run release:readiness
npm run stable:check
```

The `release:readiness` gate checks package metadata, published file allowlist,
CI/release/security workflows, provenance publishing, post-publish smoke tests,
and required public docs. It does not generate files.

The `stable:check` gate installs the packed package into a temporary project,
runs `spine init` and `spine compile`, then verifies the stable-release claims:
no hosted command leakage in help or the tarball, first package install/init/
compile under 30 seconds, byte-identical `spine.json` on identical inputs,
stable export hashes, drift failure on changed inputs, unified drift diffs for
hand-edited exports, and non-empty rule source pointers.

## Borrowed patterns

### Agnes

- Keep production-sensitive actions policy-gated before execution.
- Prefer local evidence trails over opaque hosted state.
- Add independent security release checks: high-severity npm audit and secret
  scanning.

Applied in Project Spine:

- Release security workflow runs `npm audit --audit-level=high` and gitleaks.
- Hosted/OAuth agent claims stay out of discovery metadata until real services
  exist.

### Aegis Design OS

- Treat readiness as a machine-checkable contract, not prose.
- Fail when generated artifacts or health reports are stale.
- Keep release posture visible through a small number of dimensions.

Applied in Project Spine:

- `npm run release:readiness` is a deterministic readiness contract.
- `npm run stable:check` turns the stable-release bar into an installed-package
  smoke test.
- CI and release workflows both run package-surface and readiness gates.

### DSharp DesignSystem

- Mirror local release hooks in CI.
- Require evidence before promoting artifacts to stable.
- Run packaging dry-runs as part of the release contract.

Applied in Project Spine:

- `npm run pack:check` remains the package-surface dry run.
- `prepublishOnly` runs typecheck, tests, build, pack check, and readiness.

### Rhythmguard

- Publish npm packages with provenance.
- Smoke-test the installed registry package after publish.
- Keep package exports narrow and explicit.

Applied in Project Spine:

- Tag releases publish with `npm publish --provenance --tag beta --access public`.
- Post-publish workflow installs `project-spine@<version>` from npm and runs
  `spine init` plus `spine compile`.

## Stable-release bar

Do not cut `1.0.0` until these are true:

- The beta package has at least one successful post-publish smoke run on the
  exact version to promote.
- CI, drift, security, site build, `pack:check`, `release:readiness`, and
  `stable:check` pass on the release commit.
- `spine --help` still lists only routed OSS commands.
- Recompiling identical inputs produces byte-identical `spine.json` and export
  hashes.
- `spine drift check --fail-on any` exits non-zero for changed inputs, and
  `spine drift diff` prints patches for hand-edited exports.
- No hosted-tier CLI paths or dormant private files ship in the npm tarball.
- npm provenance is present for the release package.

## Non-goals

- Do not add a heavy Agnes-style runtime database or DAG just to look mature.
- Do not port component-library Storybook checks from Aegis or DSharp into the
  compiler unless Project Spine starts shipping component artifacts.
- Do not publish OAuth issuer, A2A, or DNS-AID metadata until those capabilities
  are backed by real services or DNS records.
