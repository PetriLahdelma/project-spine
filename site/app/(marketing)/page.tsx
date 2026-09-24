import Link from "next/link";
import type { Metadata } from "next";
import { HeroWordmark } from "../components/hero-wordmark";
import { LearningDemo } from "../components/learning-demo";
import { InstallCommand } from "../components/install-command";

const SITE = "https://projectspine.dev";
const REPO = "https://github.com/PetriLahdelma/project-spine";

export const metadata: Metadata = {
  alternates: { canonical: SITE },
  title: "Project Spine · keep the correction, prove the check",
  description:
    "Project Spine preserves reviewed fixes as evidence-backed guardrails, verifies them against Git history, checks the current tree, and serves relevant context to coding agents.",
  keywords: ["coding agent guardrails", "AI code review", "repository rules", "Git replay", "AGENTS.md", "MCP server", "CI policy"],
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Project Spine",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  description: "A local workflow for turning reviewed repository fixes into evidence-backed literal and executable guardrails.",
  url: SITE,
  codeRepository: REPO,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  license: "https://opensource.org/licenses/MIT",
};

const LOOP = [
  ["Capture", "Import a manual case file or GitHub review metadata. Evidence stays explicit and inspectable."],
  ["Propose", "Create a scoped require-text or forbid-text rule with a file glob and source trail."],
  ["Replay", "Read historical Git objects to prove the broken commit fails and the corrected commit passes."],
  ["Enforce", "Run verified rules against a diff in CI, then serve only relevant context to any MCP client."],
] as const;

const SURFACES = [
  ["Evidence ledger", "JSON cases connect the review, commits, rule, and replay result. No hidden model memory."],
  ["Literal guardrails", "Deterministic forbid-text and require-text checks scoped by repository globs."],
  ["Git replay", "Read-only historical verification. Spine inspects commits; it does not rerun an AI agent."],
  ["CI guard", "Machine-readable output and diff-aware checks make verified rules useful on every pull request."],
  ["Relevant context", "Ask for files and receive applicable rules through the CLI or local MCP server."],
  ["Local reports", "Generate an HTML report that a maintainer can review, archive, or share with a team."],
] as const;

