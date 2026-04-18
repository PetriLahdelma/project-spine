"use client";

import { useState, useTransition } from "react";
import { revokeRationaleAction } from "./actions";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  title,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* silently fail — user can still select */
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="ws-action"
      aria-label={title ?? label}
      title={title}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export function RevokeRationaleButton({
  workspaceSlug,
  publicSlug,
  projectName,
}: {
  workspaceSlug: string;
  publicSlug: string;
  projectName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onRevoke() {
    if (
      !confirm(
        `Revoke the rationale for "${projectName}"? The public URL will immediately start returning 404.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await revokeRationaleAction(workspaceSlug, publicSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) return <span className="ws-action ws-action--done">Revoked</span>;
  return (
    <>
      <button
        type="button"
        onClick={onRevoke}
        disabled={isPending}
        className="ws-action ws-action--danger"
      >
        {isPending ? "Revoking…" : "Revoke"}
      </button>
      {error ? (
        <span className="ws-action__error" role="alert">
          {error === "forbidden" ? "admin only" : error === "not_found" ? "already gone" : error}
        </span>
      ) : null}
    </>
  );
}
