import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy · Project Spine",
  description: "What Project Spine stores, why, and how to get it deleted.",
  alternates: { canonical: "https://projectspine.dev/privacy" },
};

export default function PrivacyPage() {
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
        Policy · last updated 2026-04-18
      </div>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.01em", marginBottom: 24 }}>Privacy</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>
        Project Spine is a beta developer tool. This page is plain-English, the short
        version of what we do with your data. If something here is unclear, email{" "}
        <a href="mailto:support@projectspine.dev">support@projectspine.dev</a>.
      </p>

      <Section title="What we collect">
        <ul>
          <li>
            <strong>GitHub identity.</strong> If you use legacy hosted authentication, GitHub
            shares your user id, login, name, avatar URL, and primary verified email (if granted
            via <code>user:email</code>). We never receive or store your GitHub password or any
            OAuth-unrelated GitHub token beyond the one-time code exchange.
          </li>
          <li>
            <strong>Workspaces and templates.</strong> When you create a workspace or push a
            template, we store the workspace slug, name, optional description/brand color, the
            template manifest, brief markdown, and optional design-rules markdown you send.
          </li>
          <li>
            <strong>Published rationales.</strong> When you publish a rationale, we store the
            rendered markdown and a reference to the spine hash.
          </li>
          <li>
            <strong>Drift snapshots.</strong> When you push drift reports from CI, we store a
            compact summary (counts + item list) plus the spine hashes you observed.
          </li>
          <li>
            <strong>API tokens.</strong> CLI bearer tokens are stored sha256-hashed only.
            Plaintext never hits our database.
          </li>
          <li>
            <strong>Operational logs.</strong> Vercel records request logs (IP, path, status,
            timestamp) for up to 30 days to help us investigate errors. No request bodies are
            logged by default.
          </li>
        </ul>
      </Section>

      <Section title="What we do not collect">
        <ul>
          <li>Your repo source code. The CLI runs offline for compile and drift checks.</li>
          <li>Your GitHub access token beyond the short-lived one used to identify you.</li>
          <li>Analytics cookies or third-party trackers on the landing page or hosted routes.</li>
        </ul>
      </Section>

      <Section title="Where your data lives">
        <p>
          Vercel (hosting + function execution) and Neon (Postgres database), both in the{" "}
          <code>iad1</code> region (US East). Deployments and backups are managed by those
          providers. Neon replicas may exist in the same region for durability.
        </p>
      </Section>

      <Section title="How long we keep it">
        <ul>
          <li>
            <strong>Active data</strong> (workspaces, templates, rationales, drift snapshots) is
            kept until you delete it or close your account.
          </li>
          <li>
            <strong>Revoked rationales</strong> are soft-deleted; the public URL returns 404 but
            the row remains in the database for audit. You can request hard deletion.
          </li>
          <li>
            <strong>Vercel request logs</strong> are retained per Vercel&apos;s own policy
            (currently 30 days).
          </li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us to export, correct, or permanently delete anything associated with your
          account by emailing{" "}
          <a href="mailto:support@projectspine.dev">support@projectspine.dev</a> from the address
          on your GitHub account. We will respond within 30 days. If we can&apos;t identify you,
          we&apos;ll tell you what we&apos;d need.
        </p>
      </Section>

      <Section title="Subprocessors">
        <ul>
          <li>GitHub (OAuth identity, source-of-truth for your repo)</li>
          <li>Vercel (hosting, DNS, logging)</li>
          <li>Neon (Postgres)</li>
          <li>Cloudflare (DNS for projectspine.dev)</li>
        </ul>
      </Section>

      <Section title="Changes">
        <p>
          We&apos;ll date any material changes and announce them in the repo&apos;s GitHub
          release notes. No silent changes.
        </p>
      </Section>

      <p style={{ marginTop: 48, fontSize: 13, color: "var(--ink-muted)" }}>
        <Link href="/">← Project Spine</Link> · <Link href="/terms">Terms</Link> ·{" "}
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
