import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { deviceCodes, users } from "@/db/schema";
import { exchangeCodeForToken, fetchGitHubUser } from "@/lib/github";
import { newId } from "@/lib/ids";
import { requireServerConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GitHub redirects here after the user approves. We:
 *  1. Verify the state matches our short-lived cookie.
 *  2. Exchange the code for an access token.
 *  3. Fetch the user, upsert by github_id.
 *  4. Attach user_id to the pending device_code row.
 *  5. Redirect to /device/approved — CLI picks up the token via /poll.
 *
 * We do NOT store GitHub's access token long-term. We only needed it to
 * identify the user. Our bearer tokens are issued at /poll.
 */
export async function GET(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectWithError(cfg.baseUrl, "bad-callback");
  }

  const jar = await cookies();
  const expectedState = jar.get("spine_device_session")?.value;
  const pendingDeviceCode = jar.get("spine_device_code")?.value;
  if (!expectedState || !pendingDeviceCode || expectedState !== state) {
    return redirectWithError(cfg.baseUrl, "state-mismatch");
  }

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
    return redirectWithError(cfg.baseUrl, "oauth-exchange-failed");
  }

  // Upsert the user.
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

  // Bind the user to the pending device_code row — but only if it's
  // still pending (not expired, not already bound, not consumed).
  const bound = await db
    .update(deviceCodes)
    .set({ userId })
    .where(and(eq(deviceCodes.deviceCode, pendingDeviceCode), isNull(deviceCodes.userId), isNull(deviceCodes.consumedAt)))
    .returning({ userCode: deviceCodes.userCode });

  // Clear the cookies regardless.
  jar.delete("spine_device_session");
  jar.delete("spine_device_code");

  if (bound.length === 0) {
    return redirectWithError(cfg.baseUrl, "device-code-unavailable");
  }

  return NextResponse.redirect(`${cfg.baseUrl}/device/approved?login=${encodeURIComponent(ghUser.login)}`, {
    status: 303,
  });
}

function redirectWithError(baseUrl: string, reason: string) {
  return NextResponse.redirect(`${baseUrl}/device?error=${encodeURIComponent(reason)}`, {
    status: 303,
  });
}
