import Link from "next/link";
import { TerminalMock } from "../components/terminal-mock";

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
    <svg aria-hidden="true" focusable="false" width={12} height={12} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.72 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.767 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.279l4.21-.612L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg aria-hidden="true" focusable="false" width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h8M8 3l3 4-3 4" />
    </svg>
  );
}

export default async function Home() {
  const stars = await fetchStars();

  return (
    <main className="landing">
      {/* ─────────── Hero ─────────── */}
      <section className="hero-v2">
        <div className="hero-v2__badge">
          <span className="hero-v2__badge-dot" aria-hidden="true" />
          v0.9.0-alpha · now with Figma tokens import
        </div>
        <h1>
          The context layer <em>your coding agents</em> are missing.
        </h1>
        <p className="hero-v2__lede">
          Compile your brief, repo, and design tokens into <code>AGENTS.md</code>,{" "}
          <code>CLAUDE.md</code>, and <code>copilot-instructions</code> from one
          deterministic source. With drift detection that fails CI before it
          fails trust.
        </p>
        <div className="hero-v2__ctas">
          <Link href="/docs" className="btn-primary">
            Get started <ArrowRight />
          </Link>
          <a
            href="https://github.com/PetriLahdelma/project-spine"
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            Star on GitHub
            {typeof stars === "number" && stars > 0 ? (
              <span className="btn-secondary__count">
                <StarIcon />
                {stars.toLocaleString()}
              </span>
            ) : null}
          </a>
        </div>
        <p className="hero-v2__trust">
          <span>free forever</span>
          <span>mit licensed</span>
          <span>no tracking</span>
          <span>72 tests passing</span>
          <span>9 releases shipped</span>
        </p>
      </section>

      {/* ─────────── Terminal artifact ─────────── */}
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
          <span className="tok-val">   saas-marketing (SaaS marketing site)</span>
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
          {"\n"}
          <span className="tok-comment"># AGENTS.md, CLAUDE.md, copilot-instructions</span>
          {"\n"}
          <span className="tok-comment"># scaffold-plan, qa-guardrails, sprint-1-backlog</span>
          {"\n"}
          <span className="tok-comment"># rationale, component-plan, route-inventory</span>
          {"\n\n"}
          <span className="tok-prompt">$ </span>
          <span className="tok-command">spine drift check --fail-on any</span>
          {"\n"}
          <span className="tok-success">✓ clean</span>
          <span className="tok-dim"> — spine hash 3333f867f40d3e43 matches current.</span>
        </TerminalMock>
      </section>

      {/* ─────────── File tree: what it writes ─────────── */}
      <section className="section">
        <div className="section-header">
          <p className="eyebrow">One compile · Eighteen files</p>
          <h2>Every agent file. Every artifact. All source-pointed.</h2>
          <p className="sub">
            Run <code>spine compile</code> once. Get agent instructions for every
            tool on your team, plus a scaffold plan, QA guardrails, and a
            sprint-1 backlog. Each rule traces back to your brief via a sha256
            chain you can verify.
          </p>
        </div>
        <div className="filetree">
          <div className="filetree__header">
            <strong>./</strong>
            <span>
              spine.json <span style={{ color: "var(--accent)" }}>sha256:3333f867…</span>
            </span>
          </div>
          <ul className="filetree__list">
            <li className="filetree__group-label">Repo-root agent files</li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--rule" aria-hidden="true" />
              <span className="filetree__name">AGENTS.md</span>
              <span className="filetree__sha">sha256:a41e2d0b9c6f7844</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--rule" aria-hidden="true" />
              <span className="filetree__name">CLAUDE.md</span>
              <span className="filetree__sha">sha256:f0ce8847b1e29a71</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--rule" aria-hidden="true" />
              <span className="filetree__name">.github/copilot-instructions.md</span>
              <span className="filetree__sha">sha256:92b4711f3e6c0d12</span>
            </li>

            <li className="filetree__group-label">.project-spine / exports</li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">scaffold-plan.md</span>
              <span className="filetree__sha">sha256:c8d5faeb7a20e164</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">route-inventory.md</span>
              <span className="filetree__sha">sha256:3b5f77102e9c41a8</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">component-plan.md</span>
              <span className="filetree__sha">sha256:7ac2d1b9664fe083</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">qa-guardrails.md</span>
              <span className="filetree__sha">sha256:4e6a0f51c9d7b312</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">sprint-1-backlog.md</span>
              <span className="filetree__sha">sha256:51bc28a93f0e6d47</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">rationale.md</span>
              <span className="filetree__sha">sha256:b920f47dc651e8a3</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--plan" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">architecture-summary.md</span>
              <span className="filetree__sha">sha256:ed7a1f30c9b842fc</span>
            </li>
            <li className="filetree__item">
              <span className="filetree__icon filetree__icon--gen" aria-hidden="true" />
              <span className="filetree__name filetree__name--dim">export-manifest.json</span>
              <span className="filetree__sha">drift-tracked</span>
            </li>
          </ul>
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13,
            color: "var(--ink-muted)",
          }}
        >
          <Link href="/product">See the full pipeline and what it&apos;s not</Link>
        </p>
      </section>

      {/* ─────────── Why not Claude ─────────── */}
      <section className="section" style={{ background: "linear-gradient(180deg, transparent, rgba(255, 79, 180, 0.03))" }}>
        <div className="section-header">
          <p className="eyebrow">The moat</p>
          <h2>Why not just use Claude?</h2>
          <p className="sub">
            Claude Code writes an <code>AGENTS.md</code> when you ask it to.
            Project Spine writes <strong style={{ color: "var(--ink)" }}>verifiable, versioned, portable</strong>{" "}
            agent instructions. And it tells you the moment they drift from the
            brief.
          </p>
        </div>
        <div className="vs-grid">
          <div className="vs-col vs-col--claude">
            <span className="vs-col__label">Claude Code alone</span>
            <h3>What you get by default</h3>
            <ul>
              <li>Different <code>AGENTS.md</code> every time you ask — non-deterministic by design.</li>
              <li>No memory of the brief you signed three months ago.</li>
              <li>Writes <code>CLAUDE.md</code> well; doesn&apos;t own the Cursor or Copilot file.</li>
              <li>No sha256 chain, no source pointers, no audit trail.</li>
              <li>Can&apos;t fail CI when your instructions drift.</li>
            </ul>
          </div>
          <div className="vs-col vs-col--spine">
            <span className="vs-col__label">Project Spine</span>
            <h3>What you get by construction</h3>
            <ul>
              <li>Same inputs → same <code>spine.json</code>. Byte-identical until a real input changes.</li>
              <li><code>export-manifest.json</code> hashes every input and output for lifecycle drift.</li>
              <li>One source fans out to <code>AGENTS.md</code>, <code>CLAUDE.md</code>, and copilot-instructions.</li>
              <li>Every rule carries a source pointer (<code>brief.md#section0/item3</code>).</li>
              <li><code>spine drift check --fail-on any</code> turns the contract into a CI gate.</li>
            </ul>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 32, fontSize: 14 }}>
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/positioning.md">
            Read the full moat analysis →
          </a>
        </p>
      </section>

      {/* ─────────── Feature cards ─────────── */}
      <section className="section">
        <div className="section-header">
          <p className="eyebrow">What ships in the box</p>
          <h2>Everything the hosted tier needs. Nothing you don&apos;t.</h2>
          <p className="sub">
            Pre-alpha today, but already carrying the primitives agencies tell us
            they need on day one of a new client project.
          </p>
        </div>
        <div className="feature-grid-v2">
          <FeatureCard icon="⎇" title="Deterministic compile">
            Content-addressable <code>spine.json</code>. Same inputs, same hash. Reviewers can prove why every rule exists.
          </FeatureCard>
          <FeatureCard icon="∿" title="Drift-aware by construction">
            <code>export-manifest.json</code> + <code>spine drift check --fail-on any</code>. A contract, not a comment.
          </FeatureCard>
          <FeatureCard icon="⇄" title="Portable across agents">
            Claude Code, Cursor, Copilot, Codex, Aider. One brief, every agent file, zero re-briefing.
          </FeatureCard>
          <FeatureCard icon="◇" title="Design tokens first-class">
            DTCG or Tokens Studio JSON. Aliases resolve. Tokens drift tracked separately so Figma re-exports surface cleanly.
          </FeatureCard>
          <FeatureCard icon="◎" title="Hosted workspace">
            Shared templates across clients. Branded rationale URLs. CI drift push into a fleet view. GitHub OAuth, hashed tokens, rate limits.
          </FeatureCard>
          <FeatureCard icon="⌘" title="Agent skills shipped">
            Six <code>SKILL.md</code> files teach Claude Code, Codex CLI, and Cursor to drive Spine end-to-end. One-line install.
          </FeatureCard>
        </div>
      </section>

      {/* ─────────── Maintainer note ─────────── */}
      <section className="section section--tight">
        <div className="maintainer-note">
          <p>
            Hi, I&apos;m Petri. Project Spine is a solo-maintainer project. I
            started it because my <code>AGENTS.md</code> files kept going stale
            the moment the brief moved, and no existing tool treated that as a
            real problem. If you try Spine and it breaks, or you disagree with a
            decision I made, email{" "}
            <a href="mailto:support@projectspine.dev">support@projectspine.dev</a>
            . I read every message.
          </p>
          <div className="signature">
            <strong>Petri Lahdelma</strong> · maintainer ·{" "}
            <Link href="/about">about the project</Link>
          </div>
        </div>
      </section>

      {/* ─────────── Final CTA ─────────── */}
      <section className="section section--tight">
        <div className="cta-final">
          <h2>Ship your AGENTS.md like it&apos;s code.</h2>
          <p>
            Free while in alpha. MIT forever. No tracking. Three commands and 30
            seconds to compile your first brief into an audit-ready operating
            layer.
          </p>
          <Link href="/docs" className="btn-primary">
            Install the CLI <ArrowRight />
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="feature-card">
      <div className="feature-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
