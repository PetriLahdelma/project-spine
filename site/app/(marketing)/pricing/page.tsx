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
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Project Spine" }],
  },
};

export default function PricingPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Pricing</p>
        <h1>Free.</h1>
        <p className="lede">
          Project Spine is an alpha OSS CLI under the MIT license. It runs
          offline, needs no account, and the full pipeline — compile, drift,
          templates, exports, design tokens — is unlocked for everyone.
        </p>
        <p>
          There is no paid tier today. If that ever changes, we&apos;ll announce
          it in the open and the CLI will stay free.
        </p>
      </header>

      <div className="cta-row">
        <a href="https://www.npmjs.com/package/project-spine">Install free →</a>
        <Link href="/product">Product tour →</Link>
        <a href="mailto:support@projectspine.dev">Questions? Email →</a>
      </div>
    </main>
  );
}
