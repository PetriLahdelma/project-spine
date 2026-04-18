function GitHubIcon() {
  return (
    <svg
      role="img"
      aria-hidden="true"
      focusable="false"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg
      role="img"
      aria-hidden="true"
      focusable="false"
      width={22}
      height={18}
      viewBox="0 0 780 250"
      fill="currentColor"
    >
      <path d="M240,250h100v-50h100V0H240V250z M340,50h50v100h-50V50z M480,0v200h100V50h50v150h50V50h50v150h50V0H480z M0,200h100V50h50v150h50V0H0V200z" />
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

      <p className="tag">pre-alpha · mit · node ≥ 20</p>
      <h1>A context compiler for software projects.</h1>
      <p className="lede">
        Turn a brief, a repo, and optional design-system inputs into a repo-native
        operating layer your team and your coding agents can both work from.
        Without drift, without boilerplate, without the black box.
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

      <h2>What you get</h2>
      <ul className="features">
        <li>
          <strong>Agent instructions that reflect reality.</strong>
          <span>
            Generates <code>AGENTS.md</code>, <code>CLAUDE.md</code>, and{" "}
            <code>.github/copilot-instructions.md</code> from your actual brief and
            detected stack — not generic boilerplate.
          </span>
        </li>
        <li>
          <strong>Scaffold + QA + sprint-1 in one pass.</strong>
          <span>
            Route inventory, component plan, QA guardrails, and a sprint-1 backlog
            with acceptance criteria. Every rule traces back to a source pointer in{" "}
            <code>spine.json</code>.
          </span>
        </li>
        <li>
          <strong>Drift-aware.</strong>
          <span>
            An <code>export-manifest.json</code> records a sha256 of every input
            and every export. <code>spine drift check</code> flags hand-edits,
            missing files, and input changes — CI-friendly exit codes.
          </span>
        </li>
        <li>
          <strong>Four starter templates.</strong>
          <span>
            SaaS marketing, app dashboard, design system, docs portal. Each
            contributes routes, components, QA, and agent rules additively — and
            you can save your own with <code>spine template save</code>.
          </span>
        </li>
        <li>
          <strong>Security by default.</strong>
          <span>
            Deterministic pipeline. No implicit network calls. No uninvited
            uploads. Matches the #1 reason developers reject AI tools in the 2025
            Stack Overflow survey.
          </span>
        </li>
      </ul>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine" aria-label="GitHub">
          <GitHubIcon />
          <span>GitHub</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="https://www.npmjs.com/package/project-spine" aria-label="npm">
          <NpmIcon />
          <span>npm</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/PRD.md">
          Read the PRD →
        </a>
        <a href="https://github.com/PetriLahdelma/project-spine/tree/main/docs/sample-output">
          Sample output →
        </a>
      </div>

      <footer>
        <p>
          Built by <a href="https://github.com/PetriLahdelma">Petri Lahdelma</a>.
          MIT licensed. Evidence and positioning in{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/research-citations.md">
            research-citations.md
          </a>
          , honest dogfood notes in{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/field-notes.md">
            field-notes.md
          </a>
          .
        </p>
        <p style={{ fontSize: 12, marginTop: 12 }}>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> ·{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
            Security
          </a>
        </p>
      </footer>
    </main>
  );
}
