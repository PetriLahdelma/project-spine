# Maintainer release guide

Contributors do not need publishing access. This guide describes the current
[release workflow](../.github/workflows/release.yml) and its operational boundaries.
The 0.10 beta keeps room for changes to the learning schema and evaluation contract;
a stable release needs real external use and verified registry installation.

## Authentication and provenance

The current workflow requires the repository secret `NPM_TOKEN`, supplied to npm
as `NODE_AUTH_TOKEN`. A secret existing on GitHub does not prove it has permission
to publish this package. Verify the npm account's package access and the token's
package scope, expiry, publishing permissions and applicable 2FA policy.

Use npm's current [granular token guidance](https://docs.npmjs.com/about-access-tokens/)
and [token creation instructions](https://docs.npmjs.com/creating-and-viewing-access-tokens/).
Legacy classic/Automation tokens are no longer supported. Do not copy a token into
source, issues, PR descriptions, logs or chat. Store credentials only through the
repository's secret-management interface or approved tooling.

[Trusted publishing](https://docs.npmjs.com/trusted-publishers/) is the preferred
future direction for avoiding a stored publishing token. It is not configured by
this guide: it requires an authorized npm-side trust relationship and coordinated
workflow changes, including removing the current mandatory-token check. Do not
claim it is enabled merely because the workflow has `id-token: write`.

The workflow publishes with `--provenance` from GitHub Actions. Provenance needs a
supported build environment; copying that command into an ordinary local terminal
does not reproduce a CI attestation. Follow [npm's provenance requirements](https://docs.npmjs.com/generating-provenance-statements/).

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

5. Follow the Release workflow through publication, dist-tag updates, changelog
   handling and GitHub Release creation. Do not equate a successful build with a
   successful publication.
6. Verify the exact registry version, `beta`/`next` tags and provenance, and run the
   [post-publish smoke workflow](../.github/workflows/post-publish-smoke.yml) for
   that version if it did not run automatically. It exercises the demo plus the
   original init/compile path. Keep the stable `latest` tag unchanged for a beta.

Do not force-move a published version tag or reuse an npm version. Record why a
release was made and what was tested in the release commit/notes.

## Diagnose a failed publication

Read the exact failed step before retrying. A package-not-found response on upload
can be an access/configuration problem; it is not proof that the package name is
available. Check authentication and package access without printing credentials.
Fix the identified cause, then check whether the version was published despite a
later workflow failure before deciding how to resume. Blindly rerunning an npm
publish after a partial success will not repair downstream changelog/release steps.

GitHub prereleases may provide a tested package tarball while registry access is
being repaired. Label the distribution accurately: a GitHub artifact is not an npm
provenance-attested registry publication. Install and smoke-test the actual public
download before advertising it. The registry and GitHub release can have different
availability; consult their live state rather than assuming they match.

## Compatibility with protected main

The current workflow's **Commit CHANGELOG.md back to main** step pushes directly
to `main` *after* publishing to npm. Requiring PRs/status checks for every main
update can reject that push, leaving a published package with an unfinished workflow.

Before enabling PR-only protection, change this step to a reviewed changelog PR or
remove the direct write and publish the generated changelog as a release artifact.
Do not solve the mismatch by silently granting broad bot bypass permissions. This
guide documents the dependency; it does not change branch settings or release behavior.

CI provides stable aggregate checks named `gate` and `security-gate`; the compiler
drift workflow reports `drift`. Prefer these stable names over conditional farm or
matrix job names when choosing required checks. Keep publishing credentials and
release policy under maintainer control.