export default function Home() {
  return (
    <main className="landing learning-landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <section className="poster-hero learning-hero">
        <div className="poster-hero__inner">
          <p className="poster-hero__eyebrow">v0.10 beta · local repository learning</p>
          <HeroWordmark line1="PROJECT" line2="SPINE" />
          <h1 className="learning-hero__headline">Keep the correction. Prove the check.</h1>
          <p className="learning-hero__sub">
            Preserve a reviewed regression test. Prove it fails on the broken code and passes on the fix. Check later changes under constrained local execution.
          </p>
          <div className="learning-hero__actions">
            <Link className="btn-on-cyan btn-on-cyan--primary" href="/docs">Run the local demo</Link>
            <a className="btn-on-cyan btn-on-cyan--secondary" href={REPO}>Explore the source</a>
          </div>
        </div>
      </section>

      <section className="learning-demo-section" aria-labelledby="demo-title">
        <div className="learning-demo-section__copy">
          <p className="eyebrow">A failure becomes repository memory</p>
          <h2 id="demo-title">One review. One replay. One rule your tools can check.</h2>
          <p>
            Follow the complete v0.10 beta workflow. This preview is illustrative; the source build includes a seeded case you can run without credentials or network access.
          </p>
          <Link href="/docs" className="text-link">Follow the source-build quickstart →</Link>
        </div>
        <LearningDemo />
      </section>

      <section className="learning-loop section" aria-labelledby="loop-title">
        <div className="section-header">
          <p className="eyebrow">The learning loop</p>
          <h2 id="loop-title">Evidence in. Verified guardrail out.</h2>
          <p className="sub">Spine makes each step reviewable. The beta stays deliberately narrow so a passing replay means something concrete.</p>
        </div>
        <ol className="learning-loop__grid">
          {LOOP.map(([title, body], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="learning-proof" aria-labelledby="proof-title">
        <div className="learning-proof__inner">
          <div>
            <p className="eyebrow">What replay proves</p>
            <h2 id="proof-title">The rule matches the history you gave it.</h2>
            <p>A verified rule failed on the recorded broken commit and passed on the recorded correction. That is strong evidence for a narrow check. It is not a promise that every future defect is prevented.</p>
          </div>
          <pre tabIndex={0}><code>{`$ spine replay tenant-query
✓ broken    demo commit  required literal missing
✓ corrected demo commit  required literal present

verified: require "WHERE tenant_id = ?"
scope:    src/invoices.js
source:   manual review evidence`}</code></pre>
        </div>
      </section>

      <section className="learning-proof" aria-labelledby="correction-title">
        <div className="learning-proof__inner">
          <div>
            <p className="eyebrow">Executable correction pilot</p>
            <h2 id="correction-title">Keep the test that proved the fix.</h2>
            <p>
              The source-available correction pilot captures a user-reviewed Node built-in test from an explicit fixed commit. Verification pairs those same test bytes with each revision’s own source files and runs both in constrained Docker containers.
            </p>
            <p>
              A correction stays a candidate until the broken revision fails, the fixed revision passes, and the execution controls succeed. The first pilot is intentionally narrow: dependency-free JavaScript using <code>node:test</code>.
            </p>
          </div>
          <div>
            <p className="eyebrow">Why not just write a test?</p>
            <h2>Write the test. Keep its evidence.</h2>
            <p>
              Spine does not replace your normal test suite. It keeps the reviewed test, source-file scope, broken/fixed proof, and execution policy together. Reports fingerprint each tested snapshot; current-tree checks rerun the correction under the same controls.
            </p>
            <p>
              Context can surface an unverified correction as a candidate, but only a successful controlled run is labelled verified.
            </p>
            <a className="text-link" href={`${REPO}/blob/main/docs/corrections.md`}>Read the correction model →</a>{" "}
            <a className="text-link" href={`${REPO}/issues/new?template=learning_case.md`}>Propose a pilot case →</a>
          </div>
        </div>
      </section>

      <section className="section learning-surfaces" aria-labelledby="surfaces-title">
        <div className="section-header">
          <p className="eyebrow">The v0.10 beta surface</p>
          <h2 id="surfaces-title">Small primitives that compose into a useful control loop.</h2>
          <p className="sub">Compile and drift workflows remain available. Learning, replay, guard, context, reports, CI, and MCP form the new center of gravity.</p>
        </div>
        <div className="learning-capabilities">
          {SURFACES.map(([title, body]) => (
            <article key={title}><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
        <p className="learning-evaluation-note">
          Need to test an actual configured agent or evaluator? <code>spine evaluate</code> is a separate, explicit execution path with different risks and costs. <a href={`${REPO}/blob/main/docs/evaluation.md`}>Read the evaluation contract →</a>
        </p>
      </section>

      <section className="learning-install" aria-labelledby="install-title">
        <div>
          <p className="eyebrow">Try the learning loop today</p>
          <h2 id="install-title">Clone it. Build it. Run the seeded case.</h2>
          <p>Build from the maintained source and run the complete local demo. No account or model key required.</p>
        </div>
        <InstallCommand />
        <div className="learning-install__links">
          <Link href="/docs">Full quickstart</Link>
          <a href={`${REPO}/issues/new?template=learning_case.md`}>Join the correction pilot</a>
          <a href={`${REPO}/issues`}>Open an issue</a>
          <a href={`${REPO}/discussions`}>Discuss the model</a>
        </div>
      </section>

      <section className="poster-closer learning-closer">
        <div className="poster-closer__inner">
          <p className="poster-closer__eyebrow">§ KEEP THE CORRECTION</p>
          <h2 className="poster-closer__headline">Your code review found it.<br /><em>Your repo should remember it.</em></h2>
          <p className="poster-closer__sub">Local, deterministic, MIT licensed, and built for maintainers who work with more than one coding agent.</p>
          <div className="poster-closer__ctas">
            <a className="btn-on-cyan btn-on-cyan--primary" href={REPO}>View on GitHub</a>
            <Link className="btn-on-cyan btn-on-cyan--secondary" href="/product">See the product model</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
