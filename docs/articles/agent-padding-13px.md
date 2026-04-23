---
title: "Why your AI agent writes `padding: 13px`, and how to stop it"
author: "Petri Lahdelma"
created: 2026-04-23
canonical_url: "https://www.digitaltableteur.com/articles/agent-padding-13px"
tags: [ai-agents, design-systems, design-tokens, tailwindcss, stylelint, claude-code, cursor]
status: draft
---

# Why your AI agent writes `padding: 13px`, and how to stop it

You asked Claude Code to tidy up a card component. It did. The diff looks good at a glance.

```diff
- padding: var(--spacing-4);
+ padding: 13px;
```

Wait. Your spacing scale is 4, 8, 12, 16, 24. You don't have a 13. And you do have `--spacing-4`, which is 16. So why did the agent write `padding: 13px`?

Because the agent didn't know. And you never told it.

## The invisible contract

Every design system has a contract: *these values are allowed, these aren't*. The contract lives in three places:

- **In Figma**, as variables and styles.
- **In code**, as CSS custom properties, Tailwind config, or a tokens JSON file.
- **In people's heads**, as taste.

AI coding agents see the third one not at all, the second one sometimes (when your code happens to use the tokens in the file they're editing), and the first one never. So when the agent eyeballs "this card needs a tiny bit less padding," 13 is as reasonable a guess as 12 or 16. The contract is invisible to it.

This is the failure mode that produces `padding: 13px`, `margin-top: 22px`, and `border-radius: 6px` in a system that's been 4-point-grid disciplined for years. It's not a model quality problem. It's a context problem.

## What doesn't work

**Writing the rules into `AGENTS.md` and hoping the agent reads them.** It will, sort of, sometimes. Then the brief changes, the tokens file gets updated, and the `AGENTS.md` drifts. Six weeks later the agent is confidently following rules that no longer describe the system. Worse: when nothing in `AGENTS.md` contradicts its habits, it defaults to its habits. Which include `padding: 13px`.

**Post-hoc review.** You catch it in PR. Feedback lands, agent fixes, you approve. For every instance of `padding: 13px` you catch, one slipped through. And the cost is reviewer time, which is what you were hoping to save.

**Per-prompt reminders.** "Use tokens from `tokens.json`." This works the one time you remember to type it. Across 50 conversations per week, across a team, it doesn't scale.

The pattern underneath all three: you're treating a *systems* problem (the contract must be enforced) as an *instruction* problem (tell the agent better each time). Instructions don't fail CI. Systems do.

## Two tools, one contract

Two tools, both free, both OSS, both MIT, stack together to close this loop:

- [**Project Spine**](https://projectspine.dev) — compiles your brief, your repo, and your design tokens into `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` that reference your *actual* tokens. Includes drift detection so the compiled layer never silently rots.
- [**Rhythmguard**](https://www.npmjs.com/package/stylelint-plugin-rhythmguard) — a Stylelint plugin (plus ESLint companion for Tailwind arbitrary classes) that fails CI when off-scale values slip through, with autofix to the nearest scale value or token.

One says "here's what your tokens mean" to the agent. The other says "use them or fail CI" to the developer. Together, the contract becomes *enforceable*, not merely *documented*.

## Setup in under five minutes

Both tools assume you already have a tokens file. If you don't, export one from your Figma Variables or Tokens Studio; DTCG and Tokens Studio formats are both auto-detected by both tools.

**1. Compile your agent context with Spine.**

```bash
npm install -g project-spine
spine init --template saas-marketing
# edit ./brief.md with your project intent
spine compile \
  --brief ./brief.md \
  --repo . \
  --tokens ./tokens.json
```

You get 19 generated files in one pass: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` at repo root (the files every agent reads), plus a full `.project-spine/exports/` layer with architecture summary, component plan, QA guardrails, sprint-1 backlog, and a SHA-256 manifest. The agent instructions now reference *your* tokens by name and intent, not some generic "use Tailwind classes" boilerplate.

Re-run `spine compile` whenever the brief, repo, or tokens change. Or let CI do it:

```bash
spine drift check --fail-on any
# non-zero exit if your AGENTS.md has drifted from your brief
```

**2. Enforce at lint time with Rhythmguard.**

```bash
npm install --save-dev stylelint-plugin-rhythmguard
npx rhythmguard init
# detects your stack (Tailwind, Next.js, CSS Modules, Vue, etc.)
```

The generated config looks like this for a Tailwind v4 project:

```js
// .stylelintrc.cjs
module.exports = {
  extends: ["stylelint-plugin-rhythmguard/configs/tailwind"],
  rules: {
    "rhythmguard/prefer-token": [true, {
      tokenMapFromCssCustomProperties: true,
      tokenPattern: "^--spacing-"
    }],
    "rhythmguard/use-scale": [true, { scale: "rhythmic-4" }]
  }
};
```

Now `padding: 13px` fails `npm run lint:styles` with an actionable fix:

```
Cards.module.css:12:3 × Use a value on the rhythmic-4 scale.
  Expected 12 or 16, got 13. Run `--fix` to normalize.
```

Tailwind arbitrary classes are covered by the same package's ESLint rule:

```jsx
<div className="p-[13px]" />
// → p-[12px] (autofixed)
```

## What you get

Concretely:

- The agent **knows the tokens** because `AGENTS.md` now says so in the exact vocabulary of your tokens file. Fewer `padding: 13px` get written in the first place.
- The linter **catches what slips through** and autofixes it. The ones that don't slip through never ship.
- `spine drift check` **fires before merge** if `AGENTS.md` and the brief have drifted, so the context layer doesn't silently rot.
- Nothing about your stack changes. Spine is OSS + local. Rhythmguard is a Stylelint plugin. No hosted service. No telemetry. No lock-in.

The payoff is less in any single saved 5 minutes of review and more in the compounding effect: over 50 PRs and 200 agent conversations a month, the number of design-system violations that need human attention trends toward zero.

## The bigger pattern

Design systems have always had the context problem. AI agents just make it visible. The agent doesn't mis-implement your system because it's a bad model; it mis-implements because it doesn't have the contract. The fix isn't smarter prompts. The fix is shipping the contract to both ends of the pipe: the agent at write time, the linter at gate time.

This generalizes. Any invisible contract — brand voice in copy, accessibility standards in markup, security policies in API routes — has the same shape. Agents will get them wrong until someone compiles the rules into the repo *and* wires an enforcement gate. Two tools, one contract. That's the pattern.

Start with padding.

---

## Try it

- Project Spine: [projectspine.dev](https://projectspine.dev) · [github.com/PetriLahdelma/project-spine](https://github.com/PetriLahdelma/project-spine) · `npm i -g project-spine`
- Rhythmguard: [npm](https://www.npmjs.com/package/stylelint-plugin-rhythmguard) · [github.com/PetriLahdelma/stylelint-plugin-rhythmguard](https://github.com/PetriLahdelma/stylelint-plugin-rhythmguard) · `npm i -D stylelint-plugin-rhythmguard`

Both are MIT, both solo-maintained, both have drift detection baked in. Issues and PRs welcome.

---

## dev.to frontmatter (paste at the top when cross-posting)

```yaml
---
title: Why your AI agent writes `padding: 13px`, and how to stop it
published: false
description: AI agents write off-scale values because they don't see your design-system contract. Two OSS tools compile the contract into agent context and enforce it at CI.
tags: ai, designsystems, tailwindcss, stylelint
canonical_url: https://www.digitaltableteur.com/articles/agent-padding-13px
cover_image: https://projectspine.dev/og/banner.png
---
```

## LinkedIn cut (~700 chars, post-length)

> Your AI agent just wrote `padding: 13px` in a codebase that's been 4-point-grid disciplined for years.
>
> Not a model quality problem. A context problem.
>
> The design-system contract lives in Figma, partly in code, partly in people's heads. The agent sees none of it.
>
> Two OSS tools close the loop:
>
> • Project Spine compiles your brief + repo + tokens into AGENTS.md / CLAUDE.md that reference your actual scale.
> • Rhythmguard enforces it at lint time. `padding: 13px` fails CI with an autofix to 12 or 16.
>
> One says "here's what your tokens mean." The other says "use them or fail CI." Together, the contract is enforceable, not merely documented.
>
> Full walkthrough: [digitaltableteur.com/articles/agent-padding-13px]
