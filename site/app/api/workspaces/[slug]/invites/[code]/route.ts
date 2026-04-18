import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceInvites } from "@/db/schema";
import { requireApiContext, requireWorkspaceMember } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string; code: string }> };

/**
 * Revoke a pending invite. Owner/admin only. Soft-delete — the /invite/:code
 * page starts showing the "revoked" error once this flips.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug, code } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  if (access.role !== "owner" && access.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await db
    .update(workspaceInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(workspaceInvites.workspaceId, access.workspace.id),
        eq(workspaceInvites.code, code),
      ),
    )
    .returning({ code: workspaceInvites.code });

  if (result.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ revoked: result[0]!.code });
}
