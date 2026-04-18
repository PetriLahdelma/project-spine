import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { workspaceInvites, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { parseJsonBody, requireApiContext, requireWorkspaceMember } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CreateInvite = z.object({
  role: z.enum(["member", "admin"]).default("member"),
});

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  if (access.role !== "owner" && access.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await parseJsonBody(req, CreateInvite);
  if (body instanceof NextResponse) return body;

  const code = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.insert(workspaceInvites).values({
    id: newId(),
    workspaceId: access.workspace.id,
    code,
    role: body.role,
    createdBy: ctx.user.id,
    expiresAt,
  });

  return NextResponse.json(
    {
      workspace: access.workspace.slug,
      role: body.role,
      code,
      expiresAt: expiresAt.toISOString(),
      url: `${ctx.config.baseUrl}/invite/${code}`,
    },
    { status: 201 },
  );
}

export async function GET(req: Request, { params }: RouteParams) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;
  if (access.role !== "owner" && access.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      code: workspaceInvites.code,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      acceptedBy: workspaceInvites.acceptedBy,
      acceptedAt: workspaceInvites.acceptedAt,
      revokedAt: workspaceInvites.revokedAt,
      createdAt: workspaceInvites.createdAt,
      createdByLogin: users.githubLogin,
    })
    .from(workspaceInvites)
    .leftJoin(users, eq(users.id, workspaceInvites.createdBy))
    .where(
      and(
        eq(workspaceInvites.workspaceId, access.workspace.id),
        isNull(workspaceInvites.revokedAt),
      ),
    )
    .orderBy(desc(workspaceInvites.createdAt));

  return NextResponse.json({
    workspace: access.workspace.slug,
    invites: rows.map((r) => ({
      ...r,
      url: `${ctx.config.baseUrl}/invite/${r.code}`,
      status: r.acceptedAt ? "accepted" : r.expiresAt < new Date() ? "expired" : "pending",
    })),
  });
}
