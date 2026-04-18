import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight liveness + config surface. Does not open a DB connection
 * on purpose — just reports whether the env is wired. Once we need a
 * readiness probe that actually pings Postgres, split this into /live
 * and /ready.
 */
export async function GET() {
  const env = process.env.VERCEL_ENV ?? "development";
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  const region = process.env.VERCEL_REGION ?? null;
  const db = process.env.POSTGRES_URL ? "configured" : "missing";

  return NextResponse.json({
    ok: true,
    service: "project-spine",
    env,
    commit,
    region,
    db,
    now: new Date().toISOString(),
  });
}
