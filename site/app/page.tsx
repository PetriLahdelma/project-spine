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
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <a href="https://www.npmjs.com/package/project-spine">npm →</a>
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
      </footer>
    </main>
  );
}
