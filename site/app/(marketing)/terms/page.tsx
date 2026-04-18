import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms · Project Spine",
  description: "Project Spine terms of use for the hosted service.",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 12,
        }}
      >
        Terms · last updated 2026-04-18
      </div>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.01em", marginBottom: 24 }}>Terms of use</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>
        Project Spine is a pre-alpha developer tool operated by Petri Lahdelma. These terms cover
        your use of the hosted service at <code>projectspine.dev</code>. The CLI itself is
        separately licensed under MIT (see the repository).
      </p>

      <Section title="Status: pre-alpha">
        <p>
          The service is pre-alpha. Interfaces, data shapes, and pricing may change without
          notice. There is no SLA. You should not rely on the hosted service for anything
          production-critical.
        </p>
      </Section>

      <Section title="Acceptable use">
        <ul>
          <li>Use the service for lawful purposes related to software delivery.</li>
          <li>Don&apos;t upload other people&apos;s proprietary information without permission.</li>
          <li>Don&apos;t abuse the API (no DoS, no scraping beyond your own workspaces).</li>
          <li>Don&apos;t publish rationales containing secrets, PII, or prohibited content.</li>
          <li>Don&apos;t try to bypass authentication, authorization, or rate limits.</li>
        </ul>
      </Section>

      <Section title="Your content">
        <p>
          You keep ownership of the briefs, templates, design rules, rationales, and drift
          snapshots you upload. You grant us the rights we need to run the service: storing,
          rendering, serving public rationale URLs, showing the content back to you in the web
          UI, and displaying it to other members of workspaces you authorize.
        </p>
      </Section>

      <Section title="Public rationales">
        <p>
          When you publish a rationale, the URL is intentionally unguessable but publicly
          accessible. Anyone with the link can view the rationale content and your workspace
          name/branding. Use <code>spine rationale revoke</code> to take it down.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You can stop using the service anytime; <code>spine logout</code> removes the local
          token and we&apos;ll delete workspace data on request (see our{" "}
          <Link href="/privacy">privacy policy</Link>). We can suspend accounts that violate
          these terms, with notice when possible.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          The hosted service is provided <strong>as-is</strong>, without warranties. To the
          fullest extent permitted by law, we are not liable for indirect or consequential
          damages arising from your use of the service. If it loses your data, we&apos;ll
          apologize and try to help you reconstruct it.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We&apos;ll date material changes and mention them in the repo&apos;s GitHub release
          notes. If a change materially reduces what you get, we&apos;ll try to give you at
          least 30 days of notice.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Email <a href="mailto:support@projectspine.dev">support@projectspine.dev</a>. Open
          issues for feature and bug reports:{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/issues">
            github.com/PetriLahdelma/project-spine/issues
          </a>
          .
        </p>
      </Section>

      <p style={{ marginTop: 48, fontSize: 13, color: "var(--ink-muted)" }}>
        <Link href="/">← Project Spine</Link> · <Link href="/privacy">Privacy</Link> ·{" "}
        <a href="https://github.com/PetriLahdelma/project-spine/blob/main/SECURITY.md">
          Security policy
        </a>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          margin: "32px 0 12px",
          fontWeight: 600,
        }}
      >
        {title}
      </h2>
      <div style={{ color: "var(--ink-soft)" }}>{children}</div>
    </section>
  );
}
