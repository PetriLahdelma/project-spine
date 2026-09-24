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
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Project Spine — keep the correction, prove the check" }],
  },
};

export default function AboutPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">About</p>
        <h1>Repositories should retain the lessons hidden in code review.</h1>
        <p className="lede">
          Project Spine is a solo-maintainer beta project for teams building
          with coding agents. It turns a reviewed failure into explicit
          evidence, a narrow repository rule, and a historical replay that
          shows whether the rule would have caught the recorded break.
        </p>
      </header>

      <h2>The problem</h2>
      <p>
        Valuable repository knowledge often appears once, in a pull-request
        correction: do not call this helper in a background job; this file
        must always register that handler; this path has a tenant boundary.
        The review closes, the lesson disappears into history, and the next
        coding agent starts with the same blind spot.
      </p>

      <h2>The approach</h2>
      <p>
        Project Spine keeps that correction as a source-linked case. It can
        express deterministic require-text and forbid-text rules, replay them
        against recorded broken and corrected commits, and enforce verified
        rules in CI. Relevant rules can reach any coding agent through local
        context and MCP. The existing compile and drift tools remain available.
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
            Google Analytics is loaded for aggregate site measurement. The CLI
            learning, replay, guard, compile, and drift paths stay local, and
            repo contents are not uploaded by the public workflow. Check the site&apos;s CSP; it&apos;s{" "}
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
