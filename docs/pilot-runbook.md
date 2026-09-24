# Five-maintainer correction pilot

Use this runbook for the first five permissioned external repositories. The goal
is to learn whether a maintainer can preserve one useful correction, not to produce
a testimonial or inflate execution counts. Do not contact people who have not
opted in, and do not describe an invited or incomplete trial as participation.

## Before the session

Confirm the maintainer controls the repository or has permission to share the
selected correction. Agree what may be recorded and whether the repository may be
named. Keep contact details, private URLs, source, command output and the local
pilot record outside the Project Spine repository unless the maintainer explicitly
approves publication. Remove secrets and private data before sharing any artifact.

The target repository needs Git history containing the known broken and corrected
commits, Node 22.12+ (or Node 24), local Unix-socket Docker on Linux or macOS, and
one dependency-free JavaScript `node:test` committed with the correction. Read the
[correction guide](corrections.md) with the maintainer before execution; in
particular, agree on the exact source-file closure and review the pinned image.

## Run one correction

Start the timer immediately before the first command. Pin the published version;
the unqualified npm `latest` tag still points to an older release.

```sh
npx --yes --package=project-spine@0.10.0-beta.3 spine --version

SPINE_CHECK_IMAGE='node@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32'
docker pull "$SPINE_CHECK_IMAGE"
```

The network is used to install the package and pull the image. `capture` reads Git
objects and writes a new case file but does not execute repository code. Replace
every illustrative value below with evidence reviewed by the maintainer:

```sh
npx --yes --package=project-spine@0.10.0-beta.3 spine correction capture \
  --id reviewed-correction \
  --title 'Preserve the reviewed behavior' \
  --lesson 'Describe the narrow lesson that future changes should retain.' \
  --broken BROKEN_COMMIT \
  --fixed FIXED_COMMIT \
  --image "$SPINE_CHECK_IMAGE" \
  --test test/reviewed-correction.test.mjs \
  --files-json '["src/affected-file.mjs"]' \
  --out reviewed-correction.correction.json
```

Stop before execution. The maintainer reviews the captured test, source list,
commits, lesson, image digest and generated case. Proceed only with explicit consent.
`verify` and `check` execute the captured test in restricted local Docker containers:

```sh
npx --yes --package=project-spine@0.10.0-beta.3 spine correction verify \
  --case reviewed-correction.correction.json --allow-execution --json

npx --yes --package=project-spine@0.10.0-beta.3 spine correction check \
  --case reviewed-correction.correction.json --allow-execution --json

npx --yes --package=project-spine@0.10.0-beta.3 spine correction context \
  --case reviewed-correction.correction.json \
  --files-json '["src/affected-file.mjs"]'
```

Stop the timer when the maintainer can inspect the first useful result: either a
valid broken/fixed verification or an exact actionable blocker. Record assistance
as observed; do not subtract setup or troubleshooting time. Keep the ordinary test
in normal CI. If the check is retained, the [correction guide](corrections.md)
describes CI use and the execution boundary.

## Local record template

Create one private Markdown record per repository outside this repository. Leave
unobserved fields as `unknown`; never infer a favorable result.

```markdown
# Project Spine pilot record

- Repository alias or approved public URL:
- External maintainer or internal dogfood:
- Permission to run: yes/no, date, scope
- Permission to name/publish: yes/no/unknown
- Project Spine version: 0.10.0-beta.3
- OS and Node version:
- Runtime image digest:
- Onboarding date:
- Timer start / first useful result / elapsed minutes:
- Assistance provided:
- Result: completed / blocked / withdrew
- Exact blocker, if any:
- Case accepted for continued use: yes/no/unknown
- Maintainer's reason:
- Benign alternative result:
- Recurrence result:
- False positives or limitations:
- Redacted artifact locations:
- Two-week follow-up due / outcome: retained / removed / unknown
- Four-week follow-up due / outcome: retained / removed / unknown
- Public case-study consent, source license and attribution:
```

## Follow up and report

At two weeks, ask whether the check remains in the repository and has been used
again. At four weeks, ask the same question and record removal, friction or changes.
No response is `unknown`, not retained. Do not add telemetry or upload repository
contents to fill a missing follow-up.

Report distinct external repositories with explicit denominators, for example
`3 retained / 5 enrolled; 1 removed; 1 unknown`. Separately report completion
(`completed / enrolled`), median time to first useful result among completed trials,
assistance, blockers and withdrawals. A cohort has no four-week result until four
weeks have elapsed. The decision gates and case-study evidence requirements remain
canonical in the [growth plan](growth-plan.md); launch language remains constrained
by the [launch kit](launch-notes.md).
