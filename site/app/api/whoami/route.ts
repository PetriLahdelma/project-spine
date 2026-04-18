import { NextResponse } from "next/server";
import { authenticateBearer, extractBearer } from "@/lib/auth";
import { requireServerConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;

  const token = extractBearer(req.headers.get("authorization"));
  const user = await authenticateBearer(token);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    github_login: user.githubLogin,
    email: user.email,
    name: user.name,
    avatar_url: user.avatarUrl,
  });
}
