# Brief summary

_Normalized by Project Spine on 2026-04-18T06:20:17.990Z._

**Project:** Acme Payroll Marketing Site
**Type:** saas-marketing _(confidence 1)_

## Goals

- Launch a marketing site for Acme Payroll's new SMB product line within 6 weeks.
- Generate qualified trial signups from SMB founders in the US and UK.
- Replace the legacy WordPress site with a repo-native, versionable build.
- Pass Lighthouse a11y ≥95 on all key pages.

## Audience

- Founders of 5–50 person companies running payroll for the first time.
- Operations leads evaluating a switch from incumbents (Gusto, Rippling, Deel).

## Constraints

- Stack must be Next.js 15 (app router) + Tailwind. Infra is already on Vercel.
- Content managed in MDX. No CMS for the MVP.
- Design system tokens ship as a JSON file from the product team — reference only, do not fork.
- Legal review required on every claim about pricing or compliance.

## Assumptions

- Engineering is 1 lead + 1 contractor.
- Design handoff is via Figma + exported tokens; no live design-system package yet.
- Analytics stack is PostHog.

## Risks

- Tokens JSON may change mid-build; we need to absorb updates without rewriting components.
- Ops lead audience reads long-form; the marketing team is pushing for short copy — tension to manage.
- Legal turnaround is 48h; compliance-adjacent copy blocks can bottleneck launch.

## Success criteria

- Homepage, 3 product pages, pricing, /compliance, /security, 2 case studies live.
- 99th-percentile page weight <250KB on mobile.
- All interactive elements keyboard-operable and screen-reader labeled.
- 40+ qualified trial signups in the first month.

<!-- spine:deterministic -->
