import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { marked } from "marked";
import { db } from "@/db";
import { rationales, workspaces } from "@/db/schema";
import { sanitizeRationaleHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

type Params = { publicSlug: string };

async function loadRationale(publicSlug: string) {
  const [row] = await db
    .select({
      title: rationales.title,
      projectName: rationales.projectName,
      contentMd: rationales.contentMd,
      publishedAt: rationales.publishedAt,
      updatedAt: rationales.updatedAt,
      workspaceSlug: workspaces.slug,
      workspaceName: workspaces.name,
      brandColor: workspaces.brandColor,
      logoUrl: workspaces.logoUrl,
    })
    .from(rationales)
    .innerJoin(workspaces, eq(workspaces.id, rationales.workspaceId))
    .where(and(eq(rationales.publicSlug, publicSlug), isNull(rationales.revokedAt)))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { publicSlug } = await params;
  const row = await loadRationale(publicSlug);
  if (!row) return { title: "Rationale — Project Spine" };
  return {
    title: `${row.title} — ${row.workspaceName}`,
    description: `Project rationale for ${row.projectName} by ${row.workspaceName}.`,
    robots: { index: false, follow: false },
  };
}

export default async function RationalePage({ params }: { params: Promise<Params> }) {
  const { publicSlug } = await params;
  const row = await loadRationale(publicSlug);
  if (!row) notFound();

  // Rationale markdown lands on a PUBLIC URL. Any workspace member could
  // publish `.md` with inline <script>; marked passes raw HTML through by
  // default. Render via marked, then sanitize through an allowlist before
  // injecting with dangerouslySetInnerHTML.
  const rawHtml = await marked.parse(row.contentMd, { async: true, gfm: true, breaks: false });
  const html = sanitizeRationaleHtml(rawHtml);
  const accent = row.brandColor && /^#[0-9a-fA-F]{6}$/.test(row.brandColor) ? row.brandColor : "#ff4fb4";

  return (
    <main
      style={{
        maxWidth: 740,
        margin: "0 auto",
        padding: "64px 24px 96px",
      }}
    >
      <header style={{ marginBottom: 48 }}>
        {row.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.logoUrl}
            alt={row.workspaceName}
            style={{ height: 28, marginBottom: 24 }}
          />
        ) : (
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              marginBottom: 12,
            }}
          >
            {row.workspaceName}
          </div>
        )}
        <h1
          style={{
            fontSize: 32,
            letterSpacing: "-0.01em",
            margin: 0,
            color: "var(--ink)",
          }}
        >
          {row.title}
        </h1>
        <p
          style={{
            color: "var(--ink-muted)",
            fontSize: 14,
            marginTop: 8,
          }}
        >
          Published {new Date(row.publishedAt).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
          {row.updatedAt > row.publishedAt
            ? ` · updated ${new Date(row.updatedAt).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}`
            : ""}
        </p>
      </header>

      <article
        className="rationale-body"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          color: "var(--ink-soft)",
          fontSize: 17,
          lineHeight: 1.7,
        }}
      />

      <footer
        style={{
          marginTop: 80,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
          fontSize: 13,
          color: "var(--ink-muted)",
        }}
      >
        <p>
          Published via{" "}
          <a href="https://projectspine.dev" style={{ color: accent }}>
            Project Spine
          </a>{" "}
          — compiled from brief, repo, and design inputs. Revoke anytime with{" "}
          <code>spine rationale revoke</code>.
        </p>
      </footer>

      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            .rationale-body h1 { display: none; } /* title already rendered in header */
            .rationale-body h2 {
              font-size: 13px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--ink-muted);
              margin: 48px 0 12px;
              font-weight: 600;
            }
            .rationale-body h3 { font-size: 18px; margin: 32px 0 12px; color: var(--ink); }
            .rationale-body ul, .rationale-body ol { padding-left: 24px; }
            .rationale-body li { margin-bottom: 8px; }
            .rationale-body a { color: ${accent}; }
            .rationale-body code {
              font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              font-size: 0.92em;
              background: #eef3f8;
              padding: 1px 6px;
              border-radius: 4px;
            }
            .rationale-body blockquote {
              border-left: 3px solid ${accent};
              padding-left: 20px;
              color: var(--ink-muted);
              margin: 24px 0;
            }
          `,
        }}
      />
    </main>
  );
}
