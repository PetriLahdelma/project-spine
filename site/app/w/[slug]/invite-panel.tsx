"use client";

import { useState, useTransition } from "react";
import { createInviteAction, revokeInviteAction, type InviteRow } from "./actions";

type Props = {
  workspaceSlug: string;
  accent: string;
  initialInvites: InviteRow[];
};

export function InvitePanel({ workspaceSlug, accent, initialInvites }: Props) {
  const [invites, setInvites] = useState<InviteRow[]>(initialInvites);
  const [role, setRole] = useState<"member" | "admin">("member");
  const [fresh, setFresh] = useState<{ url: string; code: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pending = invites.filter((i) => !i.acceptedAt && !i.revokedAt && new Date(i.expiresAt) > new Date());

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createInviteAction(workspaceSlug, role);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setFresh(res);
      // Optimistically add to pending list
      setInvites((prev) => [
        {
          code: res.code,
          role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          acceptedAt: null,
          revokedAt: null,
          createdAt: new Date(),
          url: res.url,
        },
        ...prev,
      ]);
    });
  }

  async function onRevoke(code: string) {
    if (!confirm("Revoke this invite? The URL will immediately stop working.")) return;
    startTransition(async () => {
      const res = await revokeInviteAction(workspaceSlug, code);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setInvites((prev) => prev.map((i) => (i.code === code ? { ...i, revokedAt: new Date() } : i)));
      if (fresh?.code === code) setFresh(null);
    });
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore — the value is still selectable in the input
    }
  }

  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: 20,
        background: "#fff",
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        Invite a teammate
      </h2>

      <form onSubmit={onCreate} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 8 }}>
          Role:
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            disabled={isPending}
            style={{
              padding: "6px 10px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: 0,
            background: "var(--ink)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? "Creating…" : "Create invite link"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ marginTop: 12, fontSize: 13, color: "#b91c1c" }}>
          {errorMessage(error)}
        </p>
      )}

      {fresh && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "#f1f5fa",
            border: `1px solid ${accent}`,
            borderRadius: 8,
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ink-soft)" }}>
            Share this link. The invitee signs in via GitHub and is auto-added.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              readOnly
              value={fresh.url}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                flex: 1,
                padding: "8px 10px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13,
                border: "1px solid var(--line)",
                borderRadius: 6,
                background: "#fff",
              }}
            />
            <button
              type="button"
              onClick={() => copyUrl(fresh.url)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--line)",
                background: "#fff",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)", margin: "0 0 8px", fontWeight: 600 }}>
            Pending ({pending.length})
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {pending.map((i) => (
              <li
                key={i.code}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{i.role}</strong>
                  <span style={{ color: "var(--ink-muted)", marginLeft: 8 }}>
                    expires {new Date(i.expiresAt).toLocaleDateString()}
                  </span>
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => copyUrl(i.url)}
                    style={{
                      padding: "4px 10px",
                      border: "1px solid var(--line)",
                      borderRadius: 4,
                      background: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => onRevoke(i.code)}
                    disabled={isPending}
                    style={{
                      padding: "4px 10px",
                      border: "1px solid var(--line)",
                      borderRadius: 4,
                      background: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "#b91c1c",
                    }}
                  >
                    Revoke
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function errorMessage(code: string): string {
  if (code === "not_signed_in") return "Your session expired. Refresh and sign in again.";
  if (code === "forbidden") return "Only owners and admins can create invites.";
  if (code === "not_found") return "Workspace not found.";
  return `Error: ${code}`;
}
