import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, deviceCodes } from "@/db/schema";
import { newBearerToken, newId } from "@/lib/ids";
import { hashToken } from "@/lib/auth";
import { requireServerConfig } from "@/lib/config";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CLI polls for auth completion. Semantics follow RFC 8628 device grant:
 * - 202 authorization_pending — user hasn't approved yet
 * - 410 expired — exceeded 15-min window
 * - 410 already_consumed — some other poll already took the token
 * - 200 + {access_token} — success
 *
 * We issue ONE bearer token per device_code, marking the row consumed
 * atomically to prevent racing polls from double-issuing.
 */
export async function POST(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  const body = (await req.json().catch(() => null)) as { device_code?: string; label?: string } | null;
  const deviceCode = body?.device_code;
  if (!deviceCode || typeof deviceCode !== "string") {
    return NextResponse.json({ error: "bad_request", message: "missing device_code" }, { status: 400 });
  }

  // Per-device_code limit. Client's advertised interval is 5s, so 30/min gives
  // a 2× safety margin for retries without enabling spin loops. A malicious
  // caller forging many device_codes is handled at the /api/auth/device limit.
  const rl = await rateLimit({ key: `auth:poll:${deviceCode}`, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "slow_down", message: "Polling too fast. Respect the interval field." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const [row] = await db
    .select()
    .from(deviceCodes)
    .where(eq(deviceCodes.deviceCode, deviceCode))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "invalid_device_code" }, { status: 404 });
  }
  if (row.consumedAt) {
    return NextResponse.json({ error: "already_consumed" }, { status: 410 });
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "expired_token" }, { status: 410 });
  }
  if (!row.userId) {
    return NextResponse.json({ error: "authorization_pending" }, { status: 202 });
  }

  // Atomic consume — the WHERE clause ensures only the first race winner flips
  // the row from unconsumed to consumed.
  const consumed = await db
    .update(deviceCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(deviceCodes.deviceCode, deviceCode), isNull(deviceCodes.consumedAt)))
    .returning({ consumedAt: deviceCodes.consumedAt });
  if (consumed.length === 0) {
    return NextResponse.json({ error: "already_consumed" }, { status: 410 });
  }

  const bearer = newBearerToken();
  const tokenId = newId();
  const label = typeof body?.label === "string" ? body.label.slice(0, 120) : null;
  await db.insert(authTokens).values({
    id: tokenId,
    userId: row.userId,
    tokenHash: hashToken(bearer),
    label,
    scopes: ["workspace:read", "workspace:write", "template:read", "template:write"],
  });

  return NextResponse.json(
    {
      access_token: bearer,
      token_type: "Bearer",
      scope: "workspace:read workspace:write template:read template:write",
      user_id: row.userId,
    },
    { status: 200 },
  );
}
