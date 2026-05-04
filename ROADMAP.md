# Roadmap

Living doc. Moves when reality moves — which is often. Ground truth for what's *shipped* is [/changelog](https://projectspine.dev/changelog); this file is what's *next*.

Priority bands:

- **P0** — positioning or correctness regressions. Anything here contradicts what the docs claim or ships in a visibly broken state. Ship this week.
- **P1** — trust surface. Things agencies hit in the first 30 seconds that damage or earn credibility.
- **P2** — product depth. Extends the moat.
- **P3** — DX, hygiene, and repo debt.

Each item lists **why**, **scope**, **done when**, and a rough **effort** (S / M / L). "Done when" is the verification anyone picking up the task can run to know they're finished.

---

## Shipped

The first pass through the roadmap is done. Keeping the entries here (not deleted) so a reader can diff the plan against reality.

| Item | PR |
|---|---|
| P0.1 · Strip hosted-tier commands from `spine --help` | [#22](https://github.com/PetriLahdelma/project-spine/pull/22) |
| P0.2 · CSP × inline-style audit (realigned middleware to documented posture) | [#23](https://github.com/PetriLahdelma/project-spine/pull/23) |
| P1.1 · Render release bodies as parsed markdown on /changelog | [#24](https://github.com/PetriLahdelma/project-spine/pull/24) |
| P1.2 · `spine drift diff` — unified diffs for hand-edited exports | [#25](https://github.com/PetriLahdelma/project-spine/pull/25) |
| P1.3 · Error pages render offline and report upstream | [#26](https://github.com/PetriLahdelma/project-spine/pull/26) |
| P1.4 · CLI first-run smoke test (every routed command) | [#28](https://github.com/PetriLahdelma/project-spine/pull/28) |
| P2.1 · `spine tokens pull` — Figma Variables API bridge | [#33](https://github.com/PetriLahdelma/project-spine/pull/33) |
| P2.2 · Two more starter templates: `api-service` + `monorepo` | [#31](https://github.com/PetriLahdelma/project-spine/pull/31) |
| P2.3 · Contract /docs to a lean pointer list | [#32](https://github.com/PetriLahdelma/project-spine/pull/32) |
| P3.1 · Single source of truth for the version string | [#29](https://github.com/PetriLahdelma/project-spine/pull/29) |
| P3.2 · Repo hygiene pass (gitignore + turbopack root) | [#30](https://github.com/PetriLahdelma/project-spine/pull/30) |
| P3.3 · Drain the Dependabot queue (+ zod 4 migration) | [#27](https://github.com/PetriLahdelma/project-spine/pull/27) |

---

## Readiness pass (what's next)

Second round: polish the codebase and public surface so it lands as a best-in-class OSS example + clears the Product Hunt polish bar. No launch-channel work — memory says growth targets are polish bars, not launch directives, and this plan reads that way.

### R0.1 · Dogfood: compile Project Spine with itself

**Why.** The single most persuasive artefact the project can ship is the compiler running on its own source. Without it, the tool's own AGENTS.md lives in `.gitignore` and nobody evaluating Spine sees what it would produce on a devtool codebase.

**Scope.** Commit `docs/sample-output/project-spine/` with the full 19-file output set alongside the input brief. Move the existing flat snapshot into `docs/sample-output/saas-marketing/`. Top-level README indexes both.

**Done when.** Fresh clone → `ls docs/sample-output/project-spine/` shows the input brief and every generated artefact. README links out to it explicitly.

**Effort.** M.

### R0.2 · Error-path audit across the CLI

**Why.** Every `throw new Error(...)` in the routed CLI surface tested against one question: "when a first-time user hits this, do they know what to do next?" Four sites failed; all now end in an imperative verb or a `spine <command>` suggestion.

**Scope.** `drift check` missing-input messages → recovery command. `export --targets` unknown → lists valid. `tokens pull` HTTP errors → status-specific hint (401/403 → FIGMA_TOKEN scopes, 404 → file key / access, 429 → wait-retry). Plus five new tests locking the wording in.

**Done when.** Each fixed throw matched by a test; `grep -rn "throw new Error" src/` passes a rubric read-through.

**Effort.** S.

### R0.3 · Homepage + marketing front-door review

**Why.** Stale numbers and mixed preview/beta framing were the only real regressions on the public site. No layout rewrite, just unblocking the signals.

**Scope.** Terminal mock + "Eighteen files" headline → 19. JSON-LD `softwareVersion` → 0.9.2-beta.0. Hero eyebrow drops the point version. Sweep preview framing → `beta` on /about, /pricing, /privacy, and /terms.

**Done when.** No page claims "18 files" or preview status in contexts that describe the CLI.

**Effort.** S.

---

### R1.1 · CLI output polish pass across all 8 routed commands

**Why.** Output quality on first run is the compounding first-impression signal. Currently fine, not exceptional.

**Scope.** Walk every routed command's happy-path and error-path output. Verify ≤80 columns, graceful under `NO_COLOR`, ends on either a next-step hint or a deliberate blank line. Add a next-command hint after `spine compile` and `spine drift check clean`.

**Done when.** Each of the 8 commands reviewed; any new hints are tested.

**Effort.** M.

### R1.2 · /changelog post-mortem: rendered state + beta lede

**Why.** Markdown now parses. Need to look at the rendered result with a critical eye and add a short paragraph explaining what `-beta.N` means here so newcomers understand the version scheme.

**Scope.** Pass through the first five rendered release bodies on the live site. Tune `.changelog__body` spacing for long bodies. Add a small `<aside>` above the list: one paragraph on the beta tag.

**Done when.** All rendered releases read clean; beta framing above the list.

**Effort.** S.

### R1.3 · Sample output refresh

**Why.** The saas-marketing snapshot in `docs/sample-output/saas-marketing/` predates `--tokens` and the drift manifest. Refresh so it shows the modern feature set.

**Scope.** Regenerate with the current CLI. Consider also snapshotting one api-service and one monorepo example so the template → output mapping is concrete.

**Done when.** At least three snapshots under `docs/sample-output/`; each regeneratable from the committed brief.

**Effort.** S.

---

### R2.1 · Lighthouse + axe-core on marketing routes

**Why.** First impression = LCP + no axe violations.

**Scope.** Local `npm run audit:site` script that builds, serves, and runs Lighthouse + axe on /, /product, /docs, /changelog, /pricing, /security. Fix whatever it flags. Targets: LCP < 2.0s mobile, CLS < 0.1, a11y 100, zero axe violations.

**Done when.** Script exists, passes on all listed routes.

**Effort.** M.

### R2.2 · Trust badges on README

**Why.** Velocity and adoption signals are missing from the badge row. Current set covers CI / license / Node / TS / status / PRs-welcome; missing `npm version`, `weekly downloads`, `install size`.

**Scope.** Add the three shields.io badges. No Twitter/Discord/social — consistent with the no-hype posture.

**Done when.** Badge row shows 9 badges on GitHub's README view.

**Effort.** S.

### R2.3 · Star history link

**Why.** Zero-effort social proof that ages well.

**Scope.** Static link to star-history.com in a small `## Stars` section at the end of README.

**Done when.** Link renders on GitHub with an embedded preview image.

**Effort.** XS.

---

### R3.1 · Document the beta release decision in CONTRIBUTING

**Why.** Public launch should not understate readiness. Beta train continues; `1.0.0` waits until there is a clearer signal that agencies are leaning on Spine in real projects.

**Scope.** One paragraph in CONTRIBUTING explaining the versioning posture: beta while the API can still move, bump to 1.0 only when external users ask for stability guarantees. No marketing copy in the repo about "the 1.0".

**Done when.** CONTRIBUTING release section has a one-paragraph "why this is beta" note.

**Effort.** XS.

### R3.2 · GitHub Actions release automation

**Why.** Manual `npm publish` is fine today but forgettable. Automate so tagging is the release contract.

**Scope.** Workflow on `v*` tag push: install → typecheck → test → build → `npm publish --tag beta` → create GitHub Release with notes from the commits since the previous tag. Manual path stays documented as fallback.

**Done when.** Pushing `v0.9.2-beta.0` publishes to npm and creates a draft GitHub Release.

**Effort.** M.

### R3.3 · CHANGELOG.md generation

**Why.** npm consumers expect a committed CHANGELOG; /changelog pulls from GitHub Releases. Keep both: Releases is the source of truth, CHANGELOG.md is a generated mirror so `npm view project-spine` has it.

**Scope.** `release-please` or a hand-rolled script that regenerates CHANGELOG.md on every tag.

**Done when.** CHANGELOG.md exists and updates automatically with each release.

**Effort.** S.

### R3.4 · Postinstall hint

**Why.** Low-cost delight for first-time users.

**Scope.** Tiny `postinstall` that prints one line on *global* installs only: `Run \`spine init\` to scaffold your first brief.` Skip if it adds noise on transitive installs (unit test during the spike).

**Done when.** Global install shows the hint; local / transitive installs are silent.

**Effort.** XS.

---

## Holding pen

Items tracked but not scheduled — added when a concrete trigger arrives.

- Hosted tier ("Spine Fleet"): only if agencies actively ask for drift dashboards across projects. Memory says hosted tier is dormant; this line stays parked.
- Multi-mode support in `spine tokens pull` (light/dark theme sets). Needs a theme-set representation on the compile side first.
- Additional templates (mobile app, Electron, API gateway patterns) — driven by real usage, not speculation.
- Push to Figma: `spine tokens push` back to Figma Variables. Scoped to *read* only until someone asks.
