---
name: project-spine-rationale
description: Use when the user wants to publish a branded, client-facing project summary at a shareable URL — phrases like "share the rationale with the client", "send a project overview link", "publish the brief for external viewing", "give the client a project summary page". For setting up a workspace use project-spine-workspace; for revoking an old rationale also use this skill.
---

# Publish a client-facing rationale URL

**Goal:** generate a public, unguessable, revocable URL at `projectspine.dev/r/<slug>` that renders the compiled `rationale.md` with the workspace's brand color. Use it as a leave-behind after a kickoff call, a sales artifact, or a client-facing project overview.

## Prerequisites

1. Project compiled — `.project-spine/exports/rationale.md` exists. If not, switch to project-spine-kickoff.
2. User signed in — `spine whoami` returns a user. If not, run `spine login`.
3. Active workspace — `spine workspace current` returns a slug. If not, create or join one (project-spine-workspace).

## Publish

```bash
spine publish rationale
```

Defaults:

- Project name: taken from `spine.metadata.name` in `spine.json`.
- Title: `"<project-name> — Project rationale"`.
- Workspace: the active one.

Overrides:

```bash
spine publish rationale \
  --workspace my-agency \
  --title "Acme Payroll — kickoff context"
```

The CLI prints:

```
created rationale for "Acme demo" in workspace "my-agency"

  https://projectspine.dev/r/4gHsVAQ7dtQcoQ

  content hash: sha256:df6d...
  revoke with: spine rationale revoke 4gHsVAQ7dtQcoQ
```

**Copy the URL** and share it with the client. The slug is unguessable (10 bytes base64url).

## Re-publish after changes

The rationale is upserted by `(workspace, project_name)`. Re-running `spine publish rationale` after a recompile **updates the same URL** — the slug stays stable so you don't have to resend the link.

## Page properties

What the public URL looks like:

- Workspace name + brand color at the top.
- Markdown rendered with `sanitize-html` (no inline `<script>` can execute).
- `robots: noindex, nofollow` — not crawled by search engines.
- Anyone with the URL can read it; that's the accepted tradeoff.

## List published rationales

```bash
spine rationale list
spine rationale list --show-revoked    # include previously-revoked
```

## Revoke

When the engagement ends or you published something by mistake:

```bash
spine rationale revoke <public-slug>
```

The URL returns 404 immediately. The row is soft-deleted (retained for audit).

## Before publishing — reality check with the user

**Always** confirm with the user before the first publish:

> The rationale at `.project-spine/exports/rationale.md` will be public at a URL only people you share it with can find. It will include these sections: goals, audience, constraints, assumptions, risks, stack summary. Want me to publish?

Show them the rationale file content (or at least the headings) first. Give them a chance to say "let me edit `brief.md` first" — the published URL should not contain anything the client shouldn't see.

Specifically call out:

- **Risks** section — often candid language that's internal-team only.
- **Constraints** — sometimes lists vendor-specific costs or trade secrets.
- **Warnings** — if the brief was incomplete, warnings may surface.

If in doubt, offer: *"I can revoke it any time with `spine rationale revoke <slug>`."*

## What NOT to do

- Don't publish a rationale that includes credentials, internal URLs, or trade secrets. The scrubber doesn't run on rationales (it's an opt-in layer for LLM prompts). The user is responsible for the content of their brief.
- Don't publish without a compile first — the rationale is generated from `spine.json`, not from the brief directly.
- Don't share the URL in public tickets or mailing lists where search-engine-indexable backlinks might leak the slug.
