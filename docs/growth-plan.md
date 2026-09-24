# From useful corrections to a community

The ambition is 10,000 GitHub stars. The operating goal is narrower: external
maintainers keep using Project Spine because it preserves useful corrections.
Stars are an outcome, not a release acceptance test or a promised forecast.

## Baseline — September 24, 2026

GitHub reported 2 stars, 0 forks, and 11 repository views from 8 unique visitors
over September 10–23. The five contributor issues had no comments. These are
pre-launch observations, not proof the new product failed. Downloads and clones
include automation and are not counted as users. Website conversion and retained
repository usage have not been measured.

## First audience and workflow

Start with maintainers reviewing agent-written changes in Node/TypeScript projects.
The first executable-check pilot accepts dependency-free Node built-in tests. It
does not promise arbitrary TypeScript builds, Vitest/Jest environments, inferred
test oracles, or autonomous review understanding.

The desired loop is a reviewed correction, a reusable check, historical verification,
CI enforcement and relevant agent guidance. The pilot captures a maintainer-approved
test from a fixed commit. Automatic suggestions remain future work and must retain
human review and independent verification.

## Milestones and decision gates

| Phase | Deliverable | Evidence needed before expanding |
| --- | --- | --- |
| Release access | Installable beta, clean-machine demo, protected-main-compatible release | Registry install smoke succeeds; package and source agree |
| First five maintainers | Onboard five external repositories with permission | Four complete a useful case with minimal help; median first result under ten minutes |
| Repeat use | Follow up after two and four weeks | Three of the first five still retain and use the check after two weeks; report four-week outcomes honestly |
| Proof | Three reproducible real corrections with attribution and counterexamples | Maintainer permission, known limitations, working commands and raw result artifacts |
| Public launch | Technical walkthrough, short demonstration and launch post | Reliable installation and case studies ready; support capacity available |
| Ecosystem | Contributor-maintained cases and demanded runner integrations | External contributions and repeat recommendations, not just star spikes |

These thresholds are proposed operating decisions, not measured outcomes. If a gate
fails, fix the observed friction before adding languages, a desktop feature set,
hosted accounts or dashboards. Revisit the audience if maintainers do not find the
workflow worth repeating.

## Pilot record

Keep private contact details outside this repository. Ask permission before naming
a participant or linking a private project. A consented, redacted record should use:

- Repository alias or approved public URL; maintainer versus internal dogfood.
- CLI version, OS, runtime image digest, test runner and onboarding date.
- Start/end of first attempt, assistance required, success or exact blocker.
- Check accepted/rejected and why; false positives and benign counterexamples.
- Two-week and four-week follow-up date and outcome: retained, removed, unknown.
- Consent for a public case study; source license and attribution.

Count distinct external repositories, not executions. Report eligible denominators
and unknown follow-ups. A four-week cohort is not mature until four weeks have
elapsed. Do not silently collect CLI telemetry or upload repository contents.

## Case-study standard

Publish the original correction, explicit broken/fixed SHAs, permission/license,
reviewed test, file closure, runtime digest, reproduction commands, results and
limitations. Include a valid alternative implementation and a mutation that should
fail. Label synthetic examples as synthetic. Test harness results are not measured
agent improvements or evidence of security completeness.

Agent comparisons need independent held-out tasks, a fixed model/configuration,
the same verifier in both conditions, repeated trials, failed trials, latency and
actual provider usage before any cost claim. Do not publish only successful runs.

## Distribution sequence

1. Ask existing contacts whether they want help preserving one real correction.
   Do not mass-open issues or send unsolicited automated pitches.
2. With permission, publish each useful case and its reproducible artifact.
3. Demonstrate one correction-to-check flow in a short recording. Keep the result,
   command and limitation visible; do not simulate a real customer.
4. Submit a technical launch where community rules permit it. Lead with the actual
   result and limitations, not a star target. Request feedback, not reciprocal stars.
5. Propose integrations only after users show the need. Contribute useful examples
   upstream before claiming any partnership.

Maintainer cadence: triage pilot blockers before feature requests, respond to first
contributions within two working days when possible, and publish a weekly factual
progress note during an active pilot. This document does not schedule automation
or authorize external messages on its own.

## Star checkpoints

First 100: dependable trial and five external maintainers. Toward 1,000: public
cases and repeat usage. Toward 3,000: contributor-owned adapters/cases. Toward
10,000: a recognizable workflow and sustained distribution of useful evidence.
These are directional checkpoints, not causal predictions or deadlines.
