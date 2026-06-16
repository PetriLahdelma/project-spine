---
name: "Atlas Docs"
projectType: "docs-portal"
---

# Project brief

## Goals
- Launch a technical docs portal that gets new users to hello world in under 5 minutes.
- Keep guides, reference pages, and changelog entries versioned with the repo.
- Make stale docs fail CI through broken-link and copyable-code checks.

## Audience
- New developers installing Atlas for the first time.
- Integrators who need stable API reference pages.
- Support engineers linking users to canonical troubleshooting guides.

## Constraints
- Docs are Markdown/MDX in the repo; no CMS for v1.
- API reference is generated from source metadata during build.
- Search index must rebuild on every deploy.

## Assumptions
- The first release has one supported major version.
- Guides can be reviewed by DevRel before launch.

## Risks
- Reference generation may lag behind source changes.
- Search quality can hide good docs if headings are inconsistent.

## Success criteria
- Quickstart command sequence runs from a clean machine without edits.
- Broken-link count is zero in CI.
- Every generated reference page links back to its source.
