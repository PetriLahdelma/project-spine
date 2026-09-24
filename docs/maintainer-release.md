# Maintainer release guide

Contributors do not need publishing access. This guide describes the current
[release workflow](../.github/workflows/release.yml) and its operational boundaries.
The 0.10 beta keeps room for changes to the learning schema and evaluation contract;
a stable release needs real external use and verified registry installation.

## Authentication and provenance

The release workflow is prepared for npm
[trusted publishing](https://docs.npmjs.com/trusted-publishers/). It runs on a
GitHub-hosted runner with Node 24, npm 11.20 and `id-token: write`; no `NPM_TOKEN`
is required for `npm publish`. npm accepts this only after a package owner creates
the matching trust relationship on npmjs.com:

- package: `project-spine`
- repository: `PetriLahdelma/project-spine`
- workflow file: `release.yml`
- GitHub environment: none
- permission: direct publish

That npm-side setting cannot be established or verified by repository code alone.
An OIDC-capable workflow is not proof that the package trust relationship exists.
The workflow uses npm 11.20 because trusted publishing requires npm 11.5.1 or
newer, and Node 24 exceeds npm's Node 22.14 minimum. Release dependency caches are
disabled as recommended by npm.

Trusted publishing handles `npm publish` and automatically generates provenance
for a public package from this public repository. The workflow keeps the explicit
`--provenance` flag so its intent remains visible. Copying that command into a
local terminal does not reproduce the GitHub OIDC identity or attestation.

OIDC does not authenticate `npm dist-tag add`. Publishing with `--tag beta` assigns
`beta` atomically. Promoting the same version to `next` is a separate maintainer
operation through the token-authenticated `npm dist-tags` workflow or an equivalent
manual command with a compatible granular token. Never move `latest` for a beta.

## Prepare and publish

1. Update `package.json` and its lockfile on a release branch. Use the appropriate
   prerelease version; `src/cli.ts` reads it from the package at runtime.
2. Run the [complete release gates](production-readiness.md), including the
   installed-tarball `stable:check`. Verify `node dist/cli.js --version` matches.
3. Review and merge the release PR after its relevant CI/security checks pass.
4. From a clean checkout of that exact merged commit, verify the version is not
   already published and the tag does not already exist. Set the version from
   the reviewed package, then create and push only its tag:

   ```sh
   SPINE_RELEASE_VERSION=$(node -p "require('./package.json').version")
   git tag -a "v$SPINE_RELEASE_VERSION" -m "Project Spine $SPINE_RELEASE_VERSION"
   git push origin "refs/tags/v$SPINE_RELEASE_VERSION"
   ```

5. Follow all three Release jobs. `package` creates the tested tarball, `publish`
   verifies or publishes that exact integrity, and `github-release` attaches the
   tarball and generated changelog. Do not equate a successful package job or
   GitHub prerelease with successful npm publication.
6. Verify the exact registry version, `beta` tag and provenance. Promote `next`
   separately when policy requires it. Then run the
   [post-publish smoke workflow](../.github/workflows/post-publish-smoke.yml) for
   that version if it did not run automatically. It verifies the exact installed
   version, the correction command and its execution-consent gate, the offline demo,
   and the original init/compile path. Keep `latest` unchanged for a beta.

Do not force-move a published version tag or reuse an npm version. Record why a
release was made and what was tested in the release commit/notes.

## Diagnose a failed publication

Read the exact failed step before retrying. A package-not-found response on upload
can be an access/configuration problem; it is not proof that the package name is
available. Check authentication and package access without printing credentials.
Fix the identified cause, then check whether the version was published despite a
later workflow failure before deciding how to resume. On retry, the workflow packs
the tagged commit again and compares its name, version and SHA-512 integrity with
the registry. A matching package skips the immutable publish operation; a mismatch
fails loudly. It never treats an arbitrary registry response as success.

After a successful publish, public registry metadata can lag. Release verification
and post-publish smoke share a bounded reader: up to 13 requests, 10 seconds apart,
with a 10-second timeout per request (at most 250 seconds). Preflight 404s still
return immediately; authentication errors and integrity mismatches still fail.
If visibility exceeds that window, inspect the exact version before retrying the
failed job. A matching immutable version is verified without publishing it again;
do not move the tag or replace the artifact.

The package job uploads the exact tested tarball as a workflow artifact before npm
authentication is attempted. The GitHub release job also attaches it even when npm
publication fails, and records that the registry was not verified. A GitHub asset
is not an npm provenance-attested registry publication. Install and smoke-test the
actual registry download before advertising npm availability.

## Changelog source of truth

Git tags and commit history are the machine source for
`scripts/generate-changelog.sh`; GitHub Releases are the canonical human view used
by the website. Every release run attaches `CHANGELOG.generated.md` and derives the
release body from that generated file. The committed `CHANGELOG.md` is a reviewed
snapshot and may be refreshed through a normal pull request, but the release job
does not rewrite or push it.

## Compatibility with protected main

The release workflow never commits or pushes to `main`. Generated release files
are workflow and GitHub Release artifacts, so PR-only branch protection needs no
bot bypass. Changes to the committed changelog still follow the normal reviewed PR
path.

CI provides stable aggregate checks named `gate` and `security-gate`; the compiler
drift workflow reports `drift`. Prefer these stable names over conditional farm or
matrix job names when choosing required checks. Keep publishing credentials and
release policy under maintainer control.
