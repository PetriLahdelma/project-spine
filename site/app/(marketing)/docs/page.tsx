import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs · Project Spine",
  description:
    "Project Spine's documentation lives in the repo. This page is the short pointer list — README, PRD, and the topic-specific docs under /docs.",
  alternates: { canonical: "https://projectspine.dev/docs" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/docs",
    siteName: "Project Spine",
    title: "Docs · Project Spine",
    description:
      "Project Spine's documentation lives in the repo. This page is the short pointer list.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Project Spine" }],
  },
};

const CORE = [
  {
    title: "README",
    href: "https://github.com/PetriLahdelma/project-spine#readme",
    blurb: "Install, quickstart, and the shape of what `spine compile` produces.",
  },
  {
    title: "PRD",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/PRD.md",
    blurb: "Why Spine exists, what it compiles, how the pipeline is structured.",
  },
  {
    title: "Sample output",
    href: "https://github.com/PetriLahdelma/project-spine/tree/main/docs/sample-output",
    blurb: "Full compiled examples for Project Spine itself, saas-marketing, and API-service projects.",
  },
];

const TOPIC = [
  {
    title: "Drift detection",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/drift.md",
  },
  {
    title: "Design tokens (DTCG + Tokens Studio)",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/tokens.md",
  },
  {
    title: "Agent skills (Claude Code · Codex · Cursor)",
    href: "https://github.com/PetriLahdelma/project-spine/tree/main/skills",
  },
  {
    title: "LLM enrichment (opt-in, never load-bearing)",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/llm.md",
  },
  {
    title: "Competitive landscape",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/competitive-landscape.md",
  },
];

export default function DocsPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Docs</p>
        <h1>Read the real docs. They live with the code.</h1>
        <p className="lede">
          Spine&apos;s docs ship in the repo so they move with every release
          and stay honest as the code changes. This page is the short pointer
          list — no mirrored Markdown rendered in-site, no stale snapshots.
        </p>
      </header>

      <h2>Start here</h2>
      <ul className="docs__list">
        {CORE.map((d) => (
          <li key={d.href} className="docs__item">
            <a
              className="docs__link"
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {d.title} →
            </a>
            <p className="docs__blurb">{d.blurb}</p>
          </li>
        ))}
      </ul>

      <h2>By topic</h2>
      <ul className="docs__list docs__list--flat">
        {TOPIC.map((d) => (
          <li key={d.href} className="docs__item">
            <a
              className="docs__link"
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {d.title} →
            </a>
          </li>
        ))}
      </ul>

      <p className="docs__cli">
        Every CLI command has <code>--help</code> locally:{" "}
        <code>spine &lt;command&gt; --help</code>. Full command list at{" "}
        <code>spine --help</code>.
      </p>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <Link href="/product">Product tour →</Link>
        <Link href="/changelog">Changelog →</Link>
      </div>
    </main>
  );
}
