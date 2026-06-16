# Northstar Ops Dashboard — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `6314a0c307118ea7`, project type `app-dashboard`._

<!-- spine:deterministic -->

## What we are building

- Ship a role-aware operations dashboard for support leads within 8 weeks.
- Reduce manual queue triage by surfacing priority accounts and stale cases.
- Give managers exportable weekly metrics without ad-hoc SQL requests.

## Who we are building it for

- Support leads who rebalance queues several times per day.
- Operations managers who review response times and escalation quality weekly.
- Workspace admins who invite agents and assign roles.

## Constraints we accepted

- Stack is Next.js app router with server actions for mutations.
- Auth comes from the existing SSO provider; no new identity system in v1.
- Tables may include customer names and emails, so analytics and logs must not contain PII.

## Assumptions we are making

- Workspaces stay under 200 active agents during the beta.
- The existing API can provide queue and user data with p95 under 300ms.

## Risks we are watching

- Large exports could block the UI unless moved to a background job.
- Permission mistakes are more damaging than missing convenience features.

## The stack we are using

Framework: **next**. Styling: **tailwind**. Language: **typescript** (strict). Testing: **vitest**.

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.
