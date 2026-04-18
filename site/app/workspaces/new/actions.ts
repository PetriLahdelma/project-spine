"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { getWebSessionUser } from "@/lib/web-auth";

export type CreateResult = { ok: true; slug: string } | { error: string };

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,47}$/;

/**
 * Create a new workspace from the web. Owner is whoever is signed in.
 * Mirrors the shape enforced by POST /api/workspaces (the CLI path) so CLI
 * and web stay equivalent.
 */
export async function createWorkspaceAction(input: {
  name: string;
  slug: string;
  description?: string;
  brandColor?: string;
}): Promise<CreateResult> {
  const user = await getWebSessionUser();
  if (!user) return { error: "not_signed_in" };

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1) return { error: "name_required" };
  if (name.length > 120) return { error: "name_too_long" };

  const rawSlug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : "";
  if (rawSlug.length < 2) return { error: "slug_too_short" };
  const normalized = slugify(rawSlug);
  if (normalized !== rawSlug) return { error: "slug_must_be_kebab" };
  if (!SLUG_PATTERN.test(rawSlug)) return { error: "slug_must_be_kebab" };

  const description =
    typeof input.description === "string" && input.description.trim().length > 0
      ? input.description.trim().slice(0, 280)
      : null;
  if (description && description.length > 280) return { error: "description_too_long" };

  let brandColor: string | null = null;
  if (typeof input.brandColor === "string" && input.brandColor.trim().length > 0) {
    const trimmed = input.brandColor.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return { error: "brand_color_invalid" };
    brandColor = trimmed.toLowerCase();
  }

  const [clash] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, rawSlug))
    .limit(1);
  if (clash) return { error: "slug_taken" };

  const workspaceId = newId();
  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: workspaceId,
      slug: rawSlug,
      name,
      description,
      brandColor,
      ownerId: user.id,
    });
    await tx.insert(memberships).values({
      workspaceId,
      userId: user.id,
      role: "owner",
    });
  });

  return { ok: true, slug: rawSlug };
}

/**
 * Thin wrapper that invokes createWorkspaceAction and redirects on success.
 * Used by the form's action prop so pending/error UI works via useTransition.
 */
export async function createWorkspaceAndRedirect(input: {
  name: string;
  slug: string;
  description?: string;
  brandColor?: string;
}): Promise<CreateResult> {
  const res = await createWorkspaceAction(input);
  if ("ok" in res) redirect(`/w/${res.slug}?welcome=1`);
  return res;
}
