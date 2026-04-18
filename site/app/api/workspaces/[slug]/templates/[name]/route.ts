import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { requireApiContext, requireWorkspaceMember, requireWriteAccess } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string; name: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug, name } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;

  const [row] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.workspaceId, access.workspace.id), eq(templates.name, name)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    workspace: access.workspace.slug,
    name: row.name,
    title: row.title,
    description: row.description,
    projectType: row.projectType,
    manifest: row.manifestJson,
    briefMd: row.briefMd,
    designRulesMd: row.designRulesMd,
    contentHash: row.contentHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug, name } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  const writeCheck = requireWriteAccess(access);
  if (writeCheck) return writeCheck;

  const result = await db
    .delete(templates)
    .where(and(eq(templates.workspaceId, access.workspace.id), eq(templates.name, name)))
    .returning({ name: templates.name });

  if (result.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ deleted: result[0]!.name });
}
