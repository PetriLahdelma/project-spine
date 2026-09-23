import Link from "next/link";
import type { Metadata } from "next";

const REPO = "https://github.com/PetriLahdelma/project-spine";

export const metadata: Metadata = {
  title: "Docs · Project Spine",
  description: "Build the forthcoming Project Spine beta from source and run the repository learning workflow locally.",
  alternates: { canonical: "https://projectspine.dev/docs" },
};

export default function DocsPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Docs</p>
        <h1>Run the learning loop locally.</h1>
        <p className="lede">
          The repository-learning commands are being prepared for the next beta. Build the current source to evaluate them now. The published npm beta still describes the earlier compile-first product.
        </p>
      </header>

      <h2>Source build</h2>
      <pre tabIndex={0}><code>{`git clone --branch feat/repository-learning https://github.com/PetriLahdelma/project-spine.git
cd project-spine
npm ci
npm run build
node dist/cli.js demo`}</code></pre>
      <p>
        <code>demo</code> creates a temporary Git fixture for the <code>tenant-query</code> case, verifies its historical correction, catches a reintroduced defect, and writes a local HTML report. It does not call a model or execute the fixture code.
      </p>

      <h2>Run a case</h2>
      <pre tabIndex={0}><code>{`# Import an explicit local case
node dist/cli.js learn --case ./failure.json

# Verify it against its recorded Git commits
node dist/cli.js replay <case-id>

# Check the current diff
node dist/cli.js guard --diff HEAD~1

# Ask for rules relevant to a file
node dist/cli.js context --files 'src/a.ts'

# Write a local report
node dist/cli.js report --format html --out report.html`}</code></pre>

      <h2>Case shape</h2>
      <pre tabIndex={0}><code>{`{
  "version": 1,
  "id": "tenant-query",
  "title": "Preserve the invoice tenant filter",
  "summary": "Review found an invoice query without the required tenant filter.",
  "source": { "kind": "manual" },
  "rules": [{
    "id": "tenant-filter",
    "description": "Keep the observed tenant filter on invoice queries.",
    "files": ["src/invoices.js"],
    "kind": "require-text",
    "text": "WHERE tenant_id = ?"
  }],
  "replay": { "brokenRef": "BROKEN_COMMIT_SHA", "fixedRef": "CORRECTED_COMMIT_SHA" }
}`}</code></pre>
      <p>
        Use commit identifiers that exist in the current repository. <code>replay</code> reads those Git objects without checking out either commit or modifying the worktree.
      </p>

      <h2>CI</h2>
      <pre tabIndex={0}><code>{`- name: Check verified Project Spine rules
  run: node dist/cli.js guard --diff origin/main --json`}</code></pre>
      <p>
        Treat the JSON output and non-zero exit status as the integration contract. Keep evidence and verified rule files in version control so reviewers can see why a check exists.
      </p>

      <h2>Optional agent evaluation</h2>
      <pre tabIndex={0}><code>{`node dist/cli.js evaluate tenant-query \
  --adapter adapter.json \
  --allow-execution \
  --runs 1 \
  --json`}</code></pre>
      <p>
        Evaluation is separate from historical replay. It executes the configured adapter in temporary clones and requires explicit <code>--allow-execution</code>. There is no OS sandbox. The adapter may use the network, invoke a model, and incur provider costs. Review it before running.
      </p>
      <p>
        Read <a href={`${REPO}/blob/feat/repository-learning/docs/evaluation.md`}>docs/evaluation.md</a> for the adapter contract and result format. Use <code>replay</code> when you only need deterministic, read-only verification against existing Git history.
      </p>

      <h2>Existing workflows</h2>
      <p>
        <code>spine compile</code>, <code>spine drift check</code>, templates, token inputs, and the local MCP server remain supported. Run <code>node dist/cli.js --help</code> for the exact command surface in your checkout.
      </p>

      <div className="cta-row">
        <a href={`${REPO}#readme`}>Repository README →</a>
        <a href={`${REPO}/blob/feat/repository-learning/docs/learning.md`}>Learning guide →</a>
        <a href={`${REPO}/blob/feat/repository-learning/docs/evaluation.md`}>Evaluation guide →</a>
        <Link href="/product">Product boundaries →</Link>
      </div>
    </main>
  );
}
