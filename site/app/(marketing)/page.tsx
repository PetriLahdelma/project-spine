import Link from "next/link";
import { TerminalMock } from "../components/terminal-mock";
import { InstallCommand } from "../components/install-command";

async function fetchStars(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/PetriLahdelma/project-spine",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

function GitHubIcon() {
  return (
    <svg role="img" aria-hidden="true" focusable="false" width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width={11} height={11} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.72 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.767 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}
function XMark() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7.5l3 3 6-7" />
    </svg>
  );
}

const FEATURES: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "Deterministic compile",
    body: (
      <>
        Content-addressable <code>spine.json</code>. Same inputs, same hash.
        Reviewers can prove why every rule exists.
      </>
    ),
  },
  {
    title: "Drift-aware by construction",
    body: (
      <>
        <code>export-manifest.json</code> plus{" "}
        <code>spine drift check --fail-on any</code>. A contract, not a
        comment.
      </>
    ),
  },
  {
    title: "Portable across agents",
    body: (
      <>
        Claude Code, Cursor, Copilot, Codex, Aider. One brief, every agent
        file, zero re-briefing.
      </>
    ),
  },
  {
    title: "Design tokens first-class",
    body: (
      <>
        DTCG or Tokens Studio JSON. Aliases resolve. Tokens drift tracked
        separately so Figma re-exports surface cleanly.
      </>
    ),
  },
  {
    title: "Hosted workspace",
    body: (
      <>
        Shared templates across clients. Branded rationale URLs. CI drift push
        into a fleet view. GitHub OAuth, hashed tokens, rate limits.
      </>
    ),
  },
  {
    title: "Agent skills shipped",
    body: (
      <>
        Six <code>SKILL.md</code> files teach Claude Code, Codex CLI, and
        Cursor to drive Spine end-to-end. One-line install.
      </>
    ),
  },
];

const CLAUDE_POINTS: React.ReactNode[] = [
  <>
    Different <code>AGENTS.md</code> every time you ask. Non-deterministic by
    design.
  </>,
  <>No memory of the brief you signed three months ago.</>,
  <>
    Writes <code>CLAUDE.md</code> well. Doesn&apos;t own the Cursor or Copilot
    file.
  </>,
  <>No sha256 chain, no source pointers, no audit trail.</>,
  <>Can&apos;t fail CI when your instructions drift from the brief.</>,
];

const SPINE_POINTS: React.ReactNode[] = [
  <>
    Same inputs produce the same <code>spine.json</code>. Byte-identical until
    a real input changes.
  </>,
  <>
    <code>export-manifest.json</code> hashes every input and output for
    lifecycle drift.
  </>,
  <>
    One source fans out to <code>AGENTS.md</code>, <code>CLAUDE.md</code>, and
    copilot-instructions.
  </>,
  <>
    Every rule carries a source pointer back to{" "}
    <code>brief.md#section0/item3</code>.
  </>,
  <>
    <code>spine drift check --fail-on any</code> turns the contract into a CI
    gate.
  </>,
];

