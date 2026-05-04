# Database setup — dormant hosted experiment

This applies only to the dormant hosted workspace experiment. The public OSS CLI does not route hosted workspace commands; its normal compile/drift/template path remains local-first and never touches a database.

## Provision Vercel Postgres

1. Vercel dashboard → **project-spine** → **Storage → Create Database**.
2. Pick **Postgres** (Neon-backed).
3. Name it `project-spine-db`.
4. Region: `iad1` (US East) or `arn1` (Stockholm) depending on your audience. Functions run in `iad1` by default, so co-locate for latency.
5. Link it to the `project-spine` project. Vercel auto-injects these env vars:
   - `POSTGRES_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DATABASE` / `POSTGRES_HOST`

## Pull env vars locally

```bash
cd site
vercel env pull .env.local
```

Verify `.env.local` contains `POSTGRES_URL=postgres://...`.

## Run the first migration

```bash
cd site
npm install                     # drizzle-orm + drizzle-kit + @vercel/postgres
npx drizzle-kit generate        # materializes db/migrations/*.sql from db/schema.ts
npx drizzle-kit push            # applies to the Postgres instance
```

`push` is the dev-friendly path — it syncs the schema without tracking migration state. For production releases we'll switch to `migrate` with a migration table once the schema stabilizes.

## Schema at a glance

Six tables, all defined in [`site/db/schema.ts`](../site/db/schema.ts):

| Table | Purpose |
|---|---|
| `users` | GitHub-authenticated users (github_id, email, avatar) |
| `workspaces` | Agency/team container (slug, name, brand color, logo) |
| `memberships` | user ↔ workspace with role (`owner` / `admin` / `member`) |
| `templates` | Workspace-owned templates (manifest JSON, brief, optional design rules, content hash) |
| `device_codes` | Short-lived OAuth device-flow pairs |
| `auth_tokens` | Long-lived CLI bearer tokens (we store only sha256; plaintext never hits the DB) |

## Health check

Once the env is wired:

```bash
curl https://projectspine.dev/api/health
# -> { ok: true, db: "configured", ... }
```

`db: "configured"` just means `POSTGRES_URL` is set. We don't ping the connection on every health check — a dedicated `/api/ready` will do that later.

## What's still manual

- **GitHub OAuth app.** Create one at github.com/settings/developers; callback `https://projectspine.dev/api/auth/github/callback`. We'll wire it in Phase 1.3.
- **Secrets.** The GitHub OAuth client secret goes in `GITHUB_OAUTH_CLIENT_SECRET` (Vercel env var, Production + Preview). Never commit it.
