import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { parseJsonBody, requireApiContext } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugPattern = /^[a-z][a-z0-9-]{1,47}$/;

const CreateWorkspace = z.object({
  slug: z.string().regex(slugPattern, "slug must be lowercase-kebab, 2-48 chars, starting a–z"),
  name: z.string().min(1).max(120),
  description: z.string().max(280).optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "brandColor must be a #RRGGBB hex")
    .optional(),
});

export async function GET(req: Request) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const rows = await db
    .select({
      slug: workspaces.slug,
      name: workspaces.name,
      description: workspaces.description,
      brandColor: workspaces.brandColor,
      role: memberships.role,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, ctx.user.id))
    .orderBy(desc(workspaces.createdAt));

  return NextResponse.json({ workspaces: rows });
}

export async function POST(req: Request) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await parseJsonBody(req, CreateWorkspace);
  if (body instanceof NextResponse) return body;

  const normalizedSlug = slugify(body.slug);
  if (normalizedSlug !== body.slug) {
    return NextResponse.json(
      { error: "bad_request", message: `slug must match "${normalizedSlug}"` },
      { status: 400 },
    );
  }

  // Check slug uniqueness ourselves so we return a clean 409 instead of a DB error.
  const [clash] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, body.slug))
    .limit(1);
  if (clash) {
    return NextResponse.json(
      { error: "slug_taken", message: `workspace "${body.slug}" already exists` },
      { status: 409 },
    );
  }

  const workspaceId = newId();
  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: workspaceId,
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      brandColor: body.brandColor ?? null,
      ownerId: ctx.user.id,
    });
    await tx.insert(memberships).values({
      workspaceId,
      userId: ctx.user.id,
      role: "owner",
    });
  });

  return NextResponse.json(
    {
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      brandColor: body.brandColor ?? null,
      role: "owner",
      url: `${ctx.config.baseUrl}/w/${body.slug}`,
    },
    { status: 201 },
  );
}
