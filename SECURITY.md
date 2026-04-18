# Security policy

## Reporting a vulnerability

If you find a security issue in Project Spine, please report it privately:

- **Email:** security@projectspine.dev
- **GitHub:** use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repo.

Please do **not** open a public issue for a suspected vulnerability.

## What to include

- A clear description of the issue and its impact.
- Steps to reproduce, ideally with a minimal example.
- The version of the CLI (`spine --version`) and your Node version.
- Any PoC code or output.
- For the hosted service, include the approximate timestamp and `x-vercel-id` header if available.

## What to expect

- Acknowledgement within 72 hours.
- An initial assessment within 7 days.
- A coordinated disclosure timeline agreed with you.

## Security posture — CLI

The CLI is designed to minimize exposure:

- **No implicit network calls** for compile, drift, or export. The CLI reads your repo and writes files locally only.
- **No repo content uploaded** unless you explicitly opt into a workspace (`spine template save --location workspace`, `spine publish rationale`, `spine drift check --push`).
- **LLM enrichment, when it lands, is opt-in** and requires an explicit API key in your environment. Content sent to an LLM is run through a secrets scrubber (`.env` contents, common key patterns); don't rely on this as your only line of defense.

If you suspect the CLI is doing something it shouldn't, you can audit the compile pipeline in `src/compiler/compile.ts`. Phases 1–3 are deterministic and network-free by design.

## Security posture — hosted service (projectspine.dev)

The hosted service at `projectspine.dev` exists to sync templates, publish rationales, and collect drift snapshots. It runs on Vercel (serverless Node.js + Edge CDN) with Postgres on Neon.

- **Authentication:** GitHub OAuth device flow for CLI. Bearer tokens are stored in `~/.project-spine/config.json` with `0600` permissions. Plaintext tokens are never written to the database — we store only sha256 hashes and compare at request time.
- **OAuth state:** the `/api/auth/device/verify` → GitHub → `/api/auth/github/callback` hop uses a short-lived HttpOnly, Secure, SameSite=Lax cookie and a bound device_code to prevent cross-device session fixation.
- **Authorization:** every workspace API route requires both a valid bearer and membership. Non-members get 404 (not 403), so workspace existence is not leaked.
- **Public rationales:** URLs use an unguessable 10-byte base64url slug. They can be revoked anytime with `spine rationale revoke`. Revoked rows soft-delete; the public URL returns 404. Rationales set `noindex, nofollow`.
- **Input validation:** every JSON API body goes through a zod schema before touching the database.
- **Transport:** HTTPS only. `.dev` is HSTS-preloaded by the root TLD; we additionally send our own `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header.
- **Security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` on every response.
- **GitHub OAuth client secret:** stored only in Vercel's encrypted env vars, marked sensitive so it's write-only in the dashboard.
- **Database:** one single-tenant Neon Postgres instance in `iad1`. Row-level isolation is enforced at query time by joining on `memberships.user_id`.
- **Secrets in flight:** a device_code is never returned to anyone except the CLI that created it; the user_code is the user-facing half of the pair and is only useful together with an active session cookie.

Operational details that matter to auditors:

- **No request bodies** are logged by default (Vercel logs access lines only).
- **Tokens never appear in logs.** API routes don't print auth headers.
- **Dependencies** are scanned via Dependabot; the repo uses grouped `runtime-deps` / `dev-deps` updates on a weekly cadence.

## Data handling

See the [privacy policy](https://projectspine.dev/privacy) for what we collect, where it's stored, and how to get it deleted. For CLI-only use the answer is simpler: nothing leaves your machine until you run a workspace command.

## Supported versions

This project is pre-1.0. Security fixes ship against the latest minor. Older versions are not patched.

## Coordinated disclosure

We aim to coordinate on a fix timeline that works for both sides:

- Critical (RCE, auth bypass, data exposure): emergency patch within 72 hours where possible, public advisory after a fix is live.
- High: patch within 7 days.
- Medium/low: rolled into the next regular release, noted in the changelog.

Credit is given in the release notes unless you'd prefer otherwise.
