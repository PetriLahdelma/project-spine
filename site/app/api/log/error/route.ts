import { NextResponse, type NextRequest } from "next/server";

/**
 * Client error sink. The marketing and global error boundaries POST a compact
 * JSON payload here on mount so production errors surface in Vercel's log
 * stream instead of only landing in the user's browser console. No tracking
 * pixels, no third-party reporter, no cookies — just a single line per event
 * that shows up under Observability on the deployment.
 *
 * The payload is user-controlled in the loose sense (a browser produced it),
 * so everything is length-capped before it reaches console.error.
 */

const MAX_STRING = 2000;
const MAX_STACK = 4000;

type ErrorLogPayload = {
  scope?: string;
  message?: string;
  digest?: string;
  stack?: string;
  href?: string;
  ua?: string;
};

function cap(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ErrorLogPayload;
  try {
    body = (await req.json()) as ErrorLogPayload;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const record = {
    at: new Date().toISOString(),
    scope: cap(body.scope, 64) ?? "client",
    message: cap(body.message, MAX_STRING) ?? "(no message)",
    digest: cap(body.digest, 128),
    href: cap(body.href, 512),
    ua: cap(body.ua, 256) ?? cap(req.headers.get("user-agent"), 256),
    stack: cap(body.stack, MAX_STACK),
    ip: req.headers.get("x-forwarded-for") ?? null,
  };

  // Single-line log; Vercel captures stdout/stderr from route handlers.
  console.error("[client-error]", JSON.stringify(record));

  return NextResponse.json({ ok: true });
}
