# Component plan

> How components are organized and how agents should extend them.

_Generated from `spine.json` — hash `8976dc15b57e7f67`, project type `saas-marketing`._

<!-- spine:deterministic -->

## Buckets

- Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`.
- UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`.
- Feature components live co-located with the route or feature folder that owns them.

## Usage guidance

- Hero — full-width headline, sub-copy, primary + secondary CTA, optional product image. <sup>`template:template:saas-marketing/contributes#0`</sup>
- FeatureGrid — responsive grid of feature cards with icon, title, description. <sup>`template:template:saas-marketing/contributes#1`</sup>
- LogoStrip — customer logos row with grayscale treatment and alt text. <sup>`template:template:saas-marketing/contributes#2`</sup>
- Testimonial — quote block with avatar, name, role, company. <sup>`template:template:saas-marketing/contributes#3`</sup>
- PricingTable — tier cards with features list, highlight recommended tier, keyboard navigable. <sup>`template:template:saas-marketing/contributes#4`</sup>
- FAQ — accordion with proper ARIA state. <sup>`template:template:saas-marketing/contributes#5`</sup>
- CTABanner — full-width conversion block for mid-page and footer. <sup>`template:template:saas-marketing/contributes#6`</sup>

## UX rules

- Every page has a primary CTA above the fold; secondary CTAs never compete in weight. <sup>`inference:inferred:saas-marketing`</sup>
- Every interactive element exposes hover, focus-visible, active, and disabled states. <sup>`inference:inferred:saas-marketing/states`</sup>
- Exactly one primary CTA per page, above the fold; secondaries must visually yield. <sup>`template:template:saas-marketing/contributes#0`</sup>
- Copy passes the Hemingway 'ops lead can skim in 30s' bar on long-form pages. <sup>`template:template:saas-marketing/contributes#1`</sup>
