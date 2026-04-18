import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import {
  memberships,
  projects,
  rationales,
  templates,
  users,
  workspaces,
} from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";
import { listInvitesAction } from "./actions";
import { InvitePanel } from "./invite-panel";

export const dynamic = "force-dynamic";

type RouteParams = { slug: string };

async function loadWorkspacePage(slug: string, userId: string) {
  const [ws] = await db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      description: workspaces.description,
      brandColor: workspaces.brandColor,
      logoUrl: workspaces.logoUrl,
      role: memberships.role,
    })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(workspaces.slug, slug), eq(memberships.userId, userId)))
    .limit(1);
  if (!ws) return null;

  const [membersRows, templatesRows, rationalesRows, projectsRows] = await Promise.all([
    db
      .select({
        login: users.githubLogin,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.workspaceId, ws.id))
      .orderBy(asc(users.githubLogin)),
    db
      .select({
        name: templates.name,
        title: templates.title,
        projectType: templates.projectType,
        updatedAt: templates.updatedAt,
      })
      .from(templates)
      .where(eq(templates.workspaceId, ws.id))
      .orderBy(asc(templates.name)),
    db
      .select({
        publicSlug: rationales.publicSlug,
        projectName: rationales.projectName,
        title: rationales.title,
        updatedAt: rationales.updatedAt,
      })
      .from(rationales)
      .where(eq(rationales.workspaceId, ws.id))
      .orderBy(desc(rationales.updatedAt))
      .limit(20),
    db
      .select({
        slug: projects.slug,
        name: projects.name,
        lastClean: projects.lastClean,
        lastDriftAt: projects.lastDriftAt,
      })
      .from(projects)
      .where(eq(projects.workspaceId, ws.id))
      .orderBy(desc(projects.lastDriftAt))
      .limit(50),
  ]);

  return { ws, members: membersRows, templates: templatesRows, rationales: rationalesRows, projects: projectsRows };
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Project Spine workspace`,
    robots: { index: false, follow: false },
  };
}

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await getWebSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/w/${slug}`)}`);

  const data = await loadWorkspacePage(slug, user.id);
  if (!data) redirect("/");

  const accent = data.ws.brandColor && /^#[0-9a-fA-F]{6}$/.test(data.ws.brandColor) ? data.ws.brandColor : "#ff4fb4";
  const canManage = data.ws.role === "owner" || data.ws.role === "admin";

  const initialInvites = canManage ? await listInvitesAction(data.ws.slug) : [];

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px 96px" }}>
      <nav style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 24 }}>
        <Link href="/">Project Spine</Link>{" · "}
        <span>workspace</span>{" · "}
        <span style={{ color: accent }}>{data.ws.slug}</span>
        <span style={{ float: "right" }}>
          {user.githubLogin} · <Link href="/logout">log out</Link>
        </span>
      </nav>

      <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: 24, marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.01em", margin: 0 }}>{data.ws.name}</h1>
        {data.ws.description ? (
          <p style={{ color: "var(--ink-muted)", margin: "6px 0 0" }}>{data.ws.description}</p>
        ) : null}
        {sp.welcome ? (
          <p style={{ marginTop: 12, color: accent, fontSize: 14 }}>Welcome! You just joined.</p>
        ) : null}
      </header>

      <Grid>
        <Panel title="Members" count={data.members.length}>
          <ul style={ulReset}>
            {data.members.map((m) => (
              <li key={m.login} style={liRow}>
                <span>
                  <strong>{m.login}</strong>
                  {m.name ? <span style={{ color: "var(--ink-muted)" }}> · {m.name}</span> : null}
                </span>
                <span style={roleBadge(m.role, accent)}>{m.role}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Templates"
          count={data.templates.length}
          footer={
            <p style={footer}>
              push one with <code>spine template save --location workspace --name …</code>
            </p>
          }
        >
          {data.templates.length === 0 ? (
            <Empty>no templates yet</Empty>
          ) : (
            <ul style={ulReset}>
              {data.templates.map((t) => (
                <li key={t.name} style={liRow}>
                  <span>
                    <strong>{t.name}</strong>{" "}
                    <span style={{ color: "var(--ink-muted)" }}>· {t.title}</span>
                  </span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--ink-muted)" }}>
                    {t.projectType}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Grid>

      <Grid>
        <Panel title="Published rationales" count={data.rationales.length}>
          {data.rationales.length === 0 ? (
            <Empty>no rationales published yet</Empty>
          ) : (
            <ul style={ulReset}>
              {data.rationales.map((r) => (
                <li key={r.publicSlug} style={liRow}>
                  <span>
                    <a href={`/r/${r.publicSlug}`} style={{ color: accent }}>
                      {r.projectName}
                    </a>
                    <span style={{ color: "var(--ink-muted)" }}> · {r.title}</span>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Projects (drift)" count={data.projects.length}>
          {data.projects.length === 0 ? (
            <Empty>no drift data yet — run <code>spine drift check --push</code> in CI</Empty>
          ) : (
            <ul style={ulReset}>
              {data.projects.map((p) => (
                <li key={p.slug} style={liRow}>
                  <span>
                    <strong>{p.name}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "ui-monospace, monospace",
                      color: p.lastClean === "clean" ? "#16a34a" : "#b45309",
                    }}
                  >
                    {p.lastClean ?? "unknown"}
                    {p.lastDriftAt ? ` · ${new Date(p.lastDriftAt).toLocaleString()}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Grid>

      {canManage ? (
        <InvitePanel
          workspaceSlug={data.ws.slug}
          accent={accent}
          initialInvites={
            Array.isArray(initialInvites)
              ? initialInvites.map((i) => ({
                  ...i,
                  expiresAt: new Date(i.expiresAt),
                  acceptedAt: i.acceptedAt ? new Date(i.acceptedAt) : null,
                  revokedAt: i.revokedAt ? new Date(i.revokedAt) : null,
                  createdAt: new Date(i.createdAt),
                }))
              : []
          }
        />
      ) : null}
    </main>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 24,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function Panel({
  title,
  count,
  footer,
  children,
}: {
  title: string;
  count?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: 20,
        background: "#fff",
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
        {title}
        {typeof count === "number" ? (
          <span
            style={{ fontWeight: 400, color: "var(--ink-muted)", marginLeft: 8, letterSpacing: 0 }}
          >
            ({count})
          </span>
        ) : null}
      </h2>
      {children}
      {footer}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: 0 }}>{children}</p>
  );
}

const ulReset = { listStyle: "none", padding: 0, margin: 0 };
const liRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid var(--line)",
};
const footer: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-muted)",
  marginTop: 12,
  marginBottom: 0,
};
const code: React.CSSProperties = {
  background: "var(--code-bg, #0f1318)",
  color: "var(--code-ink, #e8edf2)",
  padding: "12px 16px",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  overflowX: "auto",
  margin: "12px 0 0",
};

function roleBadge(role: string, accent: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "2px 8px",
    borderRadius: 999,
    color: role === "owner" ? "#fff" : accent,
    background: role === "owner" ? accent : "transparent",
    border: role === "owner" ? "none" : `1px solid ${accent}`,
  };
}
