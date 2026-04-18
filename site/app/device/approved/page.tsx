import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApprovedPage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const { login } = await searchParams;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px" }}>
      <div
        style={{
          fontSize: 13,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: 12,
        }}
      >
        Approved
      </div>
      <h1 style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 16 }}>
        You&apos;re signed in as {login ?? "your GitHub account"}.
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>
        Return to your terminal — the CLI will pick up the authorization within a few seconds
        and print a success line.
      </p>

      <div
        style={{
          padding: "16px 20px",
          borderRadius: 8,
          background: "#f1f5fa",
          border: "1px solid var(--line)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 14,
          color: "var(--ink-soft)",
          marginBottom: 32,
        }}
      >
        $ spine whoami
        <br />
        {login ? `${login} — ready to sync workspace templates.` : "signed in"}
      </div>

      <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
        <Link href="/">← Back to Project Spine</Link>
      </p>
    </main>
  );
}
