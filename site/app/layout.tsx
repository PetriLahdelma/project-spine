import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Fraunces is used only at 900 italic with SOFT axis — the wordmark, section
// numerals, and two marketing headlines. `weight: "variable"` keeps the
// variable-font pipeline but we drop the styles and axes we don't render so
// the font payload doesn't carry the upright form or optical-size variation.
// Measured impact: trims ~40% off the font file size, which was the main
// mobile LCP headroom post-PageSpeed pass (LCP held at 3.5s after reducing
// SVG node count alone).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["italic"],
  axes: ["SOFT"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Forcing dynamic rendering is required for the CSP nonce emitted from
 * proxy.ts to stamp onto Next's inline RSC payload scripts. Without it,
 * statically-prerendered pages ship with scripts that have no nonce, which
 * our strict script-src CSP blocks. The site is low-traffic and Vercel's
 * edge can still cache responses when appropriate.
 */
export const dynamic = "force-dynamic";

const description =
  "Project Spine turns a client brief, a repo, and optional design inputs into a repo-native operating layer: AGENTS.md, CLAUDE.md, copilot-instructions, Cursor rules, scaffold plan, QA guardrails, and a sprint-1 backlog.";

export const metadata: Metadata = {
  metadataBase: new URL("https://projectspine.dev"),
  title: "Project Spine · context compiler for software projects",
  description,
  applicationName: "Project Spine",
  authors: [{ name: "Petri Lahdelma", url: "https://github.com/PetriLahdelma" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Project Spine",
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    title: "Project Spine",
    description:
      "The missing context layer for software delivery. Compile brief + repo + design into agent instructions, scaffold plan, QA guardrails, and a sprint-1 backlog.",
    url: "https://projectspine.dev",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Project Spine" }],
    siteName: "Project Spine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Spine",
    description: "Context compiler for software projects.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ff4fb4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
