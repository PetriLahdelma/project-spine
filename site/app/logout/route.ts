import { NextResponse } from "next/server";
import { clearSessionCookie, getWebSessionUser, revokeSession } from "@/lib/web-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getWebSessionUser();
  if (user) await revokeSession(user.sessionId);
  await clearSessionCookie();
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/", url).toString(), { status: 303 });
}
