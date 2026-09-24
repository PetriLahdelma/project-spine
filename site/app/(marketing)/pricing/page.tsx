import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing · Project Spine",
  description: "Free. Open source under MIT.",
  alternates: { canonical: "https://projectspine.dev/pricing" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/pricing",
    siteName: "Project Spine",
    title: "Pricing · Project Spine",
    description: "Free. Open source under MIT.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Project Spine — keep the correction, prove the check" }],
  },
};

export default function PricingPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Pricing</p>
        <h1>Free.</h1>
        <p className="lede">
          Project Spine is an MIT-licensed OSS CLI. Local evidence, Git replay,
          literal guardrails, reports, CI checks, MCP context, compile, and
          drift need no account or paid tier.
        </p>
        <p>
          The v0.10 beta learning workflow is available as a versioned GitHub
          Release artifact. npm registry publication is separate and is not
          claimed here. Optional evaluation adapters may use billable third-party
          model services; Spine itself requires no subscription.
        </p>
      </header>

      <div className="cta-row">
        <Link href="/docs">Run the beta demo →</Link>
        <Link href="/product">Product tour →</Link>
        <a href="mailto:support@projectspine.dev">Questions? Email →</a>
      </div>
    </main>
  );
}
