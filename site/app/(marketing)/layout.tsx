import { headers } from "next/headers";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const activePath = hdrs.get("x-pathname") ?? undefined;
  return (
    <>
      <SiteHeader activePath={activePath} />
      {children}
      <SiteFooter />
    </>
  );
}
