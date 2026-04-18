import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { githubAuthorizeUrl } from "@/lib/github";
import { requireServerConfig } from "@/lib/config";
import { callerIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Web OAuth entry. Distinct from the device-flow — this path sets a
 * `spine_web_state` cookie that the callback distinguishes from
 * `spine_device_session`. Return path is optional via ?next=/w/slug.
 */
export async function GET(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  const rl = await rateLimit({ key: `auth:github-login:${callerIp(req)}`, limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.redirect(`${cfg.baseUrl}/login?error=rate-limited`, { status: 303 });
  }

  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/";

  const state = randomBytes(32).toString("base64url");
  const jar = await cookies();
  jar.set("spine_web_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  jar.set("spine_web_next", next, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const authorizeUrl = githubAuthorizeUrl({
    clientId: cfg.githubClientId,
    redirectUri: `${cfg.baseUrl}/api/auth/github/callback`,
    state,
  });
  return NextResponse.redirect(authorizeUrl, { status: 303 });
}
