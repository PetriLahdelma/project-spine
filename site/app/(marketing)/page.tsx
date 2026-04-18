import Link from "next/link";

function GitHubIcon() {
  return (
    <svg role="img" aria-hidden="true" focusable="false" width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg role="img" aria-hidden="true" focusable="false" width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C23.99.786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <header className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner.png" alt="Project Spine" />
      </header>

      <p className="tag">pre-alpha · mit · node ≥ 20 · 72 tests · 9 releases shipped</p>
      <h1>A context compiler for software projects.</h1>
      <p className="lede">
        You already have Claude, Cursor, or Copilot. Project Spine is the
        context layer they&apos;re missing. It compiles your brief, repo, and
        design tokens into <code>AGENTS.md</code>, <code>CLAUDE.md</code>, and{" "}
        <code>copilot-instructions</code> from one deterministic source, with
        CI-grade drift detection so the files stay honest as the project evolves.
      </p>
      <p className="lede" style={{ color: "var(--ink-muted)", fontSize: "0.95rem" }}>
        CLI is free and open source. The hosted workspace is free during alpha.
        No telemetry, no implicit network calls, no account required for the
        compile pipeline itself.
      </p>

      <h2>Install</h2>
      <pre>
        <span className="prompt">$ </span>npm install -g project-spine@next
        {"\n"}
        <span className="prompt">$ </span>spine init --template saas-marketing
        {"\n"}
        <span className="prompt">$ </span>spine compile --brief ./brief.md --repo .
        <span className="comment"> # writes 18 files</span>
      </pre>

      <h2>What it produces</h2>
      <p style={{ color: "var(--ink-muted)" }}>
        A compiled <code>AGENTS.md</code> from a real saas-marketing brief (
        <Link href="/product">see the full product tour</Link>):
      </p>
      <pre>
{`# AGENTS.md

**Project Spine**: Launch a marketing site for Acme Payroll's new
SMB product line within 6 weeks.

**Stack:** node-library · typescript · tests: vitest · pm: npm
**Project type:** saas-marketing

> Source of truth: .project-spine/spine.json (hash 3333f867f40d3e43).
> Every rule below has a traceable source. Fix the upstream input
> and rerun \`spine compile\`. Don't hand-edit this file.

## Repo conventions
- TypeScript strict. Never use \`any\`; prefer \`unknown\` + narrow.
- Use \`npm\` for all dependency ops. No mixed lockfiles.
`}
      </pre>

      <h2>Why this exists</h2>
      <p>
        Developers saved ~10 hours a week with AI tools and lost the same ~10
        hours to fragmented context (
        <a href="https://www.atlassian.com/blog/developer/state-of-developer-experience-report-2025">
          Atlassian State of DevEx 2025
        </a>
        ). Only ~5% of repositories contain AI configuration files (
        <a href="https://arxiv.org/html/2510.21413v1">arXiv, Oct 2025</a>),
        and auto-generated <code>AGENTS.md</code> boilerplate is the single
        most-cited failure mode (
        <a href="https://medium.com/@addyosmani/stop-using-init-for-agents-md-3086a333f380">
          Addy Osmani, March 2026
        </a>
        ). The gap isn&apos;t more AI. It&apos;s a repo-native, drift-aware
        compiler for project intent. That&apos;s what Spine is.
      </p>

      <h2>Core capabilities</h2>
      <ul className="features">
        <li>
          <strong>Agent instructions that reflect reality.</strong>
          <span>
            Generates <code>AGENTS.md</code>, <code>CLAUDE.md</code>, and{" "}
            <code>.github/copilot-instructions.md</code> from your actual brief
            and detected stack. Not generic boilerplate.
          </span>
        </li>
        <li>
          <strong>Drift-aware by construction.</strong>
          <span>
            <code>export-manifest.json</code> records a sha256 of every input
            and every export. <code>spine drift check</code> flags hand-edits,
            missing files, and input changes, with CI-friendly exit codes.
          </span>
        </li>
        <li>
          <strong>Portable across agents.</strong>
          <span>
            One <code>spine.json</code> fans out to every agent-file format.
            Switch agents mid-project without re-briefing.{" "}
            <Link href="/product">Full product tour →</Link>
          </span>
        </li>
      </ul>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine" aria-label="GitHub">
          <GitHubIcon />
          <span>GitHub</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="https://www.npmjs.com/package/project-spine" aria-label="Node Package Manager">
          <NpmIcon />
          <span>Node Package Manager</span>
          <span aria-hidden="true">→</span>
        </a>
        <Link href="/product">Product tour →</Link>
        <Link href="/docs">Documentation →</Link>
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/positioning.md">
          Why not just Claude? →
        </a>
      </div>
    </main>
  );
}
