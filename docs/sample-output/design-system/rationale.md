# Aster Design System — Project rationale

> Why the project is set up this way. Shareable with clients and non-technical stakeholders.

_Generated from `spine.json` — hash `045611f6e141e981`, project type `design-system`._

<!-- spine:deterministic -->

## What we are building

- Standardize product UI primitives across three web apps.
- Move all color, spacing, radius, and typography decisions into semantic tokens.
- Publish a stable React package with Storybook docs and migration examples.

## Who we are building it for

- Product designers defining tokens and component states.
- Platform engineers maintaining the package.
- App teams consuming primitives in production surfaces.

## Constraints we accepted

- React-only v1, TypeScript strict, ESM package output.
- Tokens are exported from Figma as JSON and transformed before publish.
- Downstream apps need light, dark, and high-contrast themes.

## Assumptions we are making

- Designers own token naming; engineers own package boundaries.
- Breaking changes can ship monthly with deprecation notes.

## Risks we are watching

- Teams may fork primitives if migration docs are thin.
- Token aliases could drift from Figma unless exports are checked in CI.

## The stack we are using

Framework: **node-library**. Language: **typescript** (strict). Testing: **vitest**, **testing-library**.

## How we will ship quality

We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.

## How we will work

Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.
When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.
