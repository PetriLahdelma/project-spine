# Security policy

## Reporting a vulnerability

If you find a security issue in Project Spine, please report it privately:

- **Email:** petri.lahdelma@gmail.com
- **GitHub:** use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repo.

Please do **not** open a public issue for a suspected vulnerability.

## What to include

- A clear description of the issue and its impact.
- Steps to reproduce, ideally with a minimal example.
- The version of the CLI (`spine --version`) and your Node version.
- Any PoC code or output.

## What to expect

- Acknowledgement within 72 hours.
- An initial assessment within 7 days.
- A coordinated disclosure timeline agreed with you.

## Security posture

Project Spine is designed to minimize exposure:

- **No implicit network calls.** The CLI reads your repo and writes files locally. LLM enrichment, when it lands, is opt-in and requires an explicit API key in your environment.
- **Secrets scrubber.** Any content sent to an LLM is scanned for obvious secrets (`.env` contents, common key patterns) and redacted. Don't rely on this as your only line of defense.
- **No automatic uploads.** The spine model and exports stay on disk. There is no "send to the cloud" button.

If you suspect Project Spine is doing something it shouldn't, you can audit the compile pipeline in `src/compiler/compile.ts`. The phases 1–3 are deterministic and network-free by design.

## Supported versions

This project is pre-1.0. Security fixes will be shipped against the latest minor. Older versions are not patched.
