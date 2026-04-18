import Link from "next/link";
import type { Metadata } from "next";
import { TerminalMock } from "../../components/terminal-mock";

export const metadata: Metadata = {
  title: "Documentation · Project Spine",
  description: "Guides, references, and sample outputs for Project Spine.",
  alternates: { canonical: "https://projectspine.dev/docs" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/docs",
    siteName: "Project Spine",
    title: "Documentation · Project Spine",
    description: "Guides, references, and sample outputs for Project Spine.",
    images: [{ url: "/banner.png", width: 2400, height: 1500, alt: "Project Spine" }],
  },
};

const DOCS: Array<{ title: string; href: string; blurb: string; external?: boolean }> = [
  {
    title: "Quickstart",
    href: "https://github.com/PetriLahdelma/project-spine#quickstart",
    blurb: "npm install, init, compile. Three commands, 30 seconds, 18 files out.",
    external: true,
  },
  {
    title: "PRD",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/PRD.md",
    blurb: "The full product thinking. Why Spine exists, what it compiles, how the pipeline is structured.",
    external: true,
  },
  {
    title: "Drift detection",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/drift.md",
    blurb: "How the export manifest works, what each drift kind means, how to wire it into CI.",
    external: true,
  },
  {
    title: "Design tokens",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/tokens.md",
    blurb: "DTCG + Tokens Studio support, alias resolution, type inference, drift semantics.",
    external: true,
  },
  {
    title: "LLM enrichment",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/llm.md",
    blurb: "Opt-in rationale enrichment via Anthropic Claude. Never load-bearing; always fails closed to deterministic.",
    external: true,
  },
  {
    title: "Agent skills",
    href: "https://github.com/PetriLahdelma/project-spine/tree/main/skills",
    blurb: "Six SKILL.md files that teach Claude Code, Codex CLI, and Cursor to drive Project Spine end-to-end.",
    external: true,
  },
  {
    title: "Positioning",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/positioning.md",
    blurb: "The moat vs. Claude Code. What Spine does that Claude structurally can't.",
    external: true,
  },
  {
    title: "Sample output",
    href: "https://github.com/PetriLahdelma/project-spine/tree/main/docs/sample-output",
    blurb: "A complete compile of the saas-marketing template. 18 files you can read end-to-end.",
    external: true,
  },
  {
    title: "Security audit",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/security-audit.md",
    blurb: "Self-audit of the hosted service with findings + fixes. Transparent about known limits.",
    external: true,
  },
  {
    title: "Field notes",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/field-notes.md",
    blurb: "Honest dogfood notes: what worked, what didn't, what we'd rebuild if we started again.",
    external: true,
  },
  {
    title: "Research citations",
    href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/research-citations.md",
    blurb: "Sources backing the claims on the landing page (Atlassian DevEx, arXiv, Stack Overflow surveys).",
    external: true,
  },
];

export default function DocsPage() {
  return (
    <main className="wide">
      <header className="page-header">
        <p className="eyebrow">Documentation</p>
        <h1>Read the real docs. They live with the code.</h1>
        <p className="lede">
          Project Spine&apos;s documentation lives in the repo so it ships with
          every release and stays honest as the code changes. This page is the
          index.
        </p>
      </header>

      <div className="card-grid">
        {DOCS.map((doc) => (
          <div key={doc.href} className="card">
            <h3>{doc.title}</h3>
            <p>{doc.blurb}</p>
            <a
              href={doc.href}
              {...(doc.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              Read →
            </a>
          </div>
        ))}
      </div>

      <h2>CLI reference</h2>
      <p>
        Every CLI command ships with <code>--help</code>. For the full list,
        run:
      </p>
      <TerminalMock title="~ — spine --help">
        <span className="tok-prompt">$ </span>
        <span className="tok-command">spine --help</span>
        {"\n\n"}
        <span className="tok-dim">USAGE</span>  spine [command] [options]
        {"\n\n"}
        <span className="tok-dim">COMMANDS</span>
        {"\n  "}<span className="tok-accent">init</span>        Scaffold a brief and .project-spine/ directory
        {"\n  "}<span className="tok-accent">compile</span>     Compile brief + repo (+ optional design + tokens + template)
        {"\n  "}<span className="tok-accent">inspect</span>     Analyse any repo without a brief
        {"\n  "}<span className="tok-accent">export</span>      Regenerate a subset of exports without recompiling
        {"\n  "}<span className="tok-accent">template</span>    List / show / save / pull templates
        {"\n  "}<span className="tok-accent">explain</span>     Print the fix for a given warning id
        {"\n  "}<span className="tok-accent">drift</span>       Check for drift · push to workspace
        {"\n  "}<span className="tok-accent">login</span>       Start device-flow auth against projectspine.dev
        {"\n  "}<span className="tok-accent">whoami</span>      Show current user + active workspace
        {"\n  "}<span className="tok-accent">workspace</span>   Create / list / switch / invite / members
        {"\n  "}<span className="tok-accent">publish</span>     Publish a rationale to /r/&lt;slug&gt;
        {"\n  "}<span className="tok-accent">rationale</span>   List / revoke published rationales
      </TerminalMock>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <Link href="/product">Product tour →</Link>
        <Link href="/changelog">Changelog →</Link>
      </div>
    </main>
  );
}
