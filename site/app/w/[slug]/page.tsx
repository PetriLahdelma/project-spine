import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const installCmd = `spine workspace switch ${slug}\nspine template list --source workspace`;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
      <div
        style={{
          fontSize: 13,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 8,
        }}
      >
        Workspace
      </div>
      <h1 style={{ fontSize: 32, letterSpacing: "-0.01em", marginBottom: 16 }}>{slug}</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>
        The hosted workspace UI is coming in v0.4.1. For now, browse templates and sync from the
        CLI — it&apos;s the same API the UI will consume.
      </p>

      <h2
        style={{
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          margin: "32px 0 12px",
        }}
      >
        From your terminal
      </h2>
      <pre
        style={{
          background: "var(--code-bg, #0f1318)",
          color: "var(--code-ink, #e8edf2)",
          padding: "16px 20px",
          borderRadius: 8,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 14,
          lineHeight: 1.6,
          overflowX: "auto",
        }}
      >
        {installCmd}
      </pre>

      <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-muted)" }}>
        <Link href="/">← Project Spine</Link>
      </p>
    </main>
  );
}
