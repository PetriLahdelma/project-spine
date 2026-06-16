---
name: "Aster Design System"
projectType: "design-system"
---

# Project brief

## Goals
- Standardize product UI primitives across three web apps.
- Move all color, spacing, radius, and typography decisions into semantic tokens.
- Publish a stable React package with Storybook docs and migration examples.

## Audience
- Product designers defining tokens and component states.
- Platform engineers maintaining the package.
- App teams consuming primitives in production surfaces.

## Constraints
- React-only v1, TypeScript strict, ESM package output.
- Tokens are exported from Figma as JSON and transformed before publish.
- Downstream apps need light, dark, and high-contrast themes.

## Assumptions
- Designers own token naming; engineers own package boundaries.
- Breaking changes can ship monthly with deprecation notes.

## Risks
- Teams may fork primitives if migration docs are thin.
- Token aliases could drift from Figma unless exports are checked in CI.

## Success criteria
- Button, Input, Field, Dialog, Tooltip, and Toast ship with docs and tests.
- Axe checks pass for every primitive story.
- First downstream app replaces 80% of raw form controls with primitives.
