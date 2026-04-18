"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { memberships, rationales, workspaceInvites, workspaces } from "@/db/schema";
import { newId } from "@/lib/ids";
import { getWebSessionUser } from "@/lib/web-auth";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteRow = {
  code: string;
  role: "owner" | "admin" | "member";
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  url: string;
};

async function requireManager(workspaceSlug: string): Promise<{
  userId: string;
  workspaceId: string;
} | { error: string }> {
  const user = await getWebSessionUser();
  if (!user) return { error: "not_signed_in" };
  const [row] = await db
    .select({ id: workspaces.id, role: memberships.role })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(workspaces.slug, workspaceSlug), eq(memberships.userId, user.id)))
    .limit(1);
  if (!row) return { error: "not_found" };
  if (row.role !== "owner" && row.role !== "admin") return { error: "forbidden" };
  return { userId: user.id, workspaceId: row.id };
}

export async function listInvitesAction(workspaceSlug: string): Promise<InviteRow[] | { error: string }> {
  const auth = await requireManager(workspaceSlug);
  if ("error" in auth) return { error: auth.error };

  const rows = await db
    .select({
      code: workspaceInvites.code,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      acceptedAt: workspaceInvites.acceptedAt,
      revokedAt: workspaceInvites.revokedAt,
      createdAt: workspaceInvites.createdAt,
    })
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, auth.workspaceId))
    .orderBy(desc(workspaceInvites.createdAt));

  const base = process.env["NEXT_PUBLIC_BASE_URL"] ?? "https://projectspine.dev";
  return rows.map((r) => ({
    ...r,
    url: `${base}/invite/${r.code}`,
  }));
}

export async function createInviteAction(
  workspaceSlug: string,
  role: "member" | "admin",
): Promise<{ code: string; url: string } | { error: string }> {
  const auth = await requireManager(workspaceSlug);
  if ("error" in auth) return { error: auth.error };

  const code = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.insert(workspaceInvites).values({
    id: newId(),
    workspaceId: auth.workspaceId,
    code,
    role,
    createdBy: auth.userId,
    expiresAt,
  });

  const base = process.env["NEXT_PUBLIC_BASE_URL"] ?? "https://projectspine.dev";
  revalidatePath(`/w/${workspaceSlug}`);
  return { code, url: `${base}/invite/${code}` };
}

export async function revokeInviteAction(
  workspaceSlug: string,
  code: string,
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireManager(workspaceSlug);
  if ("error" in auth) return { error: auth.error };

  await db
    .update(workspaceInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(workspaceInvites.workspaceId, auth.workspaceId),
        eq(workspaceInvites.code, code),
        isNull(workspaceInvites.revokedAt),
      ),
    );
  revalidatePath(`/w/${workspaceSlug}`);
  return { ok: true };
}

export async function revokeRationaleAction(
  workspaceSlug: string,
  publicSlug: string,
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireManager(workspaceSlug);
  if ("error" in auth) return { error: auth.error };

  const result = await db
    .update(rationales)
    .set({ revokedAt: new Date() })
    .where(and(eq(rationales.workspaceId, auth.workspaceId), eq(rationales.publicSlug, publicSlug), isNull(rationales.revokedAt)))
    .returning({ publicSlug: rationales.publicSlug });

  if (result.length === 0) return { error: "not_found" };
  revalidatePath(`/w/${workspaceSlug}`);
  return { ok: true };
}
