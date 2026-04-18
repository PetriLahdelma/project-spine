import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { rationales } from "@/db/schema";
import { newId } from "@/lib/ids";
import { parseJsonBody, requireApiContext, requireWorkspaceMember, requireWriteAccess } from "@/lib/api";
import { newRationaleSlug, rationaleContentHash } from "@/lib/rationale-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PublishRationale = z.object({
  projectName: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  spineHash: z.string().min(8).max(128),
  contentMd: z.string().min(1).max(200_000),
});

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;

  const rows = await db
    .select({
      id: rationales.id,
      publicSlug: rationales.publicSlug,
      projectName: rationales.projectName,
      title: rationales.title,
      spineHash: rationales.spineHash,
      contentHash: rationales.contentHash,
      publishedAt: rationales.publishedAt,
      updatedAt: rationales.updatedAt,
      revokedAt: rationales.revokedAt,
    })
    .from(rationales)
    .where(eq(rationales.workspaceId, access.workspace.id))
    .orderBy(asc(rationales.projectName));

  return NextResponse.json({
    workspace: access.workspace.slug,
    count: rows.length,
    rationales: rows.map((r) => ({
      ...r,
      url: `${ctx.config.baseUrl}/r/${r.publicSlug}`,
      revoked: r.revokedAt !== null,
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  const writeCheck = requireWriteAccess(access);
  if (writeCheck) return writeCheck;

  const body = await parseJsonBody(req, PublishRationale);
  if (body instanceof NextResponse) return body;

  const contentHash = rationaleContentHash({
    projectName: body.projectName,
    title: body.title,
    spineHash: body.spineHash,
    contentMd: body.contentMd,
  });

  // Look for an existing (un-revoked) rationale for this project.
  const [existing] = await db
    .select()
    .from(rationales)
    .where(
      and(
        eq(rationales.workspaceId, access.workspace.id),
        eq(rationales.projectName, body.projectName),
        isNull(rationales.revokedAt),
      ),
    )
    .limit(1);

  const now = new Date();
  let publicSlug: string;
  let created: boolean;
  if (existing) {
    publicSlug = existing.publicSlug;
    created = false;
    await db
      .update(rationales)
      .set({
        title: body.title,
        spineHash: body.spineHash,
        contentMd: body.contentMd,
        contentHash,
        updatedAt: now,
      })
      .where(eq(rationales.id, existing.id));
  } else {
    publicSlug = newRationaleSlug();
    created = true;
    await db.insert(rationales).values({
      id: newId(),
      workspaceId: access.workspace.id,
      publicSlug,
      projectName: body.projectName,
      title: body.title,
      spineHash: body.spineHash,
      contentMd: body.contentMd,
      contentHash,
      publishedBy: ctx.user.id,
    });
  }

  return NextResponse.json(
    {
      workspace: access.workspace.slug,
      projectName: body.projectName,
      title: body.title,
      contentHash,
      publicSlug,
      url: `${ctx.config.baseUrl}/r/${publicSlug}`,
      status: created ? "created" : "updated",
    },
    { status: created ? 201 : 200 },
  );
}
