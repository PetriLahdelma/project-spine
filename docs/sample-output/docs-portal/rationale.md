# Atlas Docs — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `cbac2972d9a29995`, project type `docs-portal`._

<!-- spine:deterministic -->

## What we are building

- Launch a technical docs portal that gets new users to hello world in under 5 minutes.
- Keep guides, reference pages, and changelog entries versioned with the repo.
- Make stale docs fail CI through broken-link and copyable-code checks.

## Who we are building it for

- New developers installing Atlas for the first time.
- Integrators who need stable API reference pages.
- Support engineers linking users to canonical troubleshooting guides.

## Constraints we accepted

- Docs are Markdown/MDX in the repo; no CMS for v1.
- API reference is generated from source metadata during build.
- Search index must rebuild on every deploy.

## Assumptions we are making

- The first release has one supported major version.
- Guides can be reviewed by DevRel before launch.

## Risks we are watching

- Reference generation may lag behind source changes.
- Search quality can hide good docs if headings are inconsistent.

## The stack we are using

Framework: **next**. Styling: **tailwind**. Language: **typescript** (strict). Testing: **vitest**.

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.
