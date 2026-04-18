import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation · Project Spine",
  description: "Guides, references, and sample outputs for Project Spine.",
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
      <pre>
{`$ spine --help

USAGE  spine [command] [options]

COMMANDS
  init        Scaffold a brief and .project-spine/ directory
  compile     Compile brief + repo (+ optional design + tokens + template)
  inspect     Analyse any repo without a brief
  export      Regenerate a subset of exports without recompiling
  template    List / show / save / pull templates
  explain     Print the fix for a given warning id
  drift       Check for drift · push to workspace
  login       Start device-flow auth against projectspine.dev
  whoami      Show current user + active workspace
  workspace   Create / list / switch / invite / members
  publish     Publish a rationale to /r/<slug>
  rationale   List / revoke published rationales`}
      </pre>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <Link href="/product">Product tour →</Link>
        <Link href="/changelog">Changelog →</Link>
      </div>
    </main>
  );
}
