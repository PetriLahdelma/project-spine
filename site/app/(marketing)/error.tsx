"use client";

import { useEffect } from "react";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[marketing-error]", {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }
  }, [error]);

  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Unexpected error</p>
        <h1>Something broke while rendering that page.</h1>
        <p className="lede">The error has been logged. Try again, or head back to the home page.</p>
      </header>
      <div className="cta-row">
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "11px 18px",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            background: "var(--ink)",
            color: "#fff",
            fontSize: "14.5px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a href="/">Back to home</a>
      </div>
      {error.digest ? (
        <p style={{ marginTop: 24, fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--ink-muted)" }}>
          digest: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
