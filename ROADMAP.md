# Roadmap

Living doc. Moves when reality moves — which is often. Ground truth for what's *shipped* is [/changelog](https://projectspine.dev/changelog); this file is what's *next*.

Priority bands:

- **P0** — positioning or correctness regressions. Anything here contradicts what the docs claim or ships in a visibly broken state. Ship this week.
- **P1** — trust surface. Things agencies hit in the first 30 seconds that damage or earn credibility.
- **P2** — product depth. Extends the moat.
- **P3** — DX, hygiene, and repo debt.

Each item lists **why**, **scope**, **done when**, and a rough **effort** (S / M / L). "Done when" is the verification anyone picking up the task can run to know they're finished.

---

## P0 — positioning regressions

### P0.1 · Strip hosted-tier commands from `spine --help`

**Why.** `spine --help` advertises `login / logout / whoami / workspace / publish / rationale` — all of which hit `cfg.auth?.token` against a hosted API that the OSS positioning explicitly calls dormant. An agency running `spine --help` as their first act sees "hosted workspace" five times in the descriptions and immediately distrusts the pitch.

**Scope.** Drop those six commands from the `subCommands` map in [`src/cli.ts`](./src/cli.ts). Keep the source files (they're small, and reviving the hosted tier shouldn't require rewriting them). Also strip the `--push`, `--workspace`, and `--project` flags from `spine drift check` in [`src/commands/drift.ts`](./src/commands/drift.ts), since they only make sense against a hosted fleet view. Update README's command list if it drifts.

**Done when.**

- `node dist/cli.js --help` prints 7 commands: `init`, `compile`, `inspect`, `export`, `template`, `explain`, `drift`.
- `node dist/cli.js drift check --help` doesn't mention `--push` / `--workspace` / `--project`.
- The hosted-tier source files still compile; tests still pass.

**Effort.** S (half day).

---

### P0.2 · Systemic CSP × inline-style audit

**Why.** The /changelog inline-style-divergence bug isn't a one-off. [`site/middleware.ts`](./site/middleware.ts) sets `style-src 'self' 'nonce-…' 'unsafe-inline'`. Per CSP Level 3, once a nonce is present, browsers ignore `'unsafe-inline'` — so every React `style={{…}}` attribute on SSR HTML gets dropped on first paint and only re-applied via the CSSOM after a SPA nav. 100+ occurrences across the site. The worst offender is [`site/app/global-error.tsx`](./site/app/global-error.tsx): the error page literally renders unstyled on hard refresh, which is exactly when users' trust is most fragile.

**Scope.** Pick one of two routes:

- **Route A (preferred):** move every inline `style={{…}}` into class selectors. Start with `global-error.tsx` and the `/invite`, `/device`, `/workspaces`, `/w/[slug]`, `/r/[publicSlug]` pages (they hit the auth/error paths where CSP bites hardest), then the remaining marketing pages. Class selectors aren't CSP-gated.
- **Route B:** drop the nonce from `style-src` and live with `'unsafe-inline'` only. Fewer changes, weaker CSP — only do this if the maintenance cost of Route A is proven intractable.

**Done when.**

- `curl <route>` followed by a `preview_eval` computed-style check on the same route via SPA nav returns identical `backgroundColor`, `padding`, `fontFamily` on every page under `site/app/`.
- `global-error.tsx` renders styled on a fresh-tab hard load (simulate via a `throw new Error` in a page component).

**Effort.** M (one focused day).

---

## P1 — trust surface

### P1.1 · Render release bodies as parsed markdown on /changelog

