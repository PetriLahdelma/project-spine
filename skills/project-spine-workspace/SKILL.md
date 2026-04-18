---
name: project-spine-workspace
description: Use when the user wants to set up a shared agency workspace, join one a teammate invited them to, invite a teammate, or manage workspace membership. Phrases like "create a workspace for my agency", "join my team's workspace", "invite a teammate to share templates", "list workspace members", "use the team's templates".
---

# Workspace lifecycle

**Goal:** stand up or join a hosted workspace so a team can share templates, drift state, and rationale publishing across all their client projects.

## Prerequisites

- CLI ≥ 0.8.1.
- The user has a GitHub account (required for login).

## Flow A — the user is the workspace owner (first time)

```bash
spine login
# opens browser; user approves on GitHub; CLI prints "signed in as <login>"

spine workspace create my-agency \
  --name "My agency" \
  --description "Shared templates for client projects"
```

`spine workspace create` makes the user the owner and sets the workspace active. Templates saved with `--location workspace` now push here.

## Flow B — the user was invited to an existing workspace

The invite arrives as a URL like `https://projectspine.dev/invite/<code>` (7-day TTL, single-use).

Walk the user through:

1. Open the URL in a browser.
2. Sign in with GitHub (one-click if they've used Project Spine before).
3. Accept the invite — they land on the workspace page.

Then in their terminal:

```bash
spine login         # one-time, if they haven't already on this machine
spine workspace list
```

The workspace they just joined appears in the list. Switch to it:

```bash
spine workspace switch <slug>
```

## Flow C — invite a teammate (owner or admin only)

From the CLI:

```bash
spine workspace invite --role member
# prints an invite URL + expiry
```

Or from the web UI:

1. Open `https://projectspine.dev/w/<slug>` (the workspace page).
2. Use the "Invite a teammate" panel at the bottom.
3. Pick role (member or admin), click "Create invite link", copy the URL.

Roles today:

- **owner** — full control; created the workspace.
- **admin** — can invite, push/pull templates, publish rationales, push drift, revoke invites.
- **member** — same as admin today (role distinction matures in later releases).

## Flow D — check who's in the workspace

```bash
spine workspace members
```

Lists every member with their role and join date.

## Workspace + templates + rationale + drift chain

Once a workspace exists:

- Save a template to it: `spine template save --location workspace --name <n>`
- Pull a template from it: `spine template pull <name>`
- Publish a rationale under its branding: `spine publish rationale`
- Push drift results into its fleet view: `spine drift check --push`

Chain to **project-spine-template**, **project-spine-rationale**, or **project-spine-drift** for each of those.

## CI and automation

For pushing from CI (no browser), use the env-var override:

```bash
# on the user's local machine, once:
spine login
cat ~/.project-spine/config.json   # copy `auth.token` to a GitHub Actions secret

# in CI:
env:
  SPINE_API_TOKEN: ${{ secrets.SPINE_API_TOKEN }}
  SPINE_WORKSPACE: my-agency
```

The CLI honors `SPINE_API_TOKEN` + `SPINE_WORKSPACE` without needing a config file.

## Env var overrides for scripted use

| Var | Purpose |
|---|---|
| `SPINE_API_TOKEN` | Bearer token from `~/.project-spine/config.json` auth.token |
| `SPINE_WORKSPACE` | Active workspace slug (overrides config) |
| `SPINE_API_URL` | Override API base URL (default `https://projectspine.dev`) |
| `ANTHROPIC_API_KEY` | For `--enrich` on compile |

## What NOT to do

- Don't commit `~/.project-spine/config.json` — it contains the bearer token. The file is chmod 0600 by default.
- Don't share invite URLs in public channels (they're single-use; if used by the wrong person, revoke via the workspace page).
- Don't create a workspace per-project. One workspace per team/agency is the expected pattern; projects live inside as `projects` rows populated by `spine drift check --push`.

## Troubleshooting

- `not signed in` after `spine login` succeeded → token write may have failed; check `~/.project-spine/config.json` exists and contains an `auth` object.
- `workspace not found` → either the slug is wrong or the user isn't a member. List workspaces with `spine workspace list`.
- `invite expired` after 7 days → ask the owner to create a fresh one.
