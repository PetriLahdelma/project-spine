import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { users, workspaces, workspaceInvites } from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";

export const dynamic = "force-dynamic";

type RouteParams = { code: string };

const ERRORS: Record<string, string> = {
  unknown: "That invite doesn't exist.",
  revoked: "That invite was revoked.",
  "already-used": "That invite has already been used.",
  expired: "That invite expired.",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;

  const [invite] = await db
    .select({
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      acceptedAt: workspaceInvites.acceptedAt,
      revokedAt: workspaceInvites.revokedAt,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
      brandColor: workspaces.brandColor,
      inviterLogin: users.githubLogin,
      inviterName: users.name,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .innerJoin(users, eq(users.id, workspaceInvites.createdBy))
    .where(eq(workspaceInvites.code, code))
    .limit(1);

  const user = await getWebSessionUser();
  const errorText = sp.error ? ERRORS[sp.error] ?? sp.error : null;
  const accent = invite?.brandColor && /^#[0-9a-fA-F]{6}$/.test(invite.brandColor) ? invite.brandColor : "#ff4fb4";

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "64px 24px" }}>
      <div
        style={{
          fontSize: 12,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 12,
        }}
      >
        Workspace invite
      </div>

      {invite ? (
        <>
          <h1 style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 12 }}>
            Join <span style={{ color: accent }}>{invite.workspaceName}</span>
          </h1>
          <p style={{ color: "var(--ink-soft)", marginBottom: 32 }}>
            {invite.inviterName ?? invite.inviterLogin} invited you as a{" "}
            <strong>{invite.role}</strong>. Members can read and push templates, publish
            rationales, and push drift snapshots. Invite expires{" "}
            {new Date(invite.expiresAt).toLocaleDateString("en", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 28, letterSpacing: "-0.01em", marginBottom: 12 }}>
            Invite not found
          </h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Double-check the link, or ask the workspace owner to resend.
          </p>
        </>
      )}

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

      {invite && !invite.revokedAt && !invite.acceptedAt && invite.expiresAt > new Date() && (
        <form method="POST" action={`/api/invite/${encodeURIComponent(code)}/accept`}>
          {user ? (
            <>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ink-muted)",
                  marginBottom: 12,
                }}
              >
                Signed in as <strong>{user.githubLogin}</strong>.
              </p>
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
                  width: "100%",
                }}
              >
                Accept and join {invite.workspaceSlug} →
              </button>
            </>
          ) : (
            <a
              href={`/api/auth/github/login?next=${encodeURIComponent(`/invite/${code}`)}`}
              style={{
                display: "block",
                padding: "12px 18px",
                borderRadius: 8,
                background: "var(--ink)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Sign in with GitHub to accept →
            </a>
          )}
        </form>
      )}

      <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-muted)" }}>
        <Link href="/">← Project Spine</Link>
      </p>
    </main>
  );
}
