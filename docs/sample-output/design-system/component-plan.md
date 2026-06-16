# Component plan

> How components are organized and how agents should extend them.

_Generated from `spine.json` — hash `045611f6e141e981`, project type `design-system`._

<!-- spine:deterministic -->

## Buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Usage guidance

- Every primitive exposes a stable, documented prop API. Breaking changes require a deprecation notice and a major bump. <sup>`design:design-rules.md#section1/item0`</sup>
- Primitives never own business logic or data fetching. <sup>`design:design-rules.md#section1/item1`</sup>
- Composition over configuration: prefer slot props over boolean flags when a consumer might need more control. <sup>`design:design-rules.md#section1/item2`</sup>
- Every shared UI component must have at least one Storybook story covering default and loading/error states where applicable. <sup>`inference:inferred:storybook`</sup>
- Token schema — colors, spacing, radius, motion, typography; all values live as tokens. <sup>`template:template:design-system/contributes#0`</sup>
- Primitive set — Button, Input, Field, Select, Checkbox, Radio, Switch, Tooltip, Dialog, Toast. <sup>`template:template:design-system/contributes#1`</sup>
- Layout primitives — Stack, Inline, Grid, Box with consistent spacing scale. <sup>`template:template:design-system/contributes#2`</sup>
- Icon set — single source, tree-shakeable, accessible by default (role, title). <sup>`template:template:design-system/contributes#3`</sup>
- Theme surfaces — light/dark/high-contrast themes wired through tokens. <sup>`template:template:design-system/contributes#4`</sup>

## From design rules

- All color, spacing, radius, and typography values live as tokens. No raw hex, px, or font-family in components. <sup>`design:design-rules.md#section0/item0`</sup>
- Tokens are the only safe cross-cut between themes; component styles always read from token references. <sup>`design:design-rules.md#section0/item1`</sup>
- Token names are semantic (color.surface.default) not presentational (color.gray-100). <sup>`design:design-rules.md#section0/item2`</sup>
- Every primitive exposes a stable, documented prop API. Breaking changes require a deprecation notice and a major bump. <sup>`design:design-rules.md#section1/item0`</sup>
- Primitives never own business logic or data fetching. <sup>`design:design-rules.md#section1/item1`</sup>
- Composition over configuration: prefer slot props over boolean flags when a consumer might need more control. <sup>`design:design-rules.md#section1/item2`</sup>
- Motion defaults under 200ms; anything longer needs a rationale (progress, context change). <sup>`design:design-rules.md#section2/item0`</sup>
- Every state transition has a stable from → to mapping; avoid intermediate flicker. <sup>`design:design-rules.md#section2/item1`</sup>
- Focus is visible for keyboard users; mouse users get the hover treatment instead. <sup>`design:design-rules.md#section2/item2`</sup>
- All interactive primitives meet WCAG 2.2 AA at default and dense sizes. <sup>`design:design-rules.md#section3/item0`</sup>
- Focus trap inside modals, restoring focus to trigger on close. <sup>`design:design-rules.md#section3/item1`</sup>
- Announce async state changes to screen readers (aria-live polite by default). <sup>`design:design-rules.md#section3/item2`</sup>
- Motion respects prefers-reduced-motion. <sup>`design:design-rules.md#section3/item3`</sup>

## UX rules

- Motion defaults under 200ms; anything longer needs a rationale (progress, context change). <sup>`design:design-rules.md#section2/item0`</sup>
- Every state transition has a stable from → to mapping; avoid intermediate flicker. <sup>`design:design-rules.md#section2/item1`</sup>
- Focus is visible for keyboard users; mouse users get the hover treatment instead. <sup>`design:design-rules.md#section2/item2`</sup>
- Props follow a consistent shape across primitives (size, tone, variant, disabled, loading). <sup>`template:template:design-system/contributes#0`</sup>
- Primitives never embed business logic; they are purely presentational. <sup>`template:template:design-system/contributes#1`</sup>
