import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security — Project Spine",
  description: "How Project Spine handles your code, your tokens, and your data.",
};

export default function SecurityPage() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Security</p>
        <h1>Deterministic by default. Hardened where it matters.</h1>
        <p className="lede">
          The CLI is designed to minimise exposure. The hosted service is
          designed to fail safe. Full posture in{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
            SECURITY.md
          </a>{" "}
          — this page is the summary.
        </p>
      </header>

      <h2>CLI</h2>
      <ul className="features">
        <li>
          <strong>No implicit network calls.</strong>
          <span>
            <code>spine compile</code>, <code>spine drift check</code>, and{" "}
            <code>spine export</code> run entirely offline. Workspace
            commands (<code>login</code>, <code>publish</code>,{" "}
            <code>drift check --push</code>) are the only surfaces that touch
            the network, and only after you explicitly opt in.
          </span>
        </li>
        <li>
          <strong>Bearer tokens at rest.</strong>
          <span>
            CLI bearer tokens live in <code>~/.project-spine/config.json</code>{" "}
            with <code>0600</code> permissions. On the server side only a
            sha256 hash is stored; plaintext tokens never hit the database.
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

      <h2>Hosted service (projectspine.dev)</h2>
      <ul className="features">
        <li>
          <strong>Auth.</strong>
          <span>
            GitHub OAuth device flow for CLI; web OAuth for the workspace UI.
            The two share a single unified callback with cookie-bound state to
            prevent cross-device session fixation.
          </span>
        </li>
        <li>
          <strong>Rate limits on every auth endpoint.</strong>
          <span>
            Per-IP and per-device-code fixed-window limits backed by Postgres.
            Atomic UPSERT prevents thundering-herd bypass. Fails open if the
            DB is unavailable so auth never becomes unreachable because of a
            limiter bug.
          </span>
        </li>
        <li>
          <strong>CSP with per-request nonce.</strong>
          <span>
            <code>script-src 'self' 'nonce-&lt;fresh&gt;' 'strict-dynamic'</code>{" "}
            — no <code>'unsafe-inline'</code> on scripts. Middleware mints a
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
          <strong>Authorization.</strong>
          <span>
            Every workspace API route requires a valid bearer AND membership.
            Non-members get 404, not 403, so workspace existence isn&apos;t
            leaked.
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
            The CLI runs offline for compile and drift. Workspace commands
            upload only what you explicitly push — templates, rationales,
            drift summaries. Never the full repo.
          </span>
        </li>
        <li>
          <strong>Analytics or third-party trackers.</strong>
          <span>
            Zero. Check the site&apos;s Content-Security-Policy header in
            devtools — <code>connect-src</code> allows{" "}
            <code>&apos;self&apos;</code>,{" "}
            <code>api.github.com</code>, and{" "}
            <code>registry.npmjs.org</code>. Nothing else.
          </span>
        </li>
        <li>
          <strong>Request bodies in logs.</strong>
          <span>
            Vercel logs access lines (IP, path, status, timestamp) only,
            retained per Vercel&apos;s policy. Tokens never appear in logs —
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
