import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { newId } from "@/lib/ids";
import { parseJsonBody, requireApiContext, requireWorkspaceMember, requireWriteAccess } from "@/lib/api";
import { templateContentHash } from "@/lib/template-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectType = z.enum([
  "saas-marketing",
  "app-dashboard",
  "design-system",
  "docs-portal",
  "extension",
  "other",
]);

const contributes = z.object({
  routes: z.array(z.string()).default([]),
  components: z.array(z.string()).default([]),
  qa: z.array(z.string()).default([]),
  uxRules: z.array(z.string()).default([]),
  a11yRules: z.array(z.string()).default([]),
  agentDos: z.array(z.string()).default([]),
  agentDonts: z.array(z.string()).default([]),
  unsafeActions: z.array(z.string()).default([]),
});

const PushTemplate = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/, "lowercase-kebab"),
  title: z.string().min(1).max(160),
  description: z.string().max(500).default(""),
  projectType: projectType,
  contributes: contributes,
  briefMd: z.string().min(1).max(65536),
  designRulesMd: z.string().max(65536).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;

  const rows = await db
    .select({
      name: templates.name,
      title: templates.title,
      description: templates.description,
      projectType: templates.projectType,
      contentHash: templates.contentHash,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
    })
    .from(templates)
    .where(eq(templates.workspaceId, access.workspace.id))
    .orderBy(asc(templates.name));

  return NextResponse.json({
    workspace: access.workspace.slug,
    count: rows.length,
    templates: rows,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  const writeCheck = requireWriteAccess(access);
  if (writeCheck) return writeCheck;

  const body = await parseJsonBody(req, PushTemplate);
  if (body instanceof NextResponse) return body;

  const manifestJson = {
    schemaVersion: 1 as const,
    name: body.name,
    title: body.title,
    description: body.description,
    projectType: body.projectType,
    contributes: body.contributes,
  };

  const contentHash = templateContentHash({
    name: body.name,
    title: body.title,
    description: body.description,
    projectType: body.projectType,
    manifestJson,
    briefMd: body.briefMd,
    designRulesMd: body.designRulesMd ?? null,
  });

  // Upsert by (workspace_id, name). Returns created or updated shape either way.
  const now = new Date();
  const result = await db
    .insert(templates)
    .values({
      id: newId(),
      workspaceId: access.workspace.id,
      name: body.name,
      title: body.title,
      description: body.description,
      projectType: body.projectType,
      manifestJson,
      briefMd: body.briefMd,
      designRulesMd: body.designRulesMd ?? null,
      contentHash,
      createdBy: ctx.user.id,
    })
    .onConflictDoUpdate({
      target: [templates.workspaceId, templates.name],
      set: {
        title: body.title,
        description: body.description,
        projectType: body.projectType,
        manifestJson,
        briefMd: body.briefMd,
        designRulesMd: body.designRulesMd ?? null,
        contentHash,
        updatedAt: now,
      },
    })
    .returning({
      name: templates.name,
      contentHash: templates.contentHash,
      updatedAt: templates.updatedAt,
      createdAt: templates.createdAt,
    });

  const row = result[0]!;
  const created = row.createdAt.getTime() === row.updatedAt.getTime();

  return NextResponse.json(
    {
      workspace: access.workspace.slug,
      name: row.name,
      contentHash: row.contentHash,
      updatedAt: row.updatedAt,
      status: created ? "created" : "updated",
    },
    { status: created ? 201 : 200 },
  );
}

// Avoid the unused-warning on `sql` when developing incrementally.
void sql;
