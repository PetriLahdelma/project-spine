import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security · Project Spine",
  description: "How Project Spine handles repository evidence, Git objects, source code, and website data.",
  alternates: { canonical: "https://projectspine.dev/security" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/security",
    siteName: "Project Spine",
    title: "Security · Project Spine",
    description: "How Project Spine handles repository evidence, Git objects, source code, and website data.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Project Spine — turn reviewed failures into verified guardrails" }],
  },
};

export default function SecurityPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Security</p>
        <h1>Local evidence. Read-only replay. Explicit network access.</h1>
        <p className="lede">
          The public launch surface is an OSS CLI. It is designed to minimise
          exposure by running locally by default, with every network path
          behind an explicit command and explicit credentials. Full posture in{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
            SECURITY.md
          </a>
          . This page is the summary.
        </p>
      </header>

      <h2>CLI</h2>
      <ul className="features">
        <li>
          <strong>No implicit network calls.</strong>
          <span>
            <code>spine learn --case</code>, <code>spine replay</code>,{" "}
            <code>spine guard</code>, <code>spine context</code>,{" "}
            <code>spine report</code>, <code>spine init</code>, <code>spine compile</code>,{" "}
            <code>spine inspect</code>, <code>spine export</code>,{" "}
            <code>spine template</code>, <code>spine explain</code>, and{" "}
            <code>spine drift check</code> run entirely offline.{" "}
            <code>spine doctor</code> verifies that local posture. The only
            routed network paths require an explicit command: GitHub metadata
            import with <code>learn --from-pr</code> or design-token pull with
            an explicit Figma file key and <code>FIGMA_TOKEN</code>.
          </span>
        </li>
        <li>
          <strong>No repo upload path.</strong>
          <span>
            The routed OSS CLI reads your repo and writes generated files
            locally. It does not upload source, briefs, generated exports, or
            drift reports to Project Spine.
          </span>
        </li>
        <li>
          <strong>Opt-in LLM enrichment.</strong>
          <span>
            Rationale enrichment via Anthropic&apos;s API is opt-in per
            command and requires an explicit key in env. Prompts run through
            a secrets scrubber (PATs, API keys, PEM blocks) before leaving
            your machine.
          </span>
        </li>
      </ul>

      <h2>Repository learning</h2>
      <ul className="features">
        <li>
          <strong>Replay does not check out commits.</strong>
          <span>Historical verification reads Git objects. It does not move <code>HEAD</code>, alter the index, or rewrite the working tree.</span>
        </li>
        <li>
          <strong>Evidence is local data.</strong>
          <span>Case files, verified rules, and HTML reports remain on disk unless you choose to commit or share them.</span>
        </li>
        <li>
          <strong>Rules are literal and reviewable.</strong>
          <span>The beta evaluates scoped require-text and forbid-text checks. It does not execute code from evidence or ask a remote model to decide whether a diff passes.</span>
        </li>
        <li>
          <strong>Agent evaluation is an explicit execution boundary.</strong>
          <span>
            <code>spine evaluate</code> runs only with <code>--allow-execution</code>. It creates temporary clones and invokes the adapter you configure. There is no OS sandbox; that adapter can execute local programs, use the network, call a model, and incur provider costs. Historical <code>spine replay</code> never does this. Read the{" "}
            <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/evaluation.md">evaluation security contract</a> before enabling it.
          </span>
        </li>
      </ul>

      <h2>Website</h2>
      <ul className="features">
        <li>
          <strong>CSP with per-request nonce.</strong>
          <span>
            <code>script-src 'self' 'nonce-&lt;fresh&gt;' 'strict-dynamic'</code>
            , with no <code>'unsafe-inline'</code> on scripts. Middleware mints a
            fresh nonce per request; every route renders dynamically so Next
            stamps it onto its inline RSC payload scripts.
          </span>
        </li>
        <li>
          <strong>Transport.</strong>
          <span>
            HTTPS only. <code>.dev</code> is HSTS-preloaded at the TLD; we
            additionally send{" "}
            <code>Strict-Transport-Security: max-age=63072000; includeSubDomains; preload</code>
            .<br />
            Plus <code>X-Frame-Options: DENY</code>,{" "}
            <code>X-Content-Type-Options: nosniff</code>,{" "}
            <code>Referrer-Policy: strict-origin-when-cross-origin</code>,{" "}
            <code>Permissions-Policy</code> locking out geolocation /
            microphone / camera.
          </span>
        </li>
        <li>
          <strong>XSS on public rationale URLs.</strong>
          <span>
            Markdown is rendered via <code>marked</code> and then passed
            through <code>sanitize-html</code> with an allowlist. Scripts,
            iframes, inline styles, and <code>javascript:</code> schemes are
            stripped. Rationales set <code>noindex, nofollow</code>.
          </span>
        </li>
      </ul>

      <h2>What we don&apos;t collect</h2>
      <ul className="features">
        <li>
          <strong>Your repo source.</strong>
          <span>
            The routed CLI runs offline for compile and drift. The website
            never receives repo source, generated exports, briefs, or drift
            reports from the OSS workflow.
          </span>
        </li>
        <li>
          <strong>Repo-source analytics.</strong>
          <span>
            The website loads Google Analytics for aggregate site measurement,
            but the public CLI workflow still uploads no repo source, briefs,
            generated exports, or drift reports. Check the site&apos;s
            Content-Security-Policy header in devtools. <code>connect-src</code>{" "}
            allows{" "}
            <code>&apos;self&apos;</code>,{" "}
            <code>api.github.com</code>, and{" "}
            <code>registry.npmjs.org</code> for product features, plus Google
            Analytics and Ahrefs endpoints for measurement.
          </span>
        </li>
        <li>
          <strong>Request bodies in logs.</strong>
          <span>
            Vercel logs access lines (IP, path, status, timestamp) only,
            retained per Vercel&apos;s policy. Tokens never appear in logs;
            API routes don&apos;t print auth headers.
          </span>
        </li>
      </ul>

      <h2>Reporting vulnerabilities</h2>
      <p>
        Email{" "}
        <a href="mailto:security@projectspine.dev">security@projectspine.dev</a>{" "}
        or use{" "}
        <a href="https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability">
          GitHub private vulnerability reporting
        </a>{" "}
        on the repo. Acknowledgement within 72 hours, initial assessment
        within 7 days, coordinated disclosure on a timeline agreed with you.
      </p>

      <div className="cta-row">
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
          Full SECURITY.md →
        </a>
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/docs/security-audit.md">
          Self-audit findings →
        </a>
        <Link href="/privacy">Privacy policy →</Link>
      </div>
    </main>
  );
}
