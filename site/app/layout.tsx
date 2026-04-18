import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Forcing dynamic rendering is required for the CSP nonce emitted from
 * middleware to stamp onto Next's inline RSC payload scripts. Without it,
 * statically-prerendered pages ship with scripts that have no nonce, which
 * our strict script-src CSP blocks. The site is low-traffic and Vercel's
 * edge can still cache responses when appropriate.
 */
export const dynamic = "force-dynamic";

const description =
  "Project Spine turns a client brief, a repo, and optional design inputs into a repo-native operating layer — AGENTS.md, CLAUDE.md, copilot-instructions, scaffold plan, QA guardrails, and a sprint-1 backlog.";

export const metadata: Metadata = {
  metadataBase: new URL("https://projectspine.dev"),
  title: "Project Spine — context compiler for software projects",
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
    images: [{ url: "/banner.png", width: 2400, height: 1500, alt: "Project Spine" }],
    siteName: "Project Spine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Spine",
    description: "Context compiler for software projects.",
    images: ["/banner.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ff4fb4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
