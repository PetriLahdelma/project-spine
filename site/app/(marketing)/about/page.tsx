import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · Project Spine",
  description: "Who makes Project Spine, why it exists, and how to get in touch.",
  alternates: { canonical: "https://projectspine.dev/about" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/about",
    siteName: "Project Spine",
    title: "About · Project Spine",
    description: "Who makes Project Spine, why it exists, and how to get in touch.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Project Spine" }],
  },
};

export default function AboutPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">About</p>
        <h1>Built in the open, by a single maintainer.</h1>
        <p className="lede">
          Project Spine is a solo-maintainer alpha project. I&apos;m
          building it because the <code>AGENTS.md</code> files I kept handing
          coding agents went stale the moment the brief moved, and no
          existing tool treated that as a real problem.
        </p>
      </header>

      <h2>The problem</h2>
      <p>
        Coding agents are now table stakes. Cursor, Claude Code, Copilot, and
        Codex read the project-root agent file and treat it as load-bearing
        instruction. In practice those files are generic boilerplate at worst
        and hand-written once-and-never-updated at best. Nobody tracks when
        they fall out of sync with the brief, the stack, or the design system.
        Agencies running 15 concurrent client projects feel this most.
        Every kickoff re-invents the same scaffold, and every re-kickoff
        quietly drifts.
      </p>

      <h2>The approach</h2>
      <p>
        Project Spine compiles a brief + repo + optional design tokens into a
        canonical, content-addressable <code>spine.json</code>. Every rule
        carries a source pointer so reviewers can audit <em>why</em> a rule
        exists. A drift check in CI fails the build when the generated files
        no longer match the inputs. The core CLI is deterministic and offline;
        network access is limited to explicit opt-in commands such as Figma
        token pull or LLM enrichment.
      </p>

      <h2>The maintainer</h2>
      <p>
        I&apos;m Petri Lahdelma. Background in design systems and developer
        tooling. Project Spine is a one-person project right now; I use it on
        my own client work and iterate based on what I find. The code is{" "}
        <a href="https://github.com/PetriLahdelma/project-spine">
          open on GitHub
        </a>{" "}
        and the thinking is in{" "}
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/PRD.md">
          PRD.md
        </a>
        .
      </p>
      <p>
        If you try it and it breaks, or you disagree with a decision I made,
        email{" "}
        <a href="mailto:support@projectspine.dev">support@projectspine.dev</a>
        . I read every message. For security issues, please use{" "}
        <a href="mailto:security@projectspine.dev">security@projectspine.dev</a>{" "}
        per{" "}
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
          SECURITY.md
        </a>
        .
      </p>

      <h2>What you won&apos;t find</h2>
      <ul className="features">
        <li>
          <strong>A corporate &ldquo;we&rdquo;.</strong>
          <span>
            There is no team page pretending to be a team. One maintainer,
            honestly labelled.
          </span>
        </li>
        <li>
          <strong>Fake testimonials or logos.</strong>
          <span>
            When real users show up and consent to be quoted, they&apos;ll be
            here. Until then, the research citations on the homepage are what
            we have.
          </span>
        </li>
        <li>
          <strong>Tracking.</strong>
          <span>
            No analytics, no third-party scripts, no cookie banner theatre.
            Check the site&apos;s CSP. It&apos;s{" "}
            <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
              documented
            </a>
            .
          </span>
        </li>
      </ul>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <Link href="/product">Product tour →</Link>
        <a href="mailto:support@projectspine.dev">Email the maintainer →</a>
      </div>
    </main>
  );
}
