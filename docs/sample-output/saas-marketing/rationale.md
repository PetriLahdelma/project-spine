# Project Spine — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `8976dc15b57e7f67`, project type `saas-marketing`._

<!-- spine:deterministic -->

## What we are building

- Launch a marketing site for Acme Payroll's new SMB product line within 6 weeks.
- Generate qualified trial signups from SMB founders in the US and UK.
- Replace the legacy WordPress site with a repo-native, versionable build.
- Pass Lighthouse a11y ≥95 on all key pages.

## Who we are building it for

- Founders of 5–50 person companies running payroll for the first time.
- Operations leads evaluating a switch from incumbents (Gusto, Rippling, Deel).

## Constraints we accepted

- Stack must be Next.js 15 (app router) + Tailwind. Infra is already on Vercel.
- Content managed in MDX. No CMS for the MVP.
- Design system tokens ship as a JSON file from the product team — reference only, do not fork.
- Legal review required on every claim about pricing or compliance.

## Assumptions we are making

- Engineering is 1 lead + 1 contractor.
- Design handoff is via Figma + exported tokens; no live design-system package yet.
- Analytics stack is PostHog.

## Risks we are watching

- Tokens JSON may change mid-build; we need to absorb updates without rewriting components.
- Ops lead audience reads long-form; the marketing team is pushing for short copy — tension to manage.
- Legal turnaround is 48h; compliance-adjacent copy blocks can bottleneck launch.

## The stack we are using

Framework: **next**. Styling: **tailwind**. Language: **typescript** (strict).

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.
