import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { driftSnapshots, projects } from "@/db/schema";
import { requireApiContext, requireWorkspaceMember } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string; projectSlug: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug, projectSlug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.workspaceId, access.workspace.id), eq(projects.slug, projectSlug)))
    .limit(1);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const snapshots = await db
    .select({
      id: driftSnapshots.id,
      capturedAt: driftSnapshots.capturedAt,
      clean: driftSnapshots.clean,
      storedSpineHash: driftSnapshots.storedSpineHash,
      currentSpineHash: driftSnapshots.currentSpineHash,
      totalItems: driftSnapshots.totalItems,
      inputDriftCount: driftSnapshots.inputDriftCount,
      exportHandEditCount: driftSnapshots.exportHandEditCount,
      missingExportCount: driftSnapshots.missingExportCount,
    })
    .from(driftSnapshots)
    .where(eq(driftSnapshots.projectId, project.id))
    .orderBy(desc(driftSnapshots.capturedAt))
    .limit(50);

  return NextResponse.json({
    workspace: access.workspace.slug,
    project: {
      slug: project.slug,
      name: project.name,
      lastSpineHash: project.lastSpineHash,
      lastClean: project.lastClean,
      lastDriftAt: project.lastDriftAt,
      createdAt: project.createdAt,
    },
    snapshots,
  });
}
