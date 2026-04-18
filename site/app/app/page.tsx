import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";

export const dynamic = "force-dynamic";

/**
 * Post-auth smart landing. Users who just authenticated hit /app and are
 * routed to the place they can actually do something:
 *   - not signed in → /login?next=/app
 *   - signed in, has a workspace → /w/<slug>
 *   - signed in, no workspace → /workspaces/new
 *
 * The header's username link points here so returning users always land on
 * their workspace in one click.
 */
export default async function AppRouter() {
  const user = await getWebSessionUser();
  if (!user) redirect("/login?next=/app");

  const [row] = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, user.id))
    .orderBy(desc(workspaces.createdAt))
    .limit(1);

  if (row?.slug) redirect(`/w/${row.slug}`);
  redirect("/workspaces/new");
}
