import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { deviceCodes } from "@/db/schema";
import { githubAuthorizeUrl } from "@/lib/github";
import { newDeviceCode } from "@/lib/ids";
import { requireServerConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The /device page form POSTs the user_code here. We look up the pending
 * device_code row, attach a short-lived cookie binding the browser session
 * to that row, and redirect to GitHub's OAuth authorize URL. GitHub will
 * redirect back to /api/auth/github/callback, which reads the cookie.
 */
export async function POST(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  const form = await req.formData().catch(() => null);
  const userCodeRaw = form?.get("code");
  if (typeof userCodeRaw !== "string") {
    return redirectWithError(cfg.baseUrl, "missing-code");
  }
  const userCode = userCodeRaw.trim().toUpperCase();

  const [row] = await db
    .select()
    .from(deviceCodes)
    .where(eq(deviceCodes.userCode, userCode))
    .limit(1);
  if (!row) return redirectWithError(cfg.baseUrl, "unknown-code");
  if (row.consumedAt) return redirectWithError(cfg.baseUrl, "already-used");
  if (row.expiresAt.getTime() < Date.now()) return redirectWithError(cfg.baseUrl, "expired");

  // Sign the device_code into an opaque state param. We store an opaque
  // session id in a cookie so the callback can look up the pending row.
  const session = newDeviceCode();
  const jar = await cookies();
  jar.set("spine_device_session", session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  jar.set("spine_device_code", row.deviceCode, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  const authorizeUrl = githubAuthorizeUrl({
    clientId: cfg.githubClientId,
    redirectUri: `${cfg.baseUrl}/api/auth/github/callback`,
    state: session,
  });

  return NextResponse.redirect(authorizeUrl, { status: 303 });
}

function redirectWithError(baseUrl: string, reason: string) {
  return NextResponse.redirect(`${baseUrl}/device?error=${encodeURIComponent(reason)}`, {
    status: 303,
  });
}
