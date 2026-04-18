import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { rationales } from "@/db/schema";
import { requireApiContext, requireWorkspaceMember, requireWriteAccess } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string; publicSlug: string }> };

/** Revoke (soft-delete) a rationale. The public /r/<slug> then 404s. */
export async function DELETE(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug, publicSlug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  const writeCheck = requireWriteAccess(access);
  if (writeCheck) return writeCheck;

  const result = await db
    .update(rationales)
    .set({ revokedAt: new Date() })
    .where(and(eq(rationales.workspaceId, access.workspace.id), eq(rationales.publicSlug, publicSlug)))
    .returning({ publicSlug: rationales.publicSlug });

  if (result.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ revoked: result[0]!.publicSlug });
}
