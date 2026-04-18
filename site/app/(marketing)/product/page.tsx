import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product — Project Spine",
  description:
    "Compile briefs, repos, and design tokens into verifiable agent instructions. Drift-aware, portable across Claude, Cursor, and Copilot.",
};

export default function ProductPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Product</p>
        <h1>One deterministic compile. Every agent file you need.</h1>
        <p className="lede">
          Project Spine reads a brief, a repo, and optional design tokens and
          writes <code>AGENTS.md</code>, <code>CLAUDE.md</code>,{" "}
          <code>.github/copilot-instructions.md</code>, a scaffold plan, QA
          guardrails, and a sprint-1 backlog — all with source pointers back
          to the inputs, all covered by a drift check you can put in CI.
        </p>
      </header>

      <h2>Pipeline</h2>
      <pre>
{`brief.md   ──┐
repo/      ──┼──▶  spine.json  ──▶  AGENTS.md + CLAUDE.md + copilot-instructions.md
tokens.json ─┤                     scaffold-plan.md · qa-guardrails.md ·
design.md  ──┘                     sprint-1-backlog.md · rationale.md`}
      </pre>
      <p>
        Every rule in <code>spine.json</code> carries a{" "}
        <code>source</code> pointer — <code>brief.md#section0/item3</code>,{" "}
        <code>repo-profile#framework</code>,{" "}
        <code>design:tokens.json#color/primary</code>, or{" "}
        <code>inferred:&lt;reason&gt;</code>. Reviewers can audit{" "}
        <em>why</em> a rule exists instead of trusting an LLM&apos;s
        self-report.
      </p>

      <h2>Core capabilities</h2>
      <ul className="features">
        <li>
          <strong>Agent instructions that reflect reality.</strong>
          <span>
            Generates <code>AGENTS.md</code>, <code>CLAUDE.md</code>, and{" "}
            <code>.github/copilot-instructions.md</code> from your actual brief
            and detected stack — not generic boilerplate. Switch agents without
            re-briefing.
          </span>
        </li>
        <li>
          <strong>Scaffold + QA + sprint-1 in one pass.</strong>
          <span>
            Route inventory, component plan, QA guardrails, and a sprint-1
            backlog with acceptance criteria traced back to your goals. Every
            generated item has a source pointer to the upstream input.
          </span>
        </li>
        <li>
          <strong>Drift-aware by construction.</strong>
          <span>
            <code>export-manifest.json</code> records sha256 of every input
            and output. <code>spine drift check --fail-on any</code> turns
            AGENTS.md into a CI-gated contract, not a README nobody reads.
          </span>
        </li>
        <li>
          <strong>Design tokens as first-class input.</strong>
          <span>
            DTCG or Tokens Studio JSON (<code>--tokens</code>) feeds brand
            colours, spacing scales, and typography into{" "}
            <code>spine.json</code>. Tokens drift is tracked separately so a
            re-export from Figma shows up as <code>[input:tokens]</code>, not
            a mystery hash change.
          </span>
        </li>
        <li>
          <strong>Four starter templates.</strong>
          <span>
            <code>saas-marketing</code>, <code>app-dashboard</code>,{" "}
            <code>design-system</code>, <code>docs-portal</code>. Each
            contributes routes, components, QA, UX, a11y, and agent rules
            additively — and you can save your own with{" "}
            <code>spine template save</code>.
          </span>
        </li>
        <li>
          <strong>Hosted workspace for teams.</strong>
          <span>
            Share templates across client projects, publish branded rationales
            at <code>/r/&lt;slug&gt;</code>, push drift reports from CI into a
            fleet view. GitHub OAuth, bearer tokens hashed, rate-limited.
          </span>
        </li>
        <li>
          <strong>Agent skills for Claude Code, Codex, Cursor.</strong>
          <span>
            Ship <code>skills/</code> with six <code>SKILL.md</code> files that
            teach your coding agent the kickoff / drift / template / rationale
            / workspace flows.{" "}
            <code>./skills/install.sh</code> symlinks them into{" "}
            <code>~/.claude/skills</code>.
          </span>
        </li>
      </ul>

      <h2>What it&apos;s not</h2>
      <ul className="features">
        <li>
          <strong>Not a replacement for a real brief.</strong>
          <span>
            Generic input produces generic output. Spine compiles what you
            write; it doesn&apos;t guess what you meant.
          </span>
        </li>
        <li>
          <strong>Not a refactoring engine.</strong>
          <span>
            Spine reads your repo to detect stack and conventions. It never
            rewrites your code. <code>AGENTS.md</code> is a contract with the
            agent — enforcement lives in the agent and in code review.
          </span>
        </li>
        <li>
          <strong>Not a replacement for human review.</strong>
          <span>
            Every compile surfaces warnings with source pointers so review is
            faster, not skipped.
          </span>
        </li>
        <li>
          <strong>Not optimised for million-line monorepos yet.</strong>
          <span>
            First run under 30 seconds on a typical Next.js / Remix / library
            repo. Very large trees (10k+ files) haven&apos;t been profiled.
          </span>
        </li>
      </ul>

      <h2>See it in action</h2>
      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine/tree/main/docs/sample-output">
          Full sample output →
        </a>
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/PRD.md">
          PRD →
        </a>
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/positioning.md">
          Positioning vs. Claude →
        </a>
        <Link href="/pricing">Pricing →</Link>
      </div>
    </main>
  );
}
