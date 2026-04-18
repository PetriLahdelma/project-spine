"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";

export type UpdateResult = { ok: true } | { error: string };

async function requireOwner(slug: string): Promise<{ userId: string; workspaceId: string } | { error: string }> {
  const user = await getWebSessionUser();
  if (!user) return { error: "not_signed_in" };
  const [row] = await db
    .select({ id: workspaces.id, ownerId: workspaces.ownerId, role: memberships.role })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(workspaces.slug, slug), eq(memberships.userId, user.id)))
    .limit(1);
  if (!row) return { error: "not_found" };
  if (row.ownerId !== user.id) return { error: "forbidden" };
  return { userId: user.id, workspaceId: row.id };
}

function validateName(raw: unknown): string | { error: string } {
  if (typeof raw !== "string") return { error: "name_required" };
  const trimmed = raw.trim();
  if (trimmed.length < 2) return { error: "name_too_short" };
  if (trimmed.length > 80) return { error: "name_too_long" };
  return trimmed;
}

function validateDescription(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return { error: "description_invalid" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 400) return { error: "description_too_long" };
  return trimmed;
}

function validateBrandColor(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return { error: "brand_color_invalid" };
  const trimmed = raw.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return { error: "brand_color_invalid" };
  return trimmed.toLowerCase();
}

function validateLogoUrl(raw: unknown): string | null | { error: string } {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return { error: "logo_url_invalid" };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 500) return { error: "logo_url_too_long" };
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:") return { error: "logo_url_must_be_https" };
    return trimmed;
  } catch {
    return { error: "logo_url_invalid" };
  }
}

export async function updateWorkspaceAction(
  slug: string,
  input: { name?: string; description?: string | null; brandColor?: string | null; logoUrl?: string | null }
): Promise<UpdateResult> {
  const auth = await requireOwner(slug);
  if ("error" in auth) return { error: auth.error };

  const patch: Record<string, string | null> = {};

  if (input.name !== undefined) {
    const res = validateName(input.name);
    if (typeof res !== "string") return res;
    patch["name"] = res;
  }
  if (input.description !== undefined) {
    const res = validateDescription(input.description);
    if (res !== null && typeof res !== "string") return res;
    patch["description"] = res;
  }
  if (input.brandColor !== undefined) {
    const res = validateBrandColor(input.brandColor);
    if (res !== null && typeof res !== "string") return res;
    patch["brand_color"] = res;
  }
  if (input.logoUrl !== undefined) {
    const res = validateLogoUrl(input.logoUrl);
    if (res !== null && typeof res !== "string") return res;
    patch["logo_url"] = res;
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  await db
    .update(workspaces)
    .set({
      ...(patch["name"] !== undefined && { name: patch["name"]! }),
      ...(patch["description"] !== undefined && { description: patch["description"] }),
      ...(patch["brand_color"] !== undefined && { brandColor: patch["brand_color"] }),
      ...(patch["logo_url"] !== undefined && { logoUrl: patch["logo_url"] }),
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, auth.workspaceId));

  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/settings`);
  return { ok: true };
}
