import { redirect } from "next/navigation";
import { getWebSessionUser } from "@/lib/web-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  const user = await getWebSessionUser();
  if (user) redirect(next);
  redirect(`/api/auth/github/login?next=${encodeURIComponent(next)}`);
}
