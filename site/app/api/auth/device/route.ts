import { NextResponse } from "next/server";
import { db } from "@/db";
import { deviceCodes } from "@/db/schema";
import { newDeviceCode, newUserCode } from "@/lib/ids";
import { requireServerConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Device-flow life: 15 min, matches GitHub's own device flow window. */
const LIFESPAN_MS = 15 * 60 * 1000;
const POLL_INTERVAL_S = 5;

/**
 * CLI starts the device flow. Returns a user_code for the human to type at
 * /device, and a device_code the CLI polls with.
 */
export async function POST(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  // Light payload — `label` lets the CLI name the token in the DB,
  // so a user can see "MacBook Pro" vs "CI bot" when reviewing sessions.
  let label: string | null = null;
  try {
    const body = (await req.json().catch(() => null)) as { label?: string } | null;
    if (body?.label && typeof body.label === "string") {
      label = body.label.slice(0, 120);
    }
  } catch {
    // body is optional
  }

  const deviceCode = newDeviceCode();
  const userCode = newUserCode();
  const expiresAt = new Date(Date.now() + LIFESPAN_MS);

  await db.insert(deviceCodes).values({
    deviceCode,
    userCode,
    expiresAt,
    userId: null,
    consumedAt: null,
  });

  return NextResponse.json(
    {
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${cfg.baseUrl}/device`,
      verification_uri_complete: `${cfg.baseUrl}/device?code=${userCode}`,
      expires_in: Math.floor(LIFESPAN_MS / 1000),
      interval: POLL_INTERVAL_S,
      label,
    },
    { status: 201 },
  );
}