**Why.** Post P0.2, the changelog codeblock renders consistently, but the body is still raw markdown — `## What's new`, ` ```bash `, `[link](url)` all show as literal characters. `remark` + `remark-frontmatter` are already direct dependencies for the brief parser; adding `remark-html` (or `remark-rehype` + `rehype-stringify` for more control) is trivial.

**Scope.** Parse the GitHub release body server-side in [`site/app/(marketing)/changelog/page.tsx`](./site/app/(marketing)/changelog/page.tsx). Sanitize (rehype-sanitize) before rendering — release bodies are user content even if the "users" are us. Real code blocks get a nested class the global `pre code` rule can pick up. Remove the 30-line / 1400-char hard trim; keep the first H1 or first paragraph as a lede, let the rest expand behind a `<details>` if length matters.

**Done when.**

- No literal `##`, `` ` ``, or `[text](url)` glyphs on /changelog.
- Fenced ` ```bash ` blocks render as styled code blocks distinct from prose.
- Markdown links become real anchors.

**Effort.** S.

---

### P1.2 · `spine drift diff` — show what changed, not just that something did

**Why.** [`src/commands/drift.ts`](./src/commands/drift.ts) exposes `check` with pass/fail exit codes suitable for CI. The first question an agency wiring this into CI asks is "OK, but what drifted?" They shouldn't have to `git diff` the exports themselves.

**Scope.** Add `spine drift diff` next to `check`. Reuse the fingerprint manifest that's already built at compile time. Output grouped by kind (inputs vs exports vs missing) with a unified-diff for each changed export and a one-line summary for input changes. Support `--json` for CI consumption.

**Done when.**

- Flip a byte in `AGENTS.md`, run `spine drift diff`, see the exact line.
- Add a line to `brief.md`, run `spine drift diff`, see the input marked drifted with a pointer to the brief hash change.
- `spine drift diff --json | jq '.exports[0]'` returns a structured record.

**Effort.** M.

---

### P1.3 · Error pages render offline and report upstream

**Why.** After P0.2, [`site/app/global-error.tsx`](./site/app/global-error.tsx) renders correctly on hard refresh. Finish the job: the error page currently only `console.error`s, so production errors are invisible to the maintainer. Also dead-ends the user — no next step.

**Scope.** Wire a lightweight error reporter (Sentry free tier or a no-dep POST to an owned endpoint). Replace the current dead-end body with a link to the GitHub issues page and a copy-to-clipboard button for the error digest. No tracking scripts — keep the `no uninvited uploads` principle.

**Done when.**

- Triggering a `throw new Error('test')` in a page surfaces in the configured reporter within a minute.
- The error page shows the digest and a "Copy + open GitHub issue" button.

**Effort.** S.

---

### P1.4 · CLI first-run smoke test

**Why.** `src/commands/explain.test.ts` is the only command-level test. `compile`, `drift`, `init`, `inspect`, `export`, `template` have none. The compiler/analyzer/exporter *internals* are tested but the CLI adapter layer (arg parsing, error copy, exit codes, stdout shape) — the thing an agency actually touches — isn't.

**Scope.** Add a black-box suite under `src/commands/*.e2e.test.ts` that spawns the compiled CLI with `execa`. Per command, assert at minimum: help text shape, happy path (`spine init` + `spine compile` in tmpdir), obvious error path (missing brief, bad --targets value). Golden-file the 19 output filenames.

**Done when.**

- `npm test` grows from ~149 tests to ~180+.
- Every subcommand in the trimmed help list (post P0.1) has at least one happy-path and one error-path test.

**Effort.** M.

---

## P2 — product depth

### P2.1 · `spine tokens pull` — Figma Variables API bridge

**Why.** You ship `--tokens` import for DTCG / Tokens Studio. The next question design-adjacent agencies ask is "my design lead edits variables in Figma, how does my repo catch up?" They currently export manually. Closing that gap makes Spine a standing piece of their workflow, not a one-shot.

**Scope.** `spine tokens pull --file <figma-file-key>` hits the Figma Variables REST API (requires a PAT in `FIGMA_TOKEN`), writes a DTCG-shaped JSON to `.project-spine/tokens.json`. Document it in [`docs/tokens.md`](./docs/tokens.md). Stays opt-in (explicit flag + env var) — consistent with "no implicit network calls".

**Done when.**

- `spine tokens pull --file X` produces a DTCG file that `spine compile --tokens` accepts without manual edits.
- `docs/tokens.md` has a worked example.

**Effort.** M.

---

### P2.2 · Two more starter templates: `api-service` and `monorepo`

**Why.** Four templates today, all frontend-shaped. Agency work often starts with a Node/Go API backend or a Turborepo. `api-service` should contribute route-handler conventions, error-envelope shape, health-check requirements, and observability QA. `monorepo` should wire the existing pnpm/turbo/nx detection in [`src/analyzer/monorepo.test.ts`](./src/analyzer/monorepo.test.ts) into a template that understands multi-package briefs.

**Scope.** Add `templates/api-service/` and `templates/monorepo/`, each with `template.yaml`, `brief.md`, and optional `design-rules.md`. Add tests in `src/templates/templates.test.ts`. Update the README template table.

**Done when.**

- `spine template list` shows six templates.
- `spine init --template api-service` in an empty dir produces a usable brief.

**Effort.** M.

---

### P2.3 · Decide /docs: real docs site or deleted page

**Why.** [`site/app/(marketing)/docs/page.tsx`](./site/app/(marketing)/docs/page.tsx) is 149 lines of external GitHub pointers. Middle ground hurts discoverability more than either extreme.

**Scope.** Two options:

- **Expand.** Ship an actual MDX-rendered docs tree at `site/app/docs/[...slug]/` reading from `docs/*.md`, with anchor links and a sidebar.
- **Contract.** Delete the page; link directly to README + PRD + docs/ folder from the header. Update sitemap.

Pick one. Don't keep the pile of external-only links.

**Done when.**

- Either /docs renders real rendered docs with anchors, or /docs 404s and the header links to the GitHub file list.

**Effort.** M (expand) or S (contract).

---

## P3 — DX and hygiene

### P3.1 · Single source of truth for the version string

**Why.** [`src/cli.ts`](./src/cli.ts) hardcodes `"0.9.1-alpha.0"`, duplicated in [`package.json`](./package.json). [CONTRIBUTING.md](./CONTRIBUTING.md) now documents "bump both". That's fragile — the kind of thing that gets half-bumped on a late-night release.

**Scope.** Read the version from `package.json` in cli.ts via `createRequire` (or import via a build-step substitution). Drop step 1b from the CONTRIBUTING release flow.

**Done when.** Bumping `package.json` and running `node dist/cli.js --version` prints the new value with no other edits.

**Effort.** S.

---

### P3.2 · Repo hygiene pass

**Why.** Friction that trips every contributor.

**Scope.**

- Gitignore `.planning/` and `.claude/` (GSD state + local Claude Code settings — both user-local, both trip branch switches).
- Kill one of the two lockfiles (root vs `site/`). Next.js warns on every dev startup about the ambiguity.
- [`site/next-env.d.ts`](./site/next-env.d.ts) oscillates between `.next/types/...` and `.next/dev/types/...` depending on dev/build. Either add a `.gitattributes` `merge=ours` or restore it in a pre-commit hook.

**Done when.** `git status` on a fresh clone after `npm i && npm run dev` shows clean.

**Effort.** S.

---

### P3.3 · Drain the Dependabot queue

**Why.** [#10](https://github.com/PetriLahdelma/project-spine/pull/10) has been open since 2026-04-18. Trailing Dependabot PRs age into security debt; the longer they sit, the harder they are to review.

**Scope.** Review, run tests, merge or close with a reason.

**Done when.** No Dependabot PRs older than a week.

**Effort.** S.

---

## Post-P3 holding pen

Items worth tracking but not worth sequencing until the above lands:

- Accessibility audit pass with `axe-core` on every marketing route.
- Lighthouse run on the homepage and a follow-up pass if LCP > 2.5s.
- Hosted tier ("Spine Fleet"): only if agencies actually ask for drift dashboards across projects. Memory says the hosted tier is dormant; this line stays parked.
