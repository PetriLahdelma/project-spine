import { NextResponse } from "next/server";
import { and, desc, eq, sql as sqlExpr } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { driftSnapshots, projects } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { parseJsonBody, requireApiContext, requireWorkspaceMember, requireWriteAccess } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string }> };

const DriftItem = z.object({
  kind: z.string(),
  path: z.string().nullable().optional(),
  detail: z.string().optional(),
});

const PushDrift = z.object({
  projectSlug: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/, "lowercase-kebab"),
  projectName: z.string().min(1).max(200),
  storedSpineHash: z.string().nullable(),
  currentSpineHash: z.string().nullable(),
  clean: z.boolean(),
  counts: z.object({
    total: z.number().int().nonnegative(),
    inputDrift: z.number().int().nonnegative(),
    exportHandEdits: z.number().int().nonnegative(),
    missingExports: z.number().int().nonnegative(),
  }),
  items: z.array(DriftItem).max(1000),
});

/** CLI pushes a drift snapshot. Auto-creates the project on first push. */
export async function POST(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  const writeCheck = requireWriteAccess(access);
  if (writeCheck) return writeCheck;

  const body = await parseJsonBody(req, PushDrift);
  if (body instanceof NextResponse) return body;

  const normalizedSlug = slugify(body.projectSlug);
  const now = new Date();
  const snapshotId = newId();

  const result = await db.transaction(async (tx) => {
    // Upsert the project row.
    const [existing] = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.workspaceId, access.workspace.id), eq(projects.slug, normalizedSlug)))
      .limit(1);
    let projectId: string;
    if (existing) {
      projectId = existing.id;
      await tx
        .update(projects)
        .set({
          name: body.projectName,
          lastSpineHash: body.currentSpineHash ?? body.storedSpineHash,
          lastDriftAt: now,
          lastClean: body.clean ? "clean" : "drifted",
          updatedAt: now,
        })
        .where(eq(projects.id, existing.id));
    } else {
      projectId = newId();
      await tx.insert(projects).values({
        id: projectId,
        workspaceId: access.workspace.id,
        slug: normalizedSlug,
        name: body.projectName,
        lastSpineHash: body.currentSpineHash ?? body.storedSpineHash,
        lastDriftAt: now,
        lastClean: body.clean ? "clean" : "drifted",
      });
    }

    await tx.insert(driftSnapshots).values({
      id: snapshotId,
      projectId,
      storedSpineHash: body.storedSpineHash,
      currentSpineHash: body.currentSpineHash,
      clean: body.clean,
      totalItems: body.counts.total,
      inputDriftCount: body.counts.inputDrift,
      exportHandEditCount: body.counts.exportHandEdits,
      missingExportCount: body.counts.missingExports,
      items: body.items,
      pushedBy: ctx.user.id,
    });
    return { projectId, snapshotId, created: !existing };
  });

  return NextResponse.json(
    {
      workspace: access.workspace.slug,
      project: normalizedSlug,
      snapshotId: result.snapshotId,
      url: `${ctx.config.baseUrl}/w/${access.workspace.slug}/drift/${normalizedSlug}`,
      status: result.created ? "project_created" : "snapshot_added",
    },
    { status: result.created ? 201 : 200 },
  );
}

/** List fleet: every project with its latest drift state. */
export async function GET(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;

  const rows = await db
    .select({
      slug: projects.slug,
      name: projects.name,
      lastSpineHash: projects.lastSpineHash,
      lastDriftAt: projects.lastDriftAt,
      lastClean: projects.lastClean,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.workspaceId, access.workspace.id))
    .orderBy(desc(projects.lastDriftAt));

  // Suppress the unused sqlExpr import warning.
  void sqlExpr;

  return NextResponse.json({
    workspace: access.workspace.slug,
    count: rows.length,
    projects: rows,
  });
}