export default async function Home() {
  const stars = await fetchStars();
  return (
    <main className="landing">
      {/* Hero */}
      <section className="hero-v2">
        <p className="hero-v2__eyebrow">v0.9.0 alpha · now with Figma tokens import</p>
        <h1>
          The context layer your coding agents are missing.
        </h1>
        <p className="hero-v2__lede">
          Compile your brief, repo, and design tokens into AGENTS.md,
          CLAUDE.md, and copilot-instructions from one deterministic source.
          With drift detection that fails CI before it fails trust.
        </p>
        <div className="hero-v2__ctas">
          <Link href="/login?next=/workspaces/new" className="btn-primary">
            Create a workspace
          </Link>
          <a
            href="https://github.com/PetriLahdelma/project-spine"
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            View on GitHub
            {typeof stars === "number" && stars > 0 ? (
              <span className="btn-secondary__count">
                <StarIcon />
                {stars.toLocaleString()}
              </span>
            ) : null}
          </a>
        </div>
        <div className="hero-v2__install">
          <InstallCommand />
          <p className="hero-v2__install-caption">
            CLI is MIT-licensed and runs fully offline. Node 20+. Workspace
            features are opt-in.
          </p>
        </div>
      </section>

      {/* Terminal artifact */}
      <section className="section section--tight">
        <TerminalMock title="~/acme-payroll — spine compile">
          <span className="tok-prompt">$ </span>
          <span className="tok-command">spine compile --brief ./brief.md --repo . --tokens ./tokens.json</span>
          {"\n\n"}
          <span className="tok-success">✓</span>{" "}
          <span>compiled spine for </span>
          <span className="tok-accent">&quot;acme-payroll&quot;</span>
          <span> v0.1.0</span>
          {"\n"}
          <span className="tok-key">  template: </span>
          <span className="tok-val">   saas-marketing</span>
          {"\n"}
          <span className="tok-key">  hash: </span>
          <span className="tok-val">       3333f867f40d3e43</span>
          {"\n"}
          <span className="tok-key">  project type:</span>
          <span className="tok-val">saas-marketing</span>
          {"\n"}
          <span className="tok-key">  stack: </span>
          <span className="tok-val">      next / tailwind / typescript</span>
          {"\n"}
          <span className="tok-key">  goals: </span>
          <span className="tok-val">      5</span>
          {"\n"}
          <span className="tok-key">  qa rules: </span>
          <span className="tok-val">   12</span>
          {"\n"}
          <span className="tok-key">  warnings: </span>
          <span className="tok-val">   2 </span>
          <span className="tok-dim">(0 error, 1 warn, 1 info)</span>
          {"\n\n"}
          <span className="tok-dim">wrote 18 files under ./.project-spine and repo root.</span>
          {"\n\n"}
          <span className="tok-prompt">$ </span>
          <span className="tok-command">spine drift check --fail-on any</span>
          {"\n"}
          <span className="tok-success">✓ clean</span>
          <span className="tok-dim"> · spine hash 3333f867f40d3e43 matches current.</span>
        </TerminalMock>
      </section>

      {/* Output */}
      <section className="section">
        <div className="section-header">
          <p className="eyebrow">Output</p>
          <h2>Eighteen files, every agent, all drift-tracked.</h2>
          <p className="sub">
            Run <code>spine compile</code> once. Everything below is generated
            with source pointers back to your brief, and hashed into a
            manifest that catches drift in CI.
          </p>
        </div>
        <div className="filetree">
          <div className="filetree__header">
            <strong>./</strong>
            <span>spine.json · sha256 3333f867f40d3e43</span>
          </div>
          <ul className="filetree__list">
            <li className="filetree__group-label">Repo root</li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--rule" aria-hidden="true" />
              <span className="filetree__name">AGENTS.md</span>
              <span className="filetree__sha">a41e2d0b9c6f7844</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--rule" aria-hidden="true" />
              <span className="filetree__name">CLAUDE.md</span>
              <span className="filetree__sha">f0ce8847b1e29a71</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--rule" aria-hidden="true" />
              <span className="filetree__name">.github/copilot-instructions.md</span>
              <span className="filetree__sha">92b4711f3e6c0d12</span>
            </li>
            <li className="filetree__group-label">.project-spine/exports</li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">scaffold-plan.md</span>
              <span className="filetree__sha">c8d5faeb7a20e164</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">route-inventory.md</span>
              <span className="filetree__sha">3b5f77102e9c41a8</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">component-plan.md</span>
              <span className="filetree__sha">7ac2d1b9664fe083</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">qa-guardrails.md</span>
              <span className="filetree__sha">4e6a0f51c9d7b312</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">sprint-1-backlog.md</span>
              <span className="filetree__sha">51bc28a93f0e6d47</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">rationale.md</span>
              <span className="filetree__sha">b920f47dc651e8a3</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">architecture-summary.md</span>
              <span className="filetree__sha">ed7a1f30c9b842fc</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">export-manifest.json</span>
              <span className="filetree__sha">drift-tracked</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Claude vs Spine */}
      <section className="section">
        <div className="section-header">
          <p className="eyebrow">The moat</p>
          <h2>Why not just use Claude?</h2>
          <p className="sub">
            Claude Code writes an <code>AGENTS.md</code> when you ask it to.
            Project Spine writes verifiable, versioned, portable agent
            instructions, and tells you the moment they drift.
          </p>
        </div>
        <div className="vs-grid">
          <div className="vs-col vs-col--claude">
            <p className="vs-col__label">Claude Code alone</p>
            <h3>What you get by default</h3>
            <ul>
              {CLAUDE_POINTS.map((point, i) => (
                <li key={i}>
                  <XMark />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="vs-col vs-col--spine">
            <p className="vs-col__label">Project Spine</p>
            <h3>What you get by construction</h3>
            <ul>
              {SPINE_POINTS.map((point, i) => (
                <li key={i}>
                  <Check />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="section-tail">
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/positioning.md">
            Read the full moat analysis →
          </a>
        </div>
      </section>

      {/* Features — editorial list */}
      <section className="section">
        <div className="section-header">
          <p className="eyebrow">Capabilities</p>
          <h2>Everything the hosted tier needs. Nothing you don&apos;t.</h2>
          <p className="sub">
            Pre-alpha today, but already carrying the primitives agencies tell
            us they need on day one of a new client project.
          </p>
        </div>
        <div className="features-list">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-row">
              <p className="feature-row__index">{String(i + 1).padStart(2, "0")}</p>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Maintainer */}
      <section className="section section--tight">
        <blockquote className="maintainer-quote">
          <p>
            Hi, I&apos;m Petri. Project Spine is a solo-maintainer project. I
            started it because my <code>AGENTS.md</code> files kept going
            stale the moment the brief moved, and no existing tool treated
            that as a real problem. If you try Spine and it breaks, or you
            disagree with a decision I made, email{" "}
            <a href="mailto:support@projectspine.dev">support@projectspine.dev</a>
            . I read every message.
          </p>
          <footer>
            <strong>Petri Lahdelma</strong> · maintainer ·{" "}
            <Link href="/about">about the project</Link>
          </footer>
        </blockquote>
      </section>

      {/* Final CTA */}
      <section className="section section--tight">
        <div className="final-cta">
          <h2>Ship your AGENTS.md like it&apos;s code.</h2>
          <p>
            Free while in alpha. MIT forever. Three commands and 30 seconds to
            compile your first brief into an audit-ready operating layer.
          </p>
          <Link href="/docs" className="btn-primary">
            Install the CLI
          </Link>
        </div>
      </section>
    </main>
  );
}
