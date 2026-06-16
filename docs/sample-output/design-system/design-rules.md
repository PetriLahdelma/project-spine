# Design rules

## Tokens
- All color, spacing, radius, and typography values live as tokens. No raw hex, px, or font-family in components.
- Tokens are the only safe cross-cut between themes; component styles always read from token references.
- Token names are semantic (`color.surface.default`) not presentational (`color.gray-100`).

## Components
- Every primitive exposes a stable, documented prop API. Breaking changes require a deprecation notice and a major bump.
- Primitives never own business logic or data fetching.
- Composition over configuration: prefer slot props over boolean flags when a consumer might need more control.

## UX
- Motion defaults under 200ms; anything longer needs a rationale (progress, context change).
- Every state transition has a stable from → to mapping; avoid intermediate flicker.
- Focus is visible for keyboard users; mouse users get the hover treatment instead.

## Accessibility
- All interactive primitives meet WCAG 2.2 AA at default and dense sizes.
- Focus trap inside modals, restoring focus to trigger on close.
- Announce async state changes to screen readers (aria-live polite by default).
- Motion respects `prefers-reduced-motion`.
