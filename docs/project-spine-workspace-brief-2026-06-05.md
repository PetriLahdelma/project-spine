# Project Spine Workspace Brief - 2026-06-05

Purpose: compact onboarding artifact for product, design, engineering, and marketing work in the current Project Spine workspace.

## Snapshot

| Area | Current read | Evidence |
|---|---|---|
| Product | Project Spine is a repo-native context compiler: brief + repo + optional design inputs compile into agent instructions, summaries, QA guardrails, and scaffold plans. | `README.md`, `PRD.md` |
| Release state | The package is on the public beta train at `0.9.2-beta.1`. | `package.json`, `CHANGELOG.md` |
| Public promise | The OSS CLI remains the core product: MIT, npm-distributed, no account required, no implicit compile-path network calls. | `README.md`, `PRD.md`, `AGENTS.md` |
| Current repo state | `main` is aligned with `origin/main`; tracked files are clean. Untracked local paths are `.omx/` and `docs/demo/gallery/`. | `git status --short --branch` |
| Compiled warning | One unresolved warning remains: framework detection confidence is low because this repo is a Node library, not a web framework app. | `.project-spine/warnings.json` |

## Workstreams

| Workstream | Status | Notes |
|---|---|---|
| Stable readiness gate | Recently advanced | Recent project memory says `npm run stable:check` now verifies installed-package release invariants: routed OSS help, tarball exclusions, first-run timing, deterministic compile outputs, drift failure, drift diffs, and non-empty source pointers. |
| Agent discovery surfaces | Recently advanced | Recent commits and Gmail signals point to PR #57 and follow-up work around honest agent discovery surfaces for production readiness. |
| GA4 observability | Documented | Public stream metadata is documented at `.well-known/site-analytics.json`; reporting still requires private GA4 property ID and read-only Application Default Credentials. |
| Desktop companion | Private local surface | `apps/desktop` wraps the public CLI with Electron using whitelisted preload IPC. It is intentionally outside the root package `files` list. |
| Readiness polish | Still active | `ROADMAP.md` keeps remaining readiness work around CLI output polish, changelog polish, sample output refresh, audits, badges, release automation, and CHANGELOG generation. |

## Risks To Keep Visible

| Risk | Why it matters | Practical guardrail |
|---|---|---|
| Hosted-tier leakage | The product promise depends on the OSS CLI path staying clean and local-first. | Keep hosted/site/private surfaces out of the root npm package and routed CLI help. |
| Determinism regression | Drift detection and stable readiness depend on byte-identical outputs for identical inputs. | Run `npm run stable:check` before release claims. |
| Private analytics config exposure | Public GA stream IDs are safe, but property IDs and ADC paths are not repo data. | Keep GA4 private values in local MCP config or secret storage only. |
| Desktop scope creep | The desktop wrapper is useful but must not change the public CLI distribution contract. | Keep `apps/desktop` private and outside root package publish files. |
| Untracked local files | `.omx/` and `docs/demo/gallery/` may be agent state or generated media. | Inspect before staging; do not sweep into unrelated commits. |

## Next Actions

1. For engineering: use `npm run typecheck`, `npm test`, and `npm run stable:check` as the core confidence path before public release or stability claims.
2. For product and marketing: keep beta framing consistent with `package.json`, `CHANGELOG.md`, and the public site metadata.
3. For design and desktop work: validate the Electron companion as a private local UX without letting it redefine the OSS CLI contract.
4. For future agents: start from the LLM-wiki context packet, then read `README.md`, `ROADMAP.md`, `.project-spine/warnings.json`, `docs/ga4-observability.md`, and `apps/desktop/README.md`.

## Sources Used

- Local repo: `README.md`, `PRD.md`, `ROADMAP.md`, `package.json`, `CHANGELOG.md`, `.project-spine/warnings.json`, `docs/ga4-observability.md`, `apps/desktop/README.md`
- Local memory: `/Users/petrilahdelma/SAPDevelop/llm-wiki/wiki/tools/llm-wiki-context.mjs --project "ProjectSpine" --query "setup onboarding workspace brief ProjectSpine current goals risks"`
- Connected context: Google Drive search for `ProjectSpine` returned no matches; Slack returned a light ProjectSpine link signal; Gmail returned GitHub notification signals including PR #57.
