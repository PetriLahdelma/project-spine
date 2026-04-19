import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type RouteParams = { slug: string };

/**
 * The workspace dashboard was retired — the hosted tier isn't advertised
 * publicly right now. Existing workspace admin still works via the settings
 * page, so redirect there.
 */
export default async function WorkspacePage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  redirect(`/w/${slug}/settings`);
}
