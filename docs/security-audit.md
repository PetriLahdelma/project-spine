# Security audit — 2026-04-18

Focused adversarial review of the hosted surface right before any external user gets an invite. Scope: `site/` Next.js app + API, unified GitHub OAuth callback, workspace/template/rationale/drift/invite flows. CLI is out of scope for this pass (already offline-by-default).

## Findings

| # | Severity | Area | Issue | Status |
|---|---|---|---|---|
| 1 | **High** | `/r/[publicSlug]` | `marked` passes raw HTML through by default; a workspace member could publish a rationale containing `<script>…</script>` that executes for anyone visiting the public URL. | **Fixed** — `sanitize-html` via `lib/sanitize.ts`, allowlist-based, applied before `dangerouslySetInnerHTML`. |
| 2 | Medium | `/api/invite/[code]/accept` | Two accept clicks racing could insert two membership rows or raise a primary-key violation 500. | **Fixed** — `onConflictDoNothing((workspace_id, user_id))` so the second click is idempotent. |
| 3 | Medium | Response headers | No CSP header; XSS defense-in-depth missing. | **Added** — `Content-Security-Policy` + `Permissions-Policy` in `next.config.mjs`. |
| 4 | Low | Device flow | No rate limiting on `/api/auth/device` or `/poll`. Brute-forcing a user_code is impractical (31⁸ space, 15-min TTL, few active at a time), but documenting. | Deferred — Vercel provides base-level DDoS, revisit when we have >10 active workspaces. |
| 5 | Low | CLI bearer tokens | Never expire. Acceptable for CLI ergonomics. | Accepted — documented in `SECURITY.md`. |
| 6 | Info | OAuth callback | Unified device + web flow. State confusion impossible because each flow sets its own cookie; the handler matches the state to the cookie that's actually present, not to a switch arg. | Clean. |
| 7 | Info | Rationale URLs | Unguessable 10-byte slug, revocable, `noindex,nofollow`. Agency publishes; they're responsible for what goes in the markdown. | Documented in `/terms`. |
| 8 | Info | Workspace enumeration | Non-members get 404, not 403. Existence not leaked. | Clean. |
| 9 | Info | Session revocation | Both CLI (`auth_tokens.revoked_at`) and web (`web_sessions.revoked_at`) filter on revoked; time-based expiry on web sessions. | Clean. |
| 10 | Info | Markdown scheme allowlist | Sanitizer allows only `http`, `https`, `mailto` in anchors and `http`, `https`, `data` in images. `javascript:` URLs stripped. | Clean. |

## What the attacker might try

- **Publish a rationale containing `<img src=x onerror=fetch('/api/whoami').then(...)`.** Neutralised — `onerror` is not in the attribute allowlist.
- **Publish a rationale containing `[link](javascript:alert(1))`.** Neutralised — scheme allowlist does not include `javascript`.
- **Replay a device flow state in a web callback** to steal a session. Impossible — the callback matches state against the specific cookie that's present; a device flow has no `spine_web_state` set, so the web branch never fires.
- **Race two invite accepts from two browsers.** Now idempotent via PK + `onConflictDoNothing`.
- **Visit `/w/someone-elses-workspace`** logged in as a non-member. 404-style redirect; membership check enforced at the query level (inner join).

## What we explicitly accept

- **Client briefs in the database.** We store `brief_md`, `design_rules_md`, and template content when a workspace member pushes them. The privacy policy documents this; deletion is on request.
- **Drift item details in the DB.** File paths referenced in drift reports are stored in `drift_snapshots.items` JSONB.
- **Rationale content is trust-the-publisher.** We don't run anti-malware on markdown — we sanitize the rendered HTML but don't inspect the intent of what's published.

## Things to revisit when we have paying users

- **Rate limiting** on `/api/auth/device`, `/api/auth/device/poll`, `/api/workspaces/:slug/invites`.
- **Per-workspace audit log** (who pushed what, when). A new table would do it; surfaces as an admin-only page.
- **Security.txt** at `/.well-known/security.txt`.
- **Per-request CSP nonces** — remove `'unsafe-inline'` from `script-src` once Next.js 16 ships stable nonces.
- **Session invalidation on role change** — right now a member->none demotion doesn't invalidate cached sessions.

## Verdict

No blocking issues remaining after this pass. Fixes landed in the same commit as this document.
