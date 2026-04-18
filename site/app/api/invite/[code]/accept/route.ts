import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces, workspaceInvites } from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";
import { requireServerConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ code: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const cfg = requireServerConfig();
  if (cfg instanceof NextResponse) return cfg;
  const user = await getWebSessionUser();
  if (!user) {
    const url = new URL(req.url);
    return NextResponse.redirect(`${cfg.baseUrl}/login?next=${encodeURIComponent(url.pathname.replace("/accept", ""))}`, { status: 303 });
  }

  const { code } = await params;
  const [invite] = await db
    .select({
      id: workspaceInvites.id,
      workspaceId: workspaceInvites.workspaceId,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      acceptedAt: workspaceInvites.acceptedAt,
      revokedAt: workspaceInvites.revokedAt,
      workspaceSlug: workspaces.slug,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .where(eq(workspaceInvites.code, code))
    .limit(1);
  if (!invite) return NextResponse.redirect(`${cfg.baseUrl}/invite/${encodeURIComponent(code)}?error=unknown`, { status: 303 });
  if (invite.revokedAt) return NextResponse.redirect(`${cfg.baseUrl}/invite/${encodeURIComponent(code)}?error=revoked`, { status: 303 });
  if (invite.acceptedAt) return NextResponse.redirect(`${cfg.baseUrl}/invite/${encodeURIComponent(code)}?error=already-used`, { status: 303 });
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(`${cfg.baseUrl}/invite/${encodeURIComponent(code)}?error=expired`, { status: 303 });
  }

  // Already a member? Just bounce to the workspace page.
  const [existingMember] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, invite.workspaceId), eq(memberships.userId, user.id)))
    .limit(1);

  if (!existingMember) {
    await db.insert(memberships).values({
      workspaceId: invite.workspaceId,
      userId: user.id,
      role: invite.role,
    });
  }
  await db
    .update(workspaceInvites)
    .set({ acceptedBy: user.id, acceptedAt: new Date() })
    .where(and(eq(workspaceInvites.id, invite.id), isNull(workspaceInvites.acceptedAt)));

  return NextResponse.redirect(`${cfg.baseUrl}/w/${invite.workspaceSlug}?welcome=1`, { status: 303 });
}
