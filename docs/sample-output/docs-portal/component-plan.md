# Component plan

> How components are organized and how agents should extend them.

_Generated from `spine.json` — hash `cbac2972d9a29995`, project type `docs-portal`._

<!-- spine:deterministic -->

## Buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Usage guidance

- Sidebar — Nested nav with active-state highlighting and collapsible sections. <sup>`template:template:docs-portal/contributes#0`</sup>
- TOC — Right-rail table of contents with scroll-spy. <sup>`template:template:docs-portal/contributes#1`</sup>
- CodeBlock — Copy button, language label, line highlights. <sup>`template:template:docs-portal/contributes#2`</sup>
- Callout — Info / warning / success variants with proper semantics. <sup>`template:template:docs-portal/contributes#3`</sup>
- SearchBar — Instant search with keyboard-only navigation of results. <sup>`template:template:docs-portal/contributes#4`</sup>
- VersionSwitcher — Version-aware navigation where applicable. <sup>`template:template:docs-portal/contributes#5`</sup>

## UX rules

- Guides are task-oriented, not concept-oriented; each one ends with 'Next steps' that link forward. <sup>`template:template:docs-portal/contributes#0`</sup>
- Landing hero contains a runnable quickstart, not marketing. <sup>`template:template:docs-portal/contributes#1`</sup>
