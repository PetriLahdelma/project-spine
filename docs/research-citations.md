# Research citations

Evidence log for Project Spine's positioning. Gathered 2026-04-18.

Organized by theme. Each entry includes a paraphrased quote, source, URL, and the PRD section it supports.

---

## Theme 1 — AI saves time, but context fragmentation eats it back

### 1.1 Atlassian State of Developer Experience Report 2025

**Key findings:**

- 99% of developers report time savings from AI.
- **68% save more than 10 hours per week** (up from 38% in 2024).
- **50% lose 10+ hours per week** to organizational inefficiencies. 90% lose 6+ hours.
- For a 500-developer company, that equates to roughly $7.9M/year in lost productivity.
- Top time-wasting activities: **finding information** (services, docs, APIs), adapting to new technology, and **context switching between tools**.
- 3,500 developers and managers surveyed.

**Why this matters for Project Spine:** This is the Atlassian paradox. AI is giving time back, but fragmented project context is taking it back. Project Spine attacks exactly the "finding information" and "context switching" line items.

**Sources:**

- [State of Developer Experience Report 2025 — Atlassian](https://www.atlassian.com/teams/software-development/state-of-developer-experience-2025)
- [AI adoption is rising, but friction persists — Atlassian blog](https://www.atlassian.com/blog/developer/developer-experience-report-2025)
- [Atlassian says AI has created an 'unexpected paradox' — IT Pro](https://www.itpro.com/software/development/atlassian-says-ai-has-created-an-unexpected-paradox-for-software-developers-theyre-saving-over-10-hours-a-week-but-theyre-still-overworked-and-losing-an-equal-amount-of-time-due-to-organizational-inefficiencies)
- [AI productivity gains are being offset by organizational bottlenecks — LeadDev](https://leaddev.com/velocity/ai-productivity-gains-are-being-offset-by-organizational-bottlenecks)
- [AI coding productivity gains cancelled out by other friction points — SD Times](https://sdtimes.com/ai/report-ai-productivity-gains-cancelled-out-by-friction-points-in-other-areas-that-slow-developers-down/)

---

## Theme 2 — AI trust is declining, not rising

### 2.1 Stack Overflow 2025 Developer Survey

Published Dec 2025, ~49,000 respondents.

**Key findings:**

- Positive AI sentiment: 70%+ in 2023/2024 → **60% in 2025**.
- **46% actively distrust AI accuracy.** Only 33% trust it. Only 3% "highly trust" AI output.
- 87% concerned about accuracy. 81% concerned about security/privacy.
- **45% say debugging AI-generated code is time-consuming** — a direct trust-shredder.
- **Top reasons devs reject AI tools:** (1) security/privacy, (2) pricing, (3) better alternatives. "Lack of AI" ranks LAST.
- 84% of devs use AI, yet most don't trust it.

**Why this matters for Project Spine:**

- The market is not rejecting AI for lack of AI. It's rejecting tools for privacy, cost, and quality problems. Project Spine's positioning as "repo-native, offline-first, deterministic" is directly aimed at rejection reason #1.
- The 45% "debugging AI-generated code is time-consuming" stat is the *core product thesis*: give the agent better project context and its output becomes actually debuggable.

**Sources:**

- [2025 Stack Overflow Developer Survey](https://survey.stackoverflow.co/2025/)
- [AI results — 2025 Stack Overflow Developer Survey](https://survey.stackoverflow.co/2025/ai)
- [Developers remain willing but reluctant to use AI — Stack Overflow blog](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/)
- [Trust in AI at an All Time Low — Stack Overflow press release](https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/)
- [84% of developers use AI, yet most don't trust it — ShiftMag](https://shiftmag.dev/stack-overflow-survey-2025-ai-5653/)
- [Mind the gap: Closing the AI trust gap for developers — Stack Overflow (Feb 2026)](https://stackoverflow.blog/2026/02/18/closing-the-developer-ai-trust-gap/)

---

## Theme 3 — AGENTS.md / CLAUDE.md / rules files are becoming infrastructure, but they drift

### 3.1 AGENTS.md as an open standard

- Used by 60,000+ open-source projects.
- Tool-agnostic: Codex, Claude Code (via `CLAUDE.md`), Copilot (via `copilot-instructions.md`), Cursor all read project-local rules.
- [agents.md](https://agents.md/) maintains the convention.
- Addy Osmani (March 2026): *"Stop using /init for AGENTS.md"* — auto-generated boilerplate is actively worse than nothing.

**Sources:**

- [AGENTS.md](https://agents.md/)
- [AGENTS.md Emerges as Open Standard — InfoQ (Aug 2025)](https://www.infoq.com/news/2025/08/agents-md/)
- [How to Build Your AGENTS.md (2026) — Augment Code](https://www.augmentcode.com/guides/how-to-build-agents-md)
- [The Complete Guide to AI Agent Memory Files — Medium](https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9)
- [Stop Using /init for AGENTS.md — Addy Osmani, Mar 2026](https://medium.com/@addyosmani/stop-using-init-for-agents-md-3086a333f380)

### 3.2 Drift is the practitioner pain

Paraphrased quotes from practitioner blog posts (the tone that also shows up in Reddit and HN discussions):

- *"Keeping AGENTS.md files in sync is the annoying part, and if you use more than one tool, things drift fast."* — [Kaushik Gopal](https://kau.sh/blog/agents-md/)
- *"For AI agents that read documentation on every request, stale information actively poisons the context. If your AGENTS.md says authentication logic lives in a specific file and that file gets renamed or moved, the agent will confidently look in the wrong place."* — [Packmind](https://packmind.com/evaluate-context-ai-coding-agent/)
- *"AGENTS.md should not describe everything an agent can observe, but rather describe what an agent cannot cheaply determine on its own."* — [Francis Eytan Dortort](https://dortort.com/posts/dont-ditch-agents-md-fix-whats-in-it/)
- *"A hierarchy of AGENTS.md files placed at the relevant directory or module level, automatically maintained so that each agent gets context scoped precisely to the code it's working in."* — multiple practitioners describing what they wish existed.

**Why this matters for Project Spine:** Drift is the obvious next frontier. Instruction-file generation is cloneable; drift-aware, source-pointered, traceable generation is not.

**Sources:**

- [Keep your AGENTS.md in sync — Kaushik Gopal](https://kau.sh/blog/agents-md/)
- [Don't Ditch AGENTS.md — Francis Eytan Dortort](https://dortort.com/posts/dont-ditch-agents-md-fix-whats-in-it/)
- [Writing AI coding agent context files is easy. Keeping them accurate isn't. — Packmind](https://packmind.com/evaluate-context-ai-coding-agent/)
- [Improve your AI code output with AGENTS.md — Builder.io](https://www.builder.io/blog/agents-md)
- [Writing a good CLAUDE.md — HumanLayer Blog](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

### 3.3 The 5% adoption ceiling

An October 2025 study cited across the context-engineering literature:

> *"Only 5% of repositories contain AI configuration files, identified as an organizational failure."*

Gartner research cited alongside: most CISOs worry about AI agent risks, few organizations have mature governance frameworks.

**Sources:**

- [Context Engineering for AI Agents in Open-Source Software — arXiv (Oct 2025)](https://arxiv.org/html/2510.21413v1)
- [Codified Context: Infrastructure for AI Agents in a Complex Codebase — arXiv (Feb 2026)](https://arxiv.org/html/2602.20478v1)

---

## Theme 4 — Context engineering is now a named discipline

Industry writing has shifted from "prompt engineering" to "context engineering" in 2025–2026.

- Martin Fowler's "Context Engineering for Coding Agents" essay frames it as structured, compacted, aligned information — not cramming.
- Stack Overflow Blog (March 2026): *"Building shared coding guidelines for AI (and people too)."*
- Packmind, HumanLayer, Augment Code all publish playbooks.
- The emerging consensus: versioned standards, cross-agent distribution, drift detection are the production requirements.

**Sources:**

- [Context Engineering for Coding Agents — Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
- [Building shared coding guidelines for AI (and people too) — Stack Overflow blog, Mar 2026](https://stackoverflow.blog/2026/03/26/coding-guidelines-for-ai-agents-and-people-too/)
- [Best context engineering tools for AI coding in 2026 — Packmind](https://packmind.com/context-engineering-ai-coding/best-context-engineering-tools/)
- [Advanced context engineering for coding agents — HumanLayer / ai-that-works](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md)
- [Awesome-Context-Engineering — GitHub](https://github.com/Meirtz/Awesome-Context-Engineering)
- [Vibe Coding vs Agentic Coding vs Context Engineering in 2026 — QASource](https://www.qasource.com/blog/vibe-coding-vs-agentic-coding-vs-context-engineering)

---

## Theme 5 — Design systems: technical maturity, organizational gaps

### 5.1 Zeroheight Design Systems Report 2025

- **Design token adoption: 56% (2024) → 84% (2025).**
- Communication, resource shortages, and buy-in remain the top blockers — not tooling.
- Report framing: we've moved past the "inflated expectations" stage into the "difficult second stage" where delivery on the promise is hard.
- Quote: *"The adoption of an effective design system depends not only on technical quality, but also on communication and integration into workflows."*

**Why this matters for Project Spine:** teams have tokens, but not a translation layer from system rules to per-project agent instructions. Project Spine is that layer.

**Sources:**

- [Design Systems Report 2025 — Zeroheight](https://zeroheight.com/how-we-document/)
- [Design Systems Report 2026 — Zeroheight](https://report.zeroheight.com/)
- [Zeroheight Releases Its Design Systems Report 2025 — Web Designer Depot](https://webdesignerdepot.com/zeroheight-releases-its-design-systems-report-2025/)
- [Design Systems Report 2025 — Francesco Improta summary](https://francescoimprota.com/2025/03/28/design-system-report/)
- [What's new in the Design Tokens spec — Zeroheight](https://zeroheight.com/blog/whats-new-in-the-design-tokens-spec/)

### 5.2 Design → code handoff

- GitHub's Annotation Toolkit is pushing accessibility-first, structured handoff from Figma.
- Typical project delivery timelines: Kickoff & Discovery (Week 1), Design Concepts (Weeks 2–3), Build & Integrate (Weeks 4–5), Final Review & Handoff (Week 6) — a lot of handoff surface to lose context across.

---

## Theme 6 — Agency and freelancer kickoff pain

Quotes from agency-focused writing that match what Project Spine's ICP lives:

- *"Manual kickoffs cost teams two to five business days before a single scoped task is assigned, and clients experience every one of those days as agency inertia."* — Lowcode Agency.
- *"Broken handoff chains occur because every manual step requires someone to initiate the next one. Inconsistent setup quality varies depending on who set up the project. Forgotten documents are routinely skipped when kickoffs run from memory rather than a defined process."* — same.
- *"A strong kickoff meeting prevents weeks of churn by aligning scope, roles, timeline, and decision-making upfront."* — Monday.com.

**Sources:**

- [How to Automate Full Project Kickoff Workflow — Lowcode Agency](https://www.lowcode.agency/blog/project-kickoff-workflow-automation)
- [Project kickoff template — Monday.com](https://monday.com/blog/project-management/project-kickoff-template/)
- [From Kickoff to Handoff — Winnex](https://winnex.org/kickoff-handoff/)

---

## Theme 7 — GitHub Agentic Workflows makes the substrate native

### 7.1 Product launch

- **Entered technical preview on 2026-02-13.**
- Collaboration between GitHub, Microsoft Research, and Azure Core Upstream.
- Workflows authored as Markdown in `.github/workflows/`. The `gh aw` CLI compiles them into standard GitHub Actions.
- Can run with GitHub Copilot CLI, Claude (Anthropic), or OpenAI Codex.
- **Read-only permissions by default**; "safe outputs" mechanism for controlled writes.
- Five security layers to contain confused or compromised agents.

**Why this matters for Project Spine:**

- Repo-native, Markdown-authored agent pipelines are now the mainstream GitHub story. Project Spine's compiled context slots directly in: drift checks can be a GitHub Agentic Workflow; compiled guardrails can be referenced from workflow files.
- The security posture (read-only default, safe outputs) aligns perfectly with Project Spine's own security posture (§12.4 of PRD).

**Sources:**

- [GitHub Agentic Workflows are now in technical preview — GitHub Changelog](https://github.blog/changelog/2026-02-13-github-agentic-workflows-are-now-in-technical-preview/)
- [Automate repository tasks with GitHub Agentic Workflows — GitHub Blog](https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/)
- [Home | GitHub Agentic Workflows (docs)](https://github.github.com/gh-aw/)
- [GitHub Agentic Workflows Unleash AI-Driven Repository Automation — InfoQ](https://www.infoq.com/news/2026/02/github-agentic-workflows/)
- [GitHub previews Agentic Workflows — The Register](https://www.theregister.com/2026/02/17/github_previews_agentic_workflows/)
- [View Agentic Workflow configs in the Actions run summary — GitHub Changelog, Mar 2026](https://github.blog/changelog/2026-03-26-view-agentic-workflow-configs-in-the-actions-run-summary/)

---

## Theme 8 — Hallucination and context-loss patterns devs complain about

Practitioner narratives of AI coding tool failure modes that Project Spine's context layer is designed to prevent:

- *"Once your chat context window fills up, the 'Plan' falls out of the LLM's brain, and it starts guessing. LLMs are brilliant at generation but terrible at state management."* — dev.to post on spec-driven workflows.
- *"When asked to 'update the translation keys only in the file: @en-US.json,' it starts updating translation keys in .tsx, .ts, .css files."* — reported Claude Code issue.
- *"Claude Code is able to return hallucinated tool outputs of tools."* — Anthropic GitHub issue #10628.
- Documented solution: *"Moving state out of the chat and into Markdown to achieve zero hallucinations: Claude stops guessing because the truth is in the file."*

**Why this matters:** the emerging best practice is exactly Project Spine's thesis — make the project's truth live in the repo, in Markdown, not in chat context.

**Sources:**

- [How I stopped Claude Code from hallucinating on Day 4 (Spec-Driven Workflow) — dev.to](https://dev.to/samhath03/how-i-stopped-claude-code-from-hallucinating-on-day-4-the-spec-driven-workflow-3lim)
- [Claude hallucinated fake user input — anthropics/claude-code#10628](https://github.com/anthropics/claude-code/issues/10628)
- [The LLM is hallucinating Claude Code command line tool output — #7381](https://github.com/anthropics/claude-code/issues/7381)
- [Claude 3.7 hallucinating and completely lost prompt adherence — Cursor forum](https://forum.cursor.com/t/a-bunch-of-bugs-claude-3-7-hallucinating-and-completely-lost-prompt-adherence/81067)

---

## Stats audit — which PRD claims are confirmed

| Stat in PRD | Source | Confirmed? |
|-------------|--------|-----------|
| 99% of devs save time with AI | Atlassian 2025 | ✅ |
| 68% save 10+ hrs/week | Atlassian 2025 | ✅ |
| 50% lose 10+ hrs/week to org inefficiencies | Atlassian 2025 | ✅ |
| 90% lose 6+ hrs/week | Atlassian 2025 | ✅ |
| Top AI-tool rejection reasons: (1) privacy, (2) price, (3) alternatives; "lack of AI" last | Stack Overflow 2025 | ✅ |
| Positive AI sentiment 70%+ → 60% | Stack Overflow 2025 | ✅ |
| 46% distrust AI accuracy | Stack Overflow 2025 | ✅ |
| 45% debugging AI code is time-consuming | Stack Overflow 2025 | ✅ |
| Design token adoption 56% → 84% | Zeroheight 2025 | ✅ |
| GitHub Agentic Workflows tech preview Feb 13 2026 | GitHub Changelog | ✅ |
| 5% of repos have AI configuration files (Oct 2025) | arXiv survey | ⚠️ cited in multiple secondary sources; verify against the original paper before using in public marketing |
| Zeroheight "only 64% document UI patterns" | Originally in founder memo | ⚠️ not confirmed in this research pass; removed from PRD body until verified |
| Zeroheight "buy-in 42% → 32%" | Originally in founder memo | ⚠️ not confirmed in this research pass; removed from PRD body until verified |

Action items before public posting:
1. Pull primary-source Atlassian and Stack Overflow PDFs to confirm exact phrasings.
2. Verify the "5% of repositories" stat against the arXiv paper's methodology.
3. Read the Zeroheight 2025 and 2026 reports directly to confirm or correct the two unverified numbers.
