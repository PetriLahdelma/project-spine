import Link from "next/link";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  "missing-code": "No code was submitted. Please enter the code shown in your terminal.",
  "unknown-code": "That code wasn't found. Check for typos or try running `spine login` again.",
  "already-used": "That code has already been used. Run `spine login` again to get a fresh one.",
  expired: "That code expired. Codes last 15 minutes. Run `spine login` again.",
  "state-mismatch": "Something went wrong during the GitHub redirect. Please try again.",
  "bad-callback": "The GitHub callback was malformed. Please try again.",
  "oauth-exchange-failed":
    "Couldn't exchange the GitHub authorization code. This is usually a server config issue.",
  "device-code-unavailable":
    "The device code expired or was already used between the approval and this redirect. Run `spine login` again.",
};

export default async function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const prefilled = sp.code ?? "";
  const errorText = sp.error ? (errors[sp.error] ?? sp.error) : null;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 12 }}>Authorize your device</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>
        Paste the code shown in your terminal after running <code>spine login</code>, then click{" "}
        <strong>Authorize</strong>. You&apos;ll be redirected to GitHub to approve access.
      </p>

      {errorText && (
        <div
          role="alert"
          style={{
            padding: "12px 14px",
            marginBottom: 24,
            borderRadius: 8,
            background: "#ffecec",
            color: "#7a1212",
            border: "1px solid #f4c7c7",
            fontSize: 14,
          }}
        >
          {errorText}
        </div>
      )}

      <form method="POST" action="/api/auth/device/verify" style={{ display: "grid", gap: 16 }}>
        <label
          htmlFor="code"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, color: "var(--ink-muted)" }}
        >
          YOUR CODE
        </label>
        <input
          id="code"
          name="code"
          defaultValue={prefilled}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="XXXX-XXXX"
          required
          pattern="[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 22,
            padding: "14px 18px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            background: "#fff",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            border: 0,
            background: "var(--ink)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Authorize on GitHub →
        </button>
      </form>

      <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-muted)" }}>
        <Link href="/">← Back to Project Spine</Link>
      </p>
    </main>
  );
}
