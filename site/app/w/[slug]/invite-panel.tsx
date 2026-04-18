"use client";

import { useState, useTransition } from "react";
import { createInviteAction, revokeInviteAction, type InviteRow } from "./actions";

type Props = {
  workspaceSlug: string;
  accent: string;
  initialInvites: InviteRow[];
};

export function InvitePanel({ workspaceSlug, initialInvites }: Props) {
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
      /* input remains selectable */
    }
  }

  return (
    <section className="ws-panel ws-panel--invite">
      <header className="ws-panel__header">
        <h2 className="ws-panel__title">Invite a teammate</h2>
      </header>

      <form onSubmit={onCreate} className="ws-invite__form">
        <label className="ws-invite__field">
          <span>Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            disabled={isPending}
            className="ws-invite__select"
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button type="submit" disabled={isPending} className="ws-invite__submit">
          {isPending ? "Creating…" : "Create invite link"}
        </button>
      </form>

      {error && (
        <p role="alert" className="ws-invite__error">
          {errorMessage(error)}
        </p>
      )}

      {fresh && (
        <div className="ws-invite__fresh">
          <p className="ws-invite__fresh-msg">
            Share this link. The invitee signs in via GitHub and joins automatically.
          </p>
          <div className="ws-invite__copy-row">
            <input
              readOnly
              value={fresh.url}
              onFocus={(e) => e.currentTarget.select()}
              className="ws-invite__url"
              aria-label="Invite URL"
            />
            <button type="button" onClick={() => copyUrl(fresh.url)} className="ws-invite__copy">
              Copy
            </button>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="ws-invite__pending">
          <h3 className="ws-invite__pending-title">Pending · {pending.length}</h3>
          <ul className="ws-rows">
            {pending.map((i) => (
              <li key={i.code} className="ws-row">
                <span className="ws-row__main">
                  <span className={`ws-badge ws-badge--${i.role}`}>{i.role}</span>
                  <span className="ws-row__dim">
                    expires {new Date(i.expiresAt).toLocaleDateString()}
                  </span>
                </span>
                <span className="ws-invite__actions">
                  <button
                    type="button"
                    onClick={() => copyUrl(i.url)}
                    className="ws-invite__mini"
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => onRevoke(i.code)}
                    disabled={isPending}
                    className="ws-invite__mini ws-invite__mini--danger"
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
