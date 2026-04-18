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
    title: `${slug} · Project Spine workspace`,
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
    <div className="ws" style={{ ["--ws-accent" as string]: accent }}>
      <header className="ws-chrome">
        <div className="ws-chrome__inner">
          <nav className="ws-crumbs" aria-label="Workspace navigation">
            <Link href="/" className="ws-crumbs__brand">Project Spine</Link>
            <span className="ws-crumbs__sep" aria-hidden>/</span>
            <span className="ws-crumbs__label">workspace</span>
            <span className="ws-crumbs__sep" aria-hidden>/</span>
            <span className="ws-crumbs__slug">
              <span className="ws-crumbs__dot" aria-hidden />
              {data.ws.slug}
            </span>
          </nav>
          <div className="ws-chrome__actions">
            <Link href={`/w/${data.ws.slug}/settings`} className="ws-chrome__link">Settings</Link>
            <span className="ws-chrome__user">
              <span className="ws-chrome__avatar" aria-hidden>
                {user.githubLogin.slice(0, 1).toUpperCase()}
              </span>
              {user.githubLogin}
            </span>
            <Link href="/logout" className="ws-chrome__signout">Log out</Link>
          </div>
        </div>
      </header>

      <main className="ws-main">
        <header className="ws-hero">
          <p className="ws-hero__eyebrow">{data.ws.role}</p>
          <h1 className="ws-hero__title">{data.ws.name}</h1>
          {data.ws.description ? (
            <p className="ws-hero__sub">{data.ws.description}</p>
          ) : null}
        </header>

        {sp.welcome ? (
          <section className="ws-welcome">
            <p className="ws-welcome__eyebrow">Welcome · next steps</p>
            <h2 className="ws-welcome__title">Pair your CLI to this workspace.</h2>
            <p className="ws-welcome__body">
              Workspaces run on the Project Spine CLI. Install it, sign in, then
              switch to <code>{data.ws.slug}</code> to push shared templates and
              drift reports from this machine.
            </p>
            <pre className="ws-welcome__code">
{`npm install -g project-spine@next
spine login
spine workspace switch ${data.ws.slug}`}
            </pre>
            <p className="ws-welcome__foot">
              Next: invite a teammate below, or read the{" "}
              <a href="https://github.com/PetriLahdelma/project-spine#quickstart">CLI quickstart</a>.
            </p>
          </section>
        ) : null}

        <div className="ws-grid">
          <Panel title="Members" count={data.members.length}>
            <ul className="ws-rows">
              {data.members.map((m) => (
                <li key={m.login} className="ws-row">
                  <span className="ws-row__main">
                    <strong>{m.login}</strong>
                    {m.name ? <span className="ws-row__dim"> · {m.name}</span> : null}
                  </span>
                  <span className={`ws-badge ws-badge--${m.role}`}>{m.role}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Templates"
            count={data.templates.length}
            footer={
              <p className="ws-panel__foot">
                push one with <code>spine template save --location workspace --name …</code>
              </p>
            }
          >
            {data.templates.length === 0 ? (
              <Empty>no templates yet</Empty>
            ) : (
              <ul className="ws-rows">
                {data.templates.map((t) => (
                  <li key={t.name} className="ws-row">
                    <span className="ws-row__main">
                      <strong>{t.name}</strong>
                      <span className="ws-row__dim"> · {t.title}</span>
                    </span>
                    <span className="ws-row__meta">{t.projectType}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Published rationales" count={data.rationales.length}>
            {data.rationales.length === 0 ? (
              <Empty>no rationales published yet</Empty>
            ) : (
              <ul className="ws-rows">
                {data.rationales.map((r) => (
                  <li key={r.publicSlug} className="ws-row">
                    <span className="ws-row__main">
                      <a href={`/r/${r.publicSlug}`} className="ws-row__link">{r.projectName}</a>
                      <span className="ws-row__dim"> · {r.title}</span>
                    </span>
                    <span className="ws-row__meta ws-row__meta--date">
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Projects (drift)" count={data.projects.length}>
            {data.projects.length === 0 ? (
              <Empty>
                no drift data yet · run <code>spine drift check --push</code> in CI
              </Empty>
            ) : (
              <ul className="ws-rows">
                {data.projects.map((p) => (
                  <li key={p.slug} className="ws-row">
                    <span className="ws-row__main">
                      <strong>{p.name}</strong>
                    </span>
                    <span className="ws-row__meta">
                      <span className={`ws-chip ws-chip--${p.lastClean ?? "unknown"}`}>
                        {p.lastClean ?? "unknown"}
                      </span>
                      {p.lastDriftAt ? (
                        <span className="ws-row__meta-time">
                          {new Date(p.lastDriftAt).toLocaleString()}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

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
    <section className="ws-panel">
      <header className="ws-panel__header">
        <h2 className="ws-panel__title">{title}</h2>
        {typeof count === "number" ? (
          <span className="ws-panel__count">{count}</span>
        ) : null}
      </header>
      <div className="ws-panel__body">{children}</div>
      {footer}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="ws-empty">{children}</p>;
}
