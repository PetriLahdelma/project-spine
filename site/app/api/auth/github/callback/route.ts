import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { deviceCodes, memberships, users } from "@/db/schema";
import { exchangeCodeForToken, fetchGitHubUser } from "@/lib/github";
import { newId } from "@/lib/ids";
import { requireServerConfig } from "@/lib/config";
import { createWebSession, setSessionCookie } from "@/lib/web-auth";
import { callerIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unified GitHub OAuth callback. Distinguishes:
 *   - device flow: `spine_device_session` cookie is set → bind user to the
 *     pending device_code row, redirect to /device/approved.
 *   - web flow: `spine_web_state` cookie is set → create a web session,
 *     redirect to the stored next path.
 * A mismatch or missing state sends the user back to /device with a reason.
 */
export async function GET(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  // Defends the OAuth exchange from a thundering-herd or replay flood.
  const rl = await rateLimit({ key: `auth:callback:${callerIp(req)}`, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return redirect(cfg.baseUrl, "/login?error=rate-limited");
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return redirect(cfg.baseUrl, "/device?error=bad-callback");

  const jar = await cookies();
  const deviceState = jar.get("spine_device_session")?.value;
  const devicePending = jar.get("spine_device_code")?.value;
  const webState = jar.get("spine_web_state")?.value;
  const webNext = jar.get("spine_web_next")?.value ?? "/";

  const isDevice = deviceState && devicePending && deviceState === state;
  const isWeb = webState && webState === state;
  if (!isDevice && !isWeb) return redirect(cfg.baseUrl, "/device?error=state-mismatch");

  let ghUser;
  try {
    const { accessToken } = await exchangeCodeForToken({
      clientId: cfg.githubClientId,
      clientSecret: cfg.githubClientSecret,
      code,
      redirectUri: `${cfg.baseUrl}/api/auth/github/callback`,
    });
    ghUser = await fetchGitHubUser(accessToken);
  } catch (err) {
    console.error("[github-callback]", err);
    return redirect(cfg.baseUrl, "/device?error=oauth-exchange-failed");
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.githubId, ghUser.id))
    .limit(1);
  const now = new Date();
  let userId: string;
  if (existing) {
    userId = existing.id;
    await db
      .update(users)
      .set({
        githubLogin: ghUser.login,
        email: ghUser.email,
        name: ghUser.name,
        avatarUrl: ghUser.avatar_url,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id));
  } else {
    userId = newId();
    await db.insert(users).values({
      id: userId,
      githubId: ghUser.id,
      githubLogin: ghUser.login,
      email: ghUser.email,
      name: ghUser.name,
      avatarUrl: ghUser.avatar_url,
    });
  }

  jar.delete("spine_device_session");
  jar.delete("spine_device_code");
  jar.delete("spine_web_state");
  jar.delete("spine_web_next");

  if (isDevice) {
    const bound = await db
      .update(deviceCodes)
      .set({ userId })
      .where(
        and(
          eq(deviceCodes.deviceCode, devicePending!),
          isNull(deviceCodes.userId),
          isNull(deviceCodes.consumedAt),
        ),
      )
      .returning({ userCode: deviceCodes.userCode });
    if (bound.length === 0) return redirect(cfg.baseUrl, "/device?error=device-code-unavailable");
    return redirect(
      cfg.baseUrl,
      `/device/approved?login=${encodeURIComponent(ghUser.login)}`,
    );
  }

  const h = await nextHeaders();
  const ua = h.get("user-agent") ?? null;
  const sessionId = await createWebSession(userId, ua);
  await setSessionCookie(sessionId);

  // First-time users with no memberships land on the onboarding flow so
  // signing in actually means something. Users who came here via a
  // specific `next` (invite acceptance, deep link, etc.) keep that target.
  const next = safeNext(webNext);
  if (next === "/") {
    const [hasMembership] = await db
      .select({ id: memberships.userId })
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);
    if (!hasMembership) return redirect(cfg.baseUrl, "/workspaces/new?welcome=1");
  }
  return redirect(cfg.baseUrl, next);
}

function redirect(baseUrl: string, path: string): NextResponse {
  return NextResponse.redirect(`${baseUrl}${path}`, { status: 303 });
}

function safeNext(path: string): string {
  if (!path || !path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  return path;
}
