"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[global-error]", {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
          background: "#f6fafd",
          color: "#11151a",
          padding: "48px 24px",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <p
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#ff4fb4",
              margin: "0 0 10px",
            }}
          >
            Unexpected error
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            Something broke while rendering that page.
          </h1>
          <p style={{ color: "#3a4450", fontSize: 16, lineHeight: 1.55, margin: "0 0 24px" }}>
            The error has been logged. Try again, or head back to the home page.
          </p>
          <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "11px 18px",
                borderRadius: 8,
                border: "2px solid #11151a",
                background: "#11151a",
                color: "#fff",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "11px 18px",
                borderRadius: 8,
                border: "2px solid #11151a",
                background: "#fff",
                color: "#11151a",
                fontSize: 14.5,
                fontWeight: 600,
                textDecoration: "none",
                lineHeight: 1,
              }}
            >
              Back to home
            </a>
          </div>
          {error.digest ? (
            <p
              style={{
                marginTop: 32,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 12,
                color: "#6b7480",
              }}
            >
              digest: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
