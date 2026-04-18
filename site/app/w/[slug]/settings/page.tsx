import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

type RouteParams = { slug: string };

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} settings — Project Spine`,
    robots: { index: false, follow: false },
  };
}

export default async function WorkspaceSettingsPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const user = await getWebSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/w/${slug}/settings`)}`);

  const [ws] = await db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      description: workspaces.description,
      brandColor: workspaces.brandColor,
      logoUrl: workspaces.logoUrl,
      ownerId: workspaces.ownerId,
      role: memberships.role,
      createdAt: workspaces.createdAt,
    })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(workspaces.slug, slug), eq(memberships.userId, user.id)))
    .limit(1);

  if (!ws) redirect("/");
  const isOwner = ws.ownerId === user.id;
  const accent = ws.brandColor && /^#[0-9a-fA-F]{6}$/.test(ws.brandColor) ? ws.brandColor : "#ff4fb4";

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 96px" }}>
      <nav style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 24 }}>
        <Link href="/">Project Spine</Link>{" · "}
        <Link href={`/w/${ws.slug}`}>
          <span style={{ color: accent }}>{ws.slug}</span>
        </Link>
        {" · "}
        <span>settings</span>
        <span style={{ float: "right" }}>
          {user.githubLogin} · <Link href="/logout">log out</Link>
        </span>
      </nav>

      <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: 24, marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.01em", margin: 0 }}>Workspace settings</h1>
        <p style={{ color: "var(--ink-muted)", margin: "6px 0 0" }}>
          {isOwner
            ? "Rename, re-brand, or replace the logo. Changes apply to future rationale pages immediately."
            : "Only the workspace owner can change these settings."}
        </p>
      </header>

      {isOwner ? (
        <SettingsForm
          slug={ws.slug}
          initial={{
            name: ws.name,
            description: ws.description,
            brandColor: ws.brandColor,
            logoUrl: ws.logoUrl,
          }}
        />
      ) : (
        <ReadOnlyView
          name={ws.name}
          description={ws.description}
          brandColor={ws.brandColor}
          logoUrl={ws.logoUrl}
          role={ws.role}
          accent={accent}
        />
      )}
    </main>
  );
}

function ReadOnlyView({
  name,
  description,
  brandColor,
  logoUrl,
  role,
  accent,
}: {
  name: string;
  description: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  role: string;
  accent: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row label="Name" value={name} />
      <Row label="Description" value={description ?? "—"} />
      <Row
        label="Brand color"
        value={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: accent,
                border: "1px solid var(--line)",
              }}
            />
            <code style={{ fontFamily: "ui-monospace, monospace" }}>{brandColor ?? "default"}</code>
          </span>
        }
      />
      <Row
        label="Logo URL"
        value={
          logoUrl ? (
            <a href={logoUrl} style={{ color: accent }} target="_blank" rel="noopener noreferrer">
              {logoUrl}
            </a>
          ) : (
            "—"
          )
        }
      />
      <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 16 }}>
        You're signed in as a <strong>{role}</strong> — ask the workspace owner to change any of these.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
      <span style={{ fontSize: 13, color: "var(--ink-muted)", minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}
