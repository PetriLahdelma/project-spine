import Link from "next/link";
import type { Metadata } from "next";

const REPO = "https://github.com/PetriLahdelma/project-spine";

export const metadata: Metadata = {
  title: "Product · Project Spine",
  description: "How Project Spine turns reviewed fixes into evidence-backed literal and executable guardrails, verifies them against Git history, and checks the current tree.",
  alternates: { canonical: "https://projectspine.dev/product" },
};

const COMMANDS = [
  ["spine learn --case failure.json", "Import explicit evidence and create a candidate scoped rule."],
  ["spine learn --from-pr <url>", "Import GitHub review metadata when network access is intentionally requested."],
  ["spine replay <case-id>", "Check the candidate against recorded broken and corrected Git commits."],
  ["spine guard --diff HEAD~1", "Evaluate verified rules against changed files; add --json for CI."],
  ["spine context --files 'src/a.ts'", "Return only the verified rules relevant to a set of files."],
  ["spine report --format html --out report.html", "Write a local, inspectable evidence and verification report."],
  ["spine evaluate <case-id> --adapter adapter.json --allow-execution --runs 1 --json", "Optionally execute a configured agent or evaluator in temporary clones."],
] as const;

const CORRECTION_COMMANDS = [
  ["spine correction demo --image <image@sha256:digest> --allow-execution", "Run the synthetic behavioral fixture after pre-pulling the reviewed image."],
  ["spine correction capture … --out correction.json", "Capture reviewed test bytes, source closure, explicit revisions, lesson, and image digest without execution."],
  ["spine correction verify --case correction.json --repo . --allow-execution", "Require the captured test to fail on the broken revision and pass on the fixed revision under the declared controls."],
  ["spine correction check --case correction.json --repo . --allow-execution", "Recheck the current tree and execution controls before returning verified guidance."],
  ["spine correction context --case correction.json", "Read the captured lesson without execution; output remains labelled candidate."],
] as const;

export default function ProductPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Product</p>
        <h1>A learning loop for repository guardrails.</h1>
        <p className="lede">
          Project Spine records a reviewed failure and a maintainer-authored literal rule, then reads Git history to verify that the rule catches the recorded break without rejecting its correction. Verified rules can then run in CI and reach coding agents through relevant context.
        </p>
      </header>

      <h2>From review to enforcement</h2>
      <pre tabIndex={0}><code>{`review evidence
      ↓
candidate require-text / forbid-text rule
      ↓
read-only Git replay: broken fails · corrected passes
      ↓
verified rule → CI guard → file-relevant context → MCP`}</code></pre>
      <p>
        The evidence trail remains local and reviewable. A replay validates a specific literal rule against specific commits; it does not rerun an agent or prove that an entire defect class is impossible.
      </p>

      <h2>v0.10 beta commands</h2>
      <ul className="features">
        {COMMANDS.map(([command, body]) => (
          <li key={command}>
            <strong><code>{command}</code></strong>
            <span>{body}</span>
          </li>
        ))}
      </ul>

      <h2>Rule model</h2>
      <p>
        The beta intentionally supports deterministic <code>forbid-text</code> and <code>require-text</code> rules scoped by file globs. Each case can connect review evidence, a broken commit, a corrected commit, and replay results. This narrow model is easy to inspect, explain, and reproduce.
      </p>

      <h2>Executable corrections are the next pilot</h2>
      <p>
        Literal rules catch a precise class of regressions without executing repository code. Some corrections need behavior, not text. The source-available correction pilot captures a maintainer-reviewed, dependency-free <code>node:test</code> file from an explicit fixed commit, then pairs it with each revision’s own source files.
      </p>
      <p>
        Verification applies those recorded bytes to both the broken and fixed revisions, then runs them in a digest-pinned Docker image with no network, a read-only root filesystem, a non-root user, and bounded resources. Execution requires an explicit <code>--allow-execution</code> acknowledgement. Current-tree checks revalidate those controls before reporting a result.
      </p>
      <p>
        A captured correction is a candidate. It becomes verified only after the controlled run fails on the broken revision and passes on the fixed revision. Spine does not infer tests, repair failing tests, or label candidate context as verified.
      </p>
      <ul className="features">
        {CORRECTION_COMMANDS.map(([command, body]) => (
          <li key={command}>
            <strong><code>{command}</code></strong>
            <span>{body}</span>
          </li>
        ))}
      </ul>
      <p>
        The operator pre-pulls an explicitly reviewed, digest-pinned image. The pilot will not select or fetch a floating image on its own. See the <a href={`${REPO}/blob/main/docs/corrections.md`}>correction workflow contract</a>.
      </p>

      <h2>Why not just write a test?</h2>
      <p>
        You should write the test. Spine preserves the reviewed test bytes, their source closure, their broken/fixed evidence, and the execution controls as one auditable correction. It complements the normal suite by retaining why this test exists and proving it distinguishes the recorded failure before using it as agent context.
      </p>
      <div className="cta-row">
        <a href={`${REPO}/issues/new?template=learning_case.md`}>Propose a pilot case →</a>
      </div>

      <h2>Replay and evaluation are different operations</h2>
      <ul className="features">
        <li>
          <strong><code>spine replay</code> is historical and read-only.</strong>
          <span>It reads Git objects and evaluates literal rules. It does not check out commits, execute repository code, call a model, or require network access.</span>
        </li>
        <li>
          <strong><code>spine evaluate</code> runs configured programs.</strong>
          <span>It requires <code>--allow-execution</code>, creates temporary clones, and invokes the adapter you provide. That adapter may call an agent, a model, or the network and may incur usage costs.</span>
        </li>
      </ul>
      <p>
        Evaluation does not provide an OS sandbox. Review the adapter and repository before enabling execution. See the <a href={`${REPO}/blob/main/docs/evaluation.md`}>evaluation contract</a> for the adapter schema, recorded outputs, and cleanup behavior.
      </p>

      <h2>What remains</h2>
      <ul className="features">
        <li><strong>Compile and drift.</strong><span>The existing brief-to-agent-context compiler and drift checks remain available as secondary workflows.</span></li>
        <li><strong>Local MCP.</strong><span>MCP clients can ask for relevant rule context without a hosted account or repository upload.</span></li>
        <li><strong>Human review.</strong><span>Maintainers author and review candidate rules. Spine verifies their historical evidence before enforcement.</span></li>
      </ul>

      <h2>Boundaries</h2>
      <ul className="features">
        <li><strong>Replay does not rerun an agent.</strong><span>The separate opt-in evaluation command can execute a configured agent or evaluator with explicit consent.</span></li>
        <li><strong>No universal prevention claim.</strong><span>A passing literal replay or correction verification is evidence for the recorded case, not a guarantee against every future variation.</span></li>
        <li><strong>No inferred executable tests.</strong><span>The correction pilot accepts user-reviewed test bytes and an explicit source closure. It does not synthesize tests or claim agent-performance results.</span></li>
        <li><strong>No hosted fleet dependency.</strong><span>The v0.10 beta is a local CLI, local report, CI guard, and local MCP surface.</span></li>
      </ul>

      <div className="cta-row">
        <Link href="/docs">Run the beta demo →</Link>
        <a href={REPO}>Read the code →</a>
        <a href={`${REPO}/issues`}>Share a failure case →</a>
      </div>
    </main>
  );
}
