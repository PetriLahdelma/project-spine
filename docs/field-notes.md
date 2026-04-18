# Field notes — dogfood runs on real OSS repos

Honest log of what worked and what didn't when running Project Spine against third-party codebases. Updated on each pass.

## 2026-04-18 — first dogfood pass

Two repos, cloned fresh (`--depth 1`), run against the v0.2 CLI (commit `b21ef0d`).

### 1. [steven-tey/precedent](https://github.com/steven-tey/precedent) — single-app Next.js SaaS starter

Detection (all correct):
- framework: `next` (1.0)
- routing: `next-app-router`
- styling: `tailwind`
- language: TypeScript strict
- package manager: pnpm

Compile with a synthetic 5-section brief + `saas-marketing` template: **18 files generated, hash `16ee2266674b131f`, 2 warnings**.

The AGENTS.md is genuinely useful:
- Names the actual detected conventions (Next app router, Tailwind-only, pnpm-only, TS strict).
- Template contributions land as real advice (server components by default, no client-only JS above the fold, no third-party tracking without review).
- Warnings call out what's missing (assumptions section in brief).

**Verdict:** this is the happy path. A human reviewer would keep this file.

### 2. [shadcn-ui/ui](https://github.com/shadcn-ui/ui) — monorepo (pnpm workspaces)

Detection at the repo root:
- framework: **`node-app` (0.4 confidence)** — wrong. Actual framework is Next.js, but it lives in `apps/www/`.
- routing: `none`
- styling: `tailwind` (detected via root-level tailwind config — correct)
- language: TypeScript strict
- package manager: pnpm

**Root cause:** the analyzer reads `package.json` at the repo root, which for workspace monorepos has no framework dependency — the framework is inside an `apps/*` or `packages/*` subdirectory. We have no awareness of workspaces.

**Verdict:** unusable for monorepos without pointing `--repo` at a specific workspace. Silent-enough failure that the user might not realize the compile is missing half the truth.

## Follow-ups

| Gap | Severity | Fix |
|---|---|---|
| No monorepo / workspace awareness | medium | Detect `workspaces` in root `package.json` (and `pnpm-workspace.yaml`); emit a `monorepo-detected` warning pointing the user to pick a specific workspace with `--repo ./apps/www`. _Landed in v0.2.1._ |
| No auto-selection of workspace | low | Later: `spine inspect --auto-workspace` picks the most-starred / most-recent workspace. Deferred. |
| No Figma token JSON import | low | Not surfaced yet in dogfood; deferred to v0.3. |

## What this pass confirmed

- **Single-app repos compile cleanly** and produce files a senior engineer would keep. This is the core value prop and it works.
- **Template contributions land correctly** — the `saas-marketing` template's rules show up in the AGENTS.md alongside detected conventions, not in a separate block.
- **Source traceability holds** — every rule in `spine.json` carries a pointer back to brief / template / inference. Easy to audit why a rule exists.
- **Warnings with suggestions are actually useful** — `spine explain` produces a clean "here's the fix" output.

## What this pass revealed

- **Monorepo support is a real gap.** Any serious frontend team above ~5 engineers is on a pnpm / turbo / nx workspace. We can't claim "works on real repos" until we handle this gracefully.
- **Confidence scoring saves us.** The 0.4 confidence on shadcn correctly flagged the detection as suspect. The warning text could be sharper.
