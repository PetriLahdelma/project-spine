"use client";

import { useEffect, useState } from "react";

type Props = {
  scope: string;
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Shared UI + upstream-reporting for marketing-level and global error
 * boundaries. On mount: POST a length-capped payload to /api/log/error so
 * Vercel logs capture the failure. On user action: retry, go home, or copy
 * the digest and open a prefilled GitHub issue.
 */
export function ErrorDetails({ scope, error, reset }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Keep console.error so dev tools still show the payload inline.
    if (typeof console !== "undefined") {
      console.error(`[${scope}]`, {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }
    const payload = {
      scope,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      href: typeof window !== "undefined" ? window.location.href : undefined,
      ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
    // Fire-and-forget. The endpoint never rejects on bad input.
    void fetch("/api/log/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Network out → nothing to do; we already logged to console.
    });
  }, [error, scope]);

  async function copyDigest(): Promise<void> {
    if (!error.digest) return;
    try {
      await navigator.clipboard.writeText(error.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable (non-HTTPS in dev, iframe, etc.) — fall back
      // to selecting the text so the user can copy manually.
      const el = document.getElementById("error-digest-text");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  const issueUrl = buildIssueUrl(error, scope);

  return (
    <>
      <div className="error-actions">
        <button type="button" className="error-actions__primary" onClick={() => reset()}>
          Try again
        </button>
        <a className="error-actions__secondary" href="/">
          Back to home
        </a>
        <a
          className="error-actions__secondary"
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open a GitHub issue
        </a>
      </div>
      {error.digest ? (
        <div className="error-digest">
          <span className="error-digest__label">digest</span>
          <code id="error-digest-text" className="error-digest__value">
            {error.digest}
          </code>
          <button
            type="button"
            className="error-digest__copy"
            onClick={copyDigest}
            aria-label="Copy error digest"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      ) : null}
    </>
  );
}

function buildIssueUrl(error: Error & { digest?: string }, scope: string): string {
  const title = `Client error: ${truncate(error.message, 80)}`;
  const body = [
    "**Scope:** " + scope,
    error.digest ? "**Digest:** `" + error.digest + "`" : null,
    "**Message:** " + error.message,
    "",
    "_Steps to reproduce, if known:_",
    "",
  ]
    .filter(Boolean)
    .join("\n");
  const base = "https://github.com/PetriLahdelma/project-spine/issues/new";
  const params = new URLSearchParams({ title, body, labels: "bug,site" });
  return `${base}?${params.toString()}`;
}

function truncate(s: string, max: number): string {
  if (!s) return "(no message)";
  return s.length > max ? s.slice(0, max) + "…" : s;
}
