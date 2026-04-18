import { redirect } from "next/navigation";
import { getWebSessionUser } from "@/lib/web-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  // Default to /app so returning users land on their workspace (or /workspaces/new
  // if they don't have one). The marketing home is a deliberate destination, not
  // a reward for having just authenticated.
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/app";
  const user = await getWebSessionUser();
  if (user) redirect(next);
  redirect(`/api/auth/github/login?next=${encodeURIComponent(next)}`);
}
