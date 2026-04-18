import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, users } from "@/db/schema";
import { requireApiContext, requireWorkspaceMember } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const { slug } = await params;
  const access = await requireWorkspaceMember(slug, ctx.user);
  if (access instanceof NextResponse) return access;

  const members = await db
    .select({
      userId: users.id,
      githubLogin: users.githubLogin,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.workspaceId, access.workspace.id));

  return NextResponse.json({
    slug: access.workspace.slug,
    name: access.workspace.name,
    description: access.workspace.description,
    brandColor: access.workspace.brandColor,
    logoUrl: access.workspace.logoUrl,
    createdAt: access.workspace.createdAt,
    role: access.role,
    members,
  });
}
