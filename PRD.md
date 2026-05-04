# Project Spine — Product Requirements Document

**Status:** v0.1 draft
**Author:** Petri Lahdelma
**Last updated:** 2026-04-18
**Target:** CLI-first MVP (v0.1), hosted workspace (v0.4+)

---

## 0. One-line

Project Spine turns a brief, repo, and design inputs into a machine-readable project operating layer so humans and coding agents can build with less ambiguity, less drift, and less rework.

**Positioning sentence:** The missing context layer between client strategy, design systems, codebases, and coding agents.

---

## 1. Executive summary

Developers in 2025–2026 are not blocked by typing speed. They are blocked by fragmented context. Briefs live in docs, design intent lives in Figma, conventions live in code, acceptance criteria live in people's heads, and AI agents see only slices of the truth.

Project Spine is a **context compiler**. It ingests a client brief, an existing or starter repo, and optional design-system inputs, then compiles them into a repo-native, versionable operating layer:

- Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`)
- Architecture summary and repo conventions
- UX and accessibility acceptance criteria
- Scaffold plan, route inventory, component plan
- QA guardrails and definition of done
- Sprint-1 backlog seeds
- Drift detection between brief, design intent, and code reality

**Wedge:** agencies and solo builders doing repeatable client delivery who already use Claude Code / Copilot / Cursor and feel kickoff pain immediately.

**Why now:** AI is saving developers real time (Atlassian 2025: 68% save 10+ hrs/week) but those gains are cancelled out by fragmented context (50% still lose 10+ hrs/week to org inefficiencies); only **5% of repositories contain AI configuration files** today (arXiv 2025); and GitHub's Agentic Workflows (technical preview, Feb 2026) has just legitimized repo-native, Markdown-authored agent pipelines — making "compiled context in your repo" a native story, not a weird one.

---

## 2. Problem statement

### 2.1 The pattern teams keep repeating

A typical project starts with:

1. A loose brief in Notion, email, or Slack.
2. Scattered product assumptions nobody has written down.
3. A Figma file with implied rules (spacing, states, a11y) nobody has extracted.
4. A repo with undocumented conventions, drift between folders, and ambiguous ownership.
5. An AI agent that gets a shallow prompt and produces plausible but wrong output.

The result is predictable: weak scaffolding, inconsistent implementation, repeated clarification loops, handoff drift, and rework.

### 2.2 What the evidence says

- **Developers save time with AI but lose it elsewhere.** Atlassian's 2025 State of Developer Experience Report surveyed 3,500 developers and managers. 99% report time savings from AI. 68% save more than 10 hours a week. But 50% lose **10 or more hours a week** to organizational inefficiencies, and 90% lose 6+ hours. Top time-wasters: finding information, adapting to new technology, and context switching between tools. ([Atlassian 2025](https://www.atlassian.com/teams/software-development/state-of-developer-experience-2025), [IT Pro summary](https://www.itpro.com/software/development/atlassian-says-ai-has-created-an-unexpected-paradox-for-software-developers-theyre-saving-over-10-hours-a-week-but-theyre-still-overworked-and-losing-an-equal-amount-of-time-due-to-organizational-inefficiencies))

- **AI trust is eroding, not improving.** Stack Overflow's 2025 Developer Survey (49,000+ respondents) found positive AI sentiment dropped from 70%+ in 2023–2024 to 60% in 2025. 46% actively distrust AI accuracy; only 3% "highly trust" it. 87% are concerned about accuracy; 81% are concerned about security/privacy. The top reasons developers reject AI tools: (1) security/privacy, (2) pricing, (3) better alternatives. "Lack of AI" ranks last. 45% specifically complain that **debugging AI-generated code is time-consuming**. ([Stack Overflow blog](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/), [press release](https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/))

- **AI configuration is not a solved problem.** An October 2025 study cited across the context-engineering literature found that **only 5% of repositories contain AI configuration files** ([arXiv survey](https://arxiv.org/html/2510.21413v1)). AGENTS.md adoption is accelerating (60k+ OSS projects per [agents.md](https://agents.md/)) but practitioners consistently report drift pain: *"Keeping AGENTS.md files in sync is the annoying part, and if you use more than one tool, things drift fast"* ([kau.sh](https://kau.sh/blog/agents-md/)). *"For AI agents that read documentation on every request, stale information actively poisons the context"* ([Packmind](https://packmind.com/evaluate-context-ai-coding-agent/)). Addy Osmani published [*"Stop Using /init for AGENTS.md"*](https://medium.com/@addyosmani/stop-using-init-for-agents-md-3086a333f380) in March 2026 arguing auto-generated context files are actively worse than nothing.

- **Design systems are maturing technically but not organizationally.** Zeroheight's 2025 Design Systems Report shows design token adoption jumped from 56% (2024) to 84% (2025). But the report flags communication, resource shortages, and buy-in as the unresolved blockers — not tooling. ([Zeroheight 2025](https://zeroheight.com/how-we-document/), [Web Designer Depot summary](https://webdesignerdepot.com/zeroheight-releases-its-design-systems-report-2025/)). Translation: teams have the tokens, but not the translation layer from system to project execution.

- **Kickoff inefficiency is measurable.** Agency-focused writing consistently describes manual kickoffs costing "two to five business days before a single scoped task is assigned," with broken handoff chains, inconsistent setup quality, and forgotten documents ([Lowcode Agency](https://www.lowcode.agency/blog/project-kickoff-workflow-automation)).

### 2.3 The gap

No existing tool sits at the seam where this fails: **brief + repo + design intent → compiled, repo-native, drift-aware operating layer.** Code generators don't know the brief. PM tools don't touch the repo. Design-system docs don't produce agent instructions. Instruction-file generators (`/init`) produce generic boilerplate that practitioners actively warn against.

Project Spine fills that gap.

---

## 3. Market timing

Three concurrent shifts make this the right moment.

**Shift 1 — AI productivity is real but offset by context friction.** The Atlassian paradox (save 10, lose 10) means the next productivity lever is not "more AI." It's making the AI's context correct and keeping it correct.

**Shift 2 — Rules files have become infrastructure.** AGENTS.md is now an open convention across 60k+ projects. Claude Code reads `CLAUDE.md`, Copilot reads `.github/copilot-instructions.md`, Cursor reads `.cursor/rules/`, Codex reads `AGENTS.md`. The Martin Fowler piece "Context Engineering for Coding Agents" and the Stack Overflow Blog's March 2026 post "Building shared coding guidelines for AI (and people too)" ([link](https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/)) explicitly frame governed context as a team discipline, not a prompt hack.

**Shift 3 — GitHub is legitimizing repo-native agent pipelines.** [GitHub Agentic Workflows](https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/) entered technical preview on 2026-02-13. Workflows are authored in Markdown under `.github/workflows/`, compiled to Actions, run read-only by default with pre-approved "safe outputs." This is the exact substrate Project Spine's drift checks and compiled guardrails should plug into.

The combined effect: the idea "your project's operating context should live in your repo, be machine-readable, be diffable, and be kept in sync by a tool" has gone from niche to expected within 12 months.

---

## 4. Target users

### 4.1 Primary ICP (beachhead)

**Digital agencies and consultancies** (2–30 person, frontend-heavy, client-delivery focused) who:

- Run 3+ new client projects per year.
- Already use Claude Code, Cursor, Copilot, or similar.
- Have internal starter stacks and design-system fragments, but no consolidated kickoff layer.
- Feel real cost in repeated kickoff setup, inconsistent handoffs, and rework.

**Why them first:** immediate ROI per project, reusable templates compound, willingness to pay, founder-market fit (Petri's own delivery work is ICP zero).

### 4.2 Secondary users

- **Solo builders / indie founders** using AI tools on side projects.
- **Frontend leads at SaaS startups** introducing agent-assisted workflows.
- **Design-system teams** who want their rules to actually land in implementation.
- **Technical founders / fractional CTOs** standardizing delivery across engagements.

### 4.3 User personas

- **Ayla, agency partner.** Runs a 6-person studio. Starts 8–12 client projects a year. Spends the first week of every project rebuilding conventions. Wants consistent kickoff, reusable templates, a rationale doc for clients.
- **Marco, solo founder.** Ships 3–4 side projects a year. Uses Claude Code daily. Wastes hours fighting the model when his conventions drift. Wants one command to produce trustworthy `CLAUDE.md` and a route inventory.
- **Sanne, frontend lead.** Enterprise SaaS, 20-person frontend org. Design system exists but nobody uses it consistently. Wants UX/a11y rules compiled into PR guardrails and instruction files her team and agents both follow.

### 4.4 Non-users

- Teams without design-aware frontend work. (Pure backend infra, ML research.)
- Teams without AI coding tool adoption. (The value compounds with agents; without agents, a subset still applies.)
- Greenfield "vibe coders" who don't want structure — not the ICP.

---

## 5. Product principles

1. **Repo-native first.** Outputs live in files teams can version, diff, and trust. No proprietary dashboard-as-source-of-truth.
2. **Useful without AI.** If the outputs only help agents, the product is weak. A human reviewer should keep the files.
3. **Opinionated, not magical.** Good defaults, transparent reasoning, no black-box behavior. No "AI generated" tone in outputs.
4. **Fast path to value.** First run produces something a developer would actually commit, in under 5 minutes.
5. **Drift-aware from day one.** Generation is cheap; staying aligned is the moat.
6. **Deterministic before enriched.** Repo analysis and structural rules are deterministic. LLM calls enrich, never replace, the pipeline. The tool works offline with degraded but useful output.
7. **Security by default.** No secrets exfiltrated, no uninvited network calls, no implicit repo uploads. Matches the top rejection reason from the 2025 Stack Overflow survey.

---

## 6. MVP scope

### 6.1 In scope (v0.1)

- Brief ingestion (Markdown + YAML frontmatter)
- Repo analysis (stack detection, conventions, structure)
- Spine model compilation (deterministic JSON)
- Instruction file generation (AGENTS.md, CLAUDE.md, copilot-instructions.md)
- Architecture summary, route inventory, component plan (Markdown)
- QA guardrails and definition-of-done starter
- Sprint-1 backlog seeds
- Warnings for ambiguous, missing, or conflicting inputs
- Optional design-rules input (Markdown)
- CLI distribution via npm

### 6.2 Out of scope (MVP)

- Autonomous implementation / code generation
- Full PM system
- Direct Figma file parsing (accepts exported tokens/notes only)
- Codebase refactoring engine
- Live IDE assistant / LSP
- Jira/Linear live sync
- Hosted workspace / multi-tenant SaaS
- White-label templating

### 6.3 Non-goals (forever)

- Be "another AI coding tool." Project Spine's job is context, not generation.
- Own the brief-writing UX. Accept any reasonable Markdown; don't force a form.
- Replace the design system tool. Consume its exports; don't become one.

---

## 7. Feature specification

### 7.1 Brief ingestion

**Input formats:** `.md`, `.txt`, `.yaml` + Markdown body.

**Function:**

- Normalize headings to canonical sections (goals, audience, constraints, assumptions, risks, success criteria).
- Extract explicit goals, constraints, assumptions, risks.
- Classify project type (marketing site, app dashboard, docs portal, design-system repo, extension, other).
- Detect missing critical fields and emit warnings.

**Output:** `.project-spine/brief.normalized.json` + `brief-summary.md`.

**Acceptance criteria:**

- Parses a 200–1000 word messy brief into structured fields with ≥80% field-fill accuracy on a labeled test set of 10 hand-written briefs.
- Produces a readable Markdown summary with sections for goals, constraints, risks, assumptions.
- Never silently invents facts; missing fields appear as explicit `null` with a warning.

### 7.2 Repo analysis

**Input:** path to a local repo (existing codebase or starter scaffold).

**Detect:**

- Framework (Next.js, Remix, Astro, Vite+React, SvelteKit, Nuxt, plain Node, etc.)
- Package manager (npm, pnpm, yarn, bun)
- Routing approach (file-based vs. config-based, app dir vs. pages dir, etc.)
- Testing setup (Vitest, Jest, Playwright, Storybook test-runner)
- Linting/formatting (ESLint, Biome, Prettier, Oxlint)
- Type system (TypeScript strictness, Zod/valibot/ts-pattern usage)
- Storybook presence and version
- Component folder conventions
- Token/theme/CSS-in-JS approach (Tailwind, CSS Modules, vanilla-extract, Panda, tokens JSON)
- CI files (GitHub Actions, CircleCI)
- Existing agent files (AGENTS.md, CLAUDE.md, .cursor/rules, .github/copilot-instructions.md)

**Output:**

- `.project-spine/repo-profile.json` — structured detection output with confidence scores.
- `architecture-summary.md` — human-readable summary.

**Acceptance criteria:**

- Correctly identifies stack and routing on 9/10 common modern web repos in the test corpus.
- Detection confidence is surfaced; low-confidence detections appear as warnings, not assertions.
- Never hallucinates framework conventions the repo doesn't actually use.

### 7.3 Rules compiler

**Function:** merges brief + repo-profile + optional design-rules input into a unified canonical model.

**Output:** `.project-spine/spine.json` — the canonical, diffable project spine.

**Schema (abridged):**

```json
{
  "metadata": { "name": "", "version": "", "createdAt": "", "hash": "" },
  "projectType": "",
  "goals": [],
  "nonGoals": [],
  "audience": [],
  "constraints": [],
  "assumptions": [],
  "risks": [],
  "stack": { "framework": "", "language": "", "packageManager": "" },
  "repoConventions": [],
  "designRules": [],
  "uxRules": [],
  "a11yRules": [],
  "componentGuidance": [],
  "qaGuardrails": [],
  "agentInstructions": {
    "dosAndDonts": [],
    "unsafeActions": [],
    "filePlacement": [],
    "responseExpectations": []
  },
  "scaffoldPlan": { "routes": [], "components": [], "sprint1": [] },
  "warnings": []
}
```

**Acceptance criteria:**

- Deterministic: identical inputs produce identical `spine.json` (modulo timestamps).
- Conflicts between inputs surface in `warnings[]` with pointers to both sources.
- Schema is versioned; `metadata.version` is honored by downstream exporters.

### 7.4 Instruction generator

**Outputs:**

- `AGENTS.md` (per [agents.md](https://agents.md/) convention)
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- Optional: `.cursor/rules/*.mdc` (per-rule files)

**Content (shared across targets, adapted per tool's convention):**

- Project purpose (1 paragraph from brief.goals).
- Stack summary (from repo-profile).
- Repo conventions (file placement, naming, imports).
- UX/component/accessibility rules.
- QA expectations (what to run, what "done" means).
- Unsafe actions to avoid (e.g., "never modify `src/generated/`", "never add a new dependency without flagging").
- Response expectations for agents (e.g., "prefer small diffs", "always show the test command you ran").

**Acceptance criteria:**

- Files are readable standalone (human reviewer would keep them).
- Content references actual detected conventions, not generic boilerplate.
- Each file under ~150 lines by default (following the HumanLayer / Builder.io guidance that lean files outperform sprawling ones).
- Includes an `@import` block for targets that support it (Claude Code) to reference deeper rule docs.

### 7.5 Scaffold planner

**Outputs:**

- `scaffold-plan.md`
- `route-inventory.md` (inferred or proposed from brief + stack)
- `component-plan.md`
- `sprint-1-backlog.md`

**Content:**

- Route suggestions with rationale (mapped back to brief.goals).
- Component buckets (layout, primitives, feature-specific) keyed to existing repo structure.
- Documentation needs, QA setup needs, risk hotspots.
- Sprint-1 backlog: 5–12 items, each with a title, acceptance criteria, and a goal-link.

**Acceptance criteria:**

- Items are concrete, not "add auth" style fluff.
- Does not invent features not implied by the brief.
- Every item traces back to `spine.json.goals[].id`.

### 7.6 QA guardrails

**Output:** `qa-guardrails.md`.

**Content:**

- Accessibility checks (keyboard, focus, contrast, landmark structure, form labeling, motion-reduced).
- State coverage (loading, empty, error, partial, offline) for page-level surfaces.
- Visual regression suggestions.
- Lint/test commands (detected from repo or proposed).
- Definition of done starter (5–10 checks).

**Acceptance criteria:**

- Every check is actionable (has a command, a location, or a pattern).
- No generic "test everything" fluff.

### 7.7 Warnings & ambiguity surfacing

**Purpose:** the product's trust layer. Every output includes a `warnings` block when detection was uncertain or inputs conflicted.

**Examples:**

- "Brief mentions multi-tenant but repo has no auth setup — flagged as risk."
- "Detected both Tailwind and CSS Modules — component guidance marked as ambiguous."
- "Brief's target audience section missing — `uxRules` generated from stack defaults only."

**Acceptance criteria:** warnings are never suppressed silently; they appear in `warnings.json`, in the human-readable exports, and in CLI stderr at compile time.

### 7.8 Drift detection (v0.3)

Compares current repo state against `spine.json` and flags:

- Conventions drifted (new folders outside the plan, imports breaking the module graph).
- Instruction files out of sync with spine.
- Components missing from the component-plan but present in code (or vice versa).
- Design tokens referenced that no longer exist in the source.

CLI: `spine drift check`. CI-friendly exit codes.

---

## 8. Command design

### 8.1 v0.1 commands

```
spine init                                    # scaffold .project-spine/ with empty brief template
spine compile --brief ./brief.md --repo ./   # full compile
spine compile --brief ./brief.md --repo ./ --design ./design-rules.md
spine export --targets claude,copilot,agents  # regenerate exports from existing spine.json
spine inspect --repo ./                       # repo analysis only, no brief
spine explain <warning-id>                    # detailed explanation of a warning
```

### 8.2 v0.2+

```
spine template list
spine template save --name my-agency-saas
spine template apply my-agency-saas
```

### 8.3 v0.3+

```
spine drift check                             # exits non-zero on drift
spine drift explain
spine diff <ref1> <ref2>                      # diff two spine.json versions
```

### 8.4 CLI UX principles

- Dead simple commands. No required positional args where a flag is clearer.
- Readable terminal output with sections, not a wall of logs.
- Explicit warnings, never hidden.
- No fake certainty — confidence is always surfaced.
- First run is fast (target: <30s on a 50-file repo without LLM, <90s with).
- Easy overwrite/update flow: `--force` for regeneration; `--dry-run` for preview.
- Deterministic output paths. No random-name generation.

### 8.5 Messaging style

Direct, useful, no hype. Zero "AI magic" tone. Match the product principle: *if a human reviewer wouldn't keep the file, it shouldn't exist.*

---

## 9. Output structure

```
.project-spine/
  brief.normalized.json
  repo-profile.json
  spine.json
  warnings.json
  exports/
    AGENTS.md
    CLAUDE.md
    copilot-instructions.md
    architecture-summary.md
    scaffold-plan.md
    route-inventory.md
    component-plan.md
    qa-guardrails.md
    sprint-1-backlog.md
    rationale.md           # client-facing project rationale doc
```

Top-level files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`) are also written or updated at the repo root, since that's where agent tools look. `.project-spine/exports/` holds the canonical copies the user diffs against.

---

## 10. Data model

The canonical `spine.json` schema is the contract between phases. All exporters read from it only; they never reach back into the brief or repo-profile directly.

Design invariants:

- **Additive versioning.** Schema bumps only add optional fields; breaking changes require a new major version and a migration.
- **Content-addressable.** `metadata.hash` is a stable hash of all source inputs. Identical inputs → identical hash → exporters can short-circuit.
- **Traceability.** Every generated rule, guideline, or backlog item has a `source` field pointing to the input (`brief#goals[0]`, `repo-profile#stack.framework`, etc.) so humans can audit *why* a rule exists.
- **Warnings are first-class.** `warnings[]` is part of the model; the product's credibility depends on them being complete and visible.

See `docs/schema.md` (to be written in v0.1) for the full JSON Schema.

---

## 11. Templates system

### 11.1 MVP templates

Ships with 4 built-in presets:

1. **SaaS marketing site** (Next.js/Astro-leaning, marketing + docs + pricing)
2. **App dashboard** (auth, data-heavy, multi-role)
3. **Design-system repo** (monorepo, Storybook, tokens, docs site)
4. **Docs portal** (Markdown-heavy, content-driven)

Each template injects:

- Common structure assumptions (routes, component buckets).
- Default QA guardrails (a11y profile, state coverage, visual regression).
- Output file variations (e.g., a design-system repo gets a `tokens.rules.md`).
- Sprint-1 seed suggestions.

### 11.2 Template discovery

`spine init --template saas-marketing` pre-populates the brief template with relevant prompts. Templates are open, versioned Markdown+YAML files under `templates/` — clone-able, forkable, PR-able.

### 11.3 Team templates (paid tier)

Private templates hosted in a team workspace, syncable via `spine template pull`. White-label support for agencies.

---

## 12. Technical architecture

### 12.1 Stack

- **Language:** TypeScript (strict).
- **Runtime:** Node.js 22 LTS. Bun compatible.
- **CLI framework:** [`commander`](https://github.com/tj/commander.js) or [`citty`](https://github.com/unjs/citty). Leaning citty for ESM + structured subcommands.
- **Parsing:** `remark` + `remark-frontmatter` for Markdown; `yaml` for frontmatter.
- **File system inspection:** `fast-glob`, `fs/promises`.
- **Schema/validation:** `zod` for runtime validation of inputs and the spine model.
- **LLM layer:** provider abstraction behind an `LLMProvider` interface. Default: Anthropic Claude (`claude-opus-4-7` for synthesis, `claude-haiku-4-5` for classification). Opt-in only; disabled → deterministic fallback path runs.
- **Markdown rendering:** deterministic templates via `eta` or hand-rolled renderers.
- **Testing:** Vitest + a golden-file suite of 10–15 fixture repos.

### 12.2 Processing pipeline

```
┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
│ brief.md   │──▶│  Brief     │──▶│   Rules      │──▶│  Exporters   │
└────────────┘   │  parser    │   │  compiler    │   │  (MD, JSON)  │
┌────────────┐   └────────────┘   │  (merge,     │   └──────────────┘
│ repo/      │──▶┌────────────┐──▶│  dedupe,     │
└────────────┘   │ Repo       │   │  conflict    │
┌────────────┐   │ analyzer   │   │  detection)  │
│ design.md  │──▶└────────────┘──▶│              │
└────────────┘                    └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ spine.json   │
                                  │ warnings.json│
                                  └──────────────┘
```

### 12.3 Determinism contract

Phases 1–3 (parser, analyzer, compiler) are **fully deterministic**. No LLM calls, no network. LLM enrichment runs after the compiler and can only *add* non-load-bearing fields (e.g., prose in `architecture-summary.md`, suggested backlog copy). Any LLM-generated text is marked with an HTML comment `<!-- spine:ai-generated -->` so humans know what to audit.

### 12.4 Security posture

- No implicit network calls. LLM provider must be explicitly configured with an API key in env.
- No repo content uploaded unless the user invokes an LLM-enrichment flag.
- Secrets scrubber on any input that would be sent to an LLM (strips `.env`, keys matching common secret patterns).
- Offline mode is first-class, not a degraded afterthought.
- Matches the #1 reason devs reject AI tools (Stack Overflow 2025: privacy/security).

---

## 13. User journeys

### 13.1 New client project kickoff (primary)

1. Ayla (agency partner) clones a starter repo for a new SaaS marketing project.
2. Drops `brief.md` at the root with the client's kickoff notes.
3. Runs `spine compile --brief ./brief.md --repo ./ --template saas-marketing`.
4. Spine writes `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, plus `scaffold-plan.md`, `route-inventory.md`, `qa-guardrails.md`, `sprint-1-backlog.md`.
5. Ayla reviews `warnings.json` — three items: audience unclear, no auth provider in brief, a11y level unspecified. She edits the brief to resolve them.
6. Runs `spine compile` again; outputs regenerate; she commits.
7. Her Claude Code session picks up `CLAUDE.md` on next invocation and immediately follows the conventions.

**Time target:** <10 minutes from brief to committed outputs.

### 13.2 Existing repo with messy conventions

1. Marco inherits a 2-year-old Next.js codebase.
2. Runs `spine inspect --repo ./`.
3. Gets `architecture-summary.md` and a list of detected conventions + contradictions ("Tailwind and CSS Modules both present", "app dir and pages dir both present", "no test runner configured but Playwright installed").
4. Writes a minimal `brief.md` describing what he's building next.
5. Runs `spine compile`; gets `AGENTS.md` that encodes the actual (messy) reality plus explicit warnings for the contradictions.
6. Now his agent sessions stop drifting.

### 13.3 Design-aware build setup

1. Sanne's team has a design-system repo with a tokens export.
2. She drops `design-rules.md` (links to tokens, 5 bullet points about component usage) alongside the brief.
3. `spine compile --design ./design-rules.md` produces `component-plan.md` with usage constraints, `qa-guardrails.md` with a11y rules, and an `AGENTS.md` that tells Claude "never introduce a raw color value; always reference `tokens.*`".
4. First PR review shows agents actually followed the rule.

### 13.4 Ongoing drift check (v0.3)

1. A week into a sprint, Ayla runs `spine drift check` in CI.
2. It flags: `component-plan.md` has 3 components that no longer exist in code; `AGENTS.md` references a test command that no longer works; a new folder `src/legacy/` exists outside the plan.
3. CI job opens a PR updating the spine; Ayla reviews and merges or pushes back.

---

## 14. Success metrics

### 14.1 Product metrics (per-project)

- **Time to first usable output:** median <5 minutes on a 50-file repo with an existing brief.
- **Artifact retention:** fraction of generated files still in the repo 7 days after first compile. Target: ≥60% of generated files retained unmodified or lightly edited.
- **Drift warnings resolved:** fraction of `warnings.json` items the user acts on within the first week. Target: ≥50%.
- **Repeat compiles per project:** at least 2 within the first 30 days (indicates living use, not one-shot).
- **CI integration:** % of paying teams running `spine drift check` in CI within 60 days. Target: ≥40%.

### 14.2 Adoption metrics

- **OSS CLI:** weekly active CLIs (distinct installation hashes with ≥1 compile in the past 7 days).
- **Paid conversion:** free → paid workspace conversion at 45 days.
- **Template reuse:** median # of projects using an agency's saved template.
- **Services upsell:** % of paying teams that buy at least one services pack (workshop, design-system alignment) within 90 days.

### 14.3 Business metrics (year 1)

- 3–5 reusable templates published.
- 2–3 public before/after case studies (from Petri's own client work).
- First 10 paying agency teams.
- €10k MRR by month 9, €30k MRR by month 12. (Conservative, anchored on ~30 agency seats at €99–€299.)

### 14.4 Founder / qualitative

- Petri uses Project Spine on every new client project.
- Client feedback explicitly references the rationale doc.
- Teams stop hand-writing their own `CLAUDE.md` files from scratch.

---

## 15. Risks and mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | **Too abstract.** Product feels like "project documentation software." | Lead with concrete output files. Every demo shows diffs in real repos. No abstract UI; everything is a file. |
| 2 | **Too broad.** Scope creeps into "AI strategy platform for teams." | Hard MVP scope lock (§6). Every new feature request must trace to kickoff or drift use cases. |
| 3 | **Easy to clone.** Instruction generation is not defensible. | Moat layers: drift detection, reusable team templates, traceable generation (source pointers), design + repo + strategy fusion, services layer. |
| 4 | **Weak retention.** Users run it once and forget. | Build `drift check` for CI in v0.3. Make ongoing use a paid feature's backbone. |
| 5 | **Generic output distrust.** Users see "AI slop" and discard the files. | Determinism contract (§12.3). Source pointers on every rule. Minimal LLM surface. Content opinions come from deterministic rules, not LLM prose. |
| 6 | **Security anxiety.** Teams won't pipe repo + brief through a third-party LLM. | Offline mode first-class. Opt-in LLM enrichment. Secrets scrubber. Matches Stack Overflow 2025 rejection-reason #1. |
| 7 | **Context drift accelerates faster than we detect.** Users churn on stale files. | Drift check pipeline + CI integration. `metadata.hash` as the integrity signal. |
| 8 | **Addy Osmani's criticism applies to us.** If our `/init`-equivalent is generic boilerplate, we're worse than nothing. | Outputs must reference actual detected conventions, not generic patterns. Every rule has a source pointer. |

---

## 16. Roadmap

### v0.1 — MVP (weeks 1–6)

- Brief parser.
- Repo inspector (covers 7 common stacks).
- Spine model + schema (v1).
- Deterministic exporters (AGENTS.md, CLAUDE.md, copilot-instructions.md).
- Markdown exports (architecture, scaffold, QA, sprint-1).
- 4 built-in templates.
- `spine init` / `compile` / `inspect` / `export`.
- OSS release (MIT), npm publish.

**Goal:** use it on 2 of Petri's own client projects.

### v0.2 — Templates + design input (weeks 7–10)

- Design-rules ingestion.
- Template save/apply.
- Better warnings and ambiguity surfacing.
- Scaffold planner improvements.
- First 5 external adopters, feedback loop.

### v0.3 — Drift (weeks 11–16)

- `spine drift check` with CI-friendly exit codes.
- `metadata.hash` contract.
- Diff view between spine versions.
- GitHub Action for drift checks.
- First paid tier: private templates, drift check reports.

### v0.4 — Hosted workspace (weeks 17–26)

- Team-shared templates.
- Project history.
- Workspace sync.
- Shareable project pack (client-facing rationale doc as a hosted URL).
- Jira/Linear export.

### v0.5+ — Governance layer

- Cross-agent context distribution (push updates to every connected repo).
- Policy packs (a11y compliance, brand, engineering standards).
- Integration with GitHub Agentic Workflows for automated drift PRs.

---

## 17. Business model

### 17.1 Tiers

| Tier | Price | For | Includes |
|------|-------|-----|----------|
| Free (OSS) | €0 | Solo, evaluation | CLI core, public templates, local compile, basic exports |
| Solo/Indie | €19–€39 / mo | Freelancers, indie founders | Private templates, extra exports, drift checks |
| Team | €99–€299 / mo | Small product teams | Shared templates, workspace sync, Jira/Linear export, CI enforcement |
| Agency/Pro | €500–€2,000+ / mo or per-workspace | Agencies, studios | Multi-client templates, white-label exports, governance packs, onboarding, consulting |

### 17.2 Services layer

- **Project Spine workshop** (€2–5k): half-day, install + customize + template library.
- **Design-system alignment pack** (€3–10k): compile design-system rules into reusable templates.
- **AI working agreement pack** (€2–5k): team conventions for agent use.
- **Project recovery / cleanup pack** (€5–15k): fix a drifted codebase via the tool.

### 17.3 Unit economics (target)

- Blended CAC on paid tiers: <€300.
- Gross margin on SaaS: ≥85%.
- Services margin: 50–70% (Petri's hourly rate × workshop day).

---

## 18. Go-to-market

### 18.1 Wedge

**Petri's own client work** is market entry. Every new engagement ships with Project Spine from day 1, creating the first case studies and battle-testing the CLI.

### 18.2 First 90 days

1. Build v0.1 against real client projects.
2. Publish 2 case studies: before/after repo, time-to-kickoff, first-week rework volume.
3. Release CLI to npm + GitHub. License MIT.
4. Write 3 thought-leadership posts:
   - *"Why AI coding fails without project context"*
   - *"The missing layer between brief and build"*
   - *"Repo instructions are not enough"*
5. Post in r/ExperiencedDevs, r/cursor, r/ClaudeAI, Hacker News Show HN.
6. DM 20 agency leads in Petri's network; offer free Project Spine setup in exchange for feedback.

### 18.3 Content angles

- Teardown-style posts comparing generic `/init` output vs. Spine-compiled output on the same repo.
- Public compile runs on popular OSS projects (with attribution).
- Design-system-to-delivery case study.
- CI drift-check demo on a deliberately drifted repo.

### 18.4 Not doing

- No paid ads before 50 paying users.
- No generic "AI for developers" messaging.
- No feature comparisons with Cursor/Copilot — we are not that category.

---

## 19. Competitive landscape

| Competitor | What they do | Where they fall short |
|------------|--------------|----------------------|
| Cursor / Claude Code / Copilot `/init` | Generate a starter `AGENTS.md` / `CLAUDE.md` | Generic boilerplate, no brief input, no architecture map, no drift |
| Cursor Rules packs | Hand-curated rules files per stack | Static, not compiled from *your* brief; no design input; no drift |
| Design system docs (Zeroheight, Storybook) | Document the system | Don't reach the repo's agent instructions; buy-in dropping |
| PM tools (Linear, Jira) | Track work | Don't touch the repo; don't produce machine-readable guardrails |
| Agency starter repos | Reusable scaffolds | Static templates, no per-project compilation |
| GitHub Agentic Workflows | Run agents on repo events | Execution layer — they *need* compiled context like ours to work well |

**Unique wedge:** Project Spine compiles *all three* inputs (brief, repo, design) into a repo-native, drift-aware, deterministic layer. Nobody else sits at that seam.

---

## 20. Open questions

Collect evidence on these in the first 90 days.

1. **Which export is stickiest first** — `AGENTS.md`, `scaffold-plan.md`, or `qa-guardrails.md`? Hypothesis: agent instruction files.
2. **Will teams commit generated files?** Or keep them in `.project-spine/` only? (Retention depends on this.)
3. **Kickoff vs. drift** — which is the real wedge long-term? Hypothesis: drift.
4. **Design input threshold** — how much design rules text produces a meaningfully better output? Target: <1 page unlocks visible quality gains.
5. **LLM dependency** — can the offline path produce outputs that a senior engineer would keep? If yes, offline is the default; LLM is an upsell.
6. **Template market fit** — does any of the 4 starter templates produce 10× demand over the others? Reallocate effort accordingly.

---

## 21. What "done" looks like for v0.1

v0.1 is ready when all of the following are true, verified on 3 fixture repos and Petri's next live client project:

- [ ] `spine compile` completes on a 50-file repo in <90s with LLM enabled, <30s offline.
- [ ] Every generated file has source pointers on every rule.
- [ ] 3 case studies documented (input brief, compile output, what was kept/edited/discarded).
- [ ] `warnings.json` produces actionable items on all 3 test repos.
- [ ] Human reviewer (Petri + 1 external dev) would keep ≥60% of output files unmodified.
- [ ] CLI is installed globally via `npm i -g project-spine@beta`.
- [ ] MIT-licensed public repo with README, PRD, and sample outputs.

---

## 22. Appendix: Research citations

See [docs/research-citations.md](./docs/research-citations.md) for the full evidence log with quotes and URLs.

**Top citations referenced above:**

- Atlassian. *State of Developer Experience Report 2025.* [atlassian.com](https://www.atlassian.com/teams/software-development/state-of-developer-experience-2025) / summary: [IT Pro](https://www.itpro.com/software/development/atlassian-says-ai-has-created-an-unexpected-paradox-for-software-developers-theyre-saving-over-10-hours-a-week-but-theyre-still-overworked-and-losing-an-equal-amount-of-time-due-to-organizational-inefficiencies).
- Stack Overflow. *2025 Developer Survey.* [stackoverflow.blog](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/) / [press release](https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/).
- Zeroheight. *Design Systems Report 2025.* [zeroheight.com](https://zeroheight.com/how-we-document/).
- GitHub. *Agentic Workflows — Technical Preview.* [GitHub Changelog](https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/) / [Documentation](https://github.github.com/gh-aw/).
- *AGENTS.md — An open format for coding agents.* [agents.md](https://agents.md/).
- Fowler, M. *Context Engineering for Coding Agents.* [martinfowler.com](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html).
- Osmani, A. *Stop Using /init for AGENTS.md* (Mar 2026). [Medium](https://medium.com/@addyosmani/stop-using-init-for-agents-md-3086a333f380).
- Gopal, K. *Keep your AGENTS.md in sync.* [kau.sh](https://kau.sh/blog/agents-md/).
- Stack Overflow Blog. *Building shared coding guidelines for AI (and people too).* (Mar 2026). [stackoverflow.blog](https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/).
- *Context Engineering for AI Agents in Open-Source Software.* (arXiv, Oct 2025). [arxiv.org](https://arxiv.org/html/2510.21413v1) — source for "only 5% of repositories contain AI configuration files."
