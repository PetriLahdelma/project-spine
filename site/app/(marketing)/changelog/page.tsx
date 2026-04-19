import Link from "next/link";
import type { Metadata } from "next";
import { renderMarkdown } from "../../../lib/markdown";

export const metadata: Metadata = {
  title: "Changelog · Project Spine",
  description: "Every release, pulled from GitHub. Nothing hidden.",
  alternates: { canonical: "https://projectspine.dev/changelog" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/changelog",
    siteName: "Project Spine",
    title: "Changelog · Project Spine",
    description: "Every release, pulled from GitHub. Nothing hidden.",
    images: [{ url: "/banner.png", width: 2400, height: 1500, alt: "Project Spine" }],
  },
};

type Release = {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
};

async function fetchReleases(): Promise<Release[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/PetriLahdelma/project-spine/releases?per_page=25",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 600 },
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Release[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

type RenderedRelease = Release & { bodyHtml: string };

async function renderBodies(releases: Release[]): Promise<RenderedRelease[]> {
  return Promise.all(
    releases.map(async (r) => ({ ...r, bodyHtml: await renderMarkdown(r.body ?? "") })),
  );
}

export default async function ChangelogPage() {
  const releases = await fetchReleases();
  const rendered = await renderBodies(releases);
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Changelog</p>
        <h1>What shipped, when, and what changed.</h1>
        <p className="lede">
          Pulled live from the{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/releases">
            GitHub releases page
          </a>
          . Every version here has a git tag and a npm publish. No ghosted
          features, no marketing-only version numbers.
        </p>
      </header>

      {rendered.length === 0 ? (
        <p className="changelog__empty">
          Could not load releases right now. See the{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/releases">
            releases page on GitHub
          </a>{" "}
          directly.
        </p>
      ) : (
        <ol className="changelog__list">
          {rendered.map((r) => (
            <li key={r.tag_name} className="changelog__item">
              <div className="changelog__meta">
                <h3 className="changelog__title">
                  <a href={r.html_url}>{r.name || r.tag_name}</a>
                </h3>
                <span className="changelog__date">
                  {r.published_at
                    ? new Date(r.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "unknown"}
                  {r.prerelease ? " · pre-release" : ""}
                </span>
              </div>
              {r.bodyHtml ? (
                <div
                  className="changelog__body"
                  dangerouslySetInnerHTML={{ __html: r.bodyHtml }}
                />
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <p className="changelog__footnote">
        Cached for 10 minutes. Source of truth:{" "}
        <a href="https://github.com/PetriLahdelma/project-spine/releases">
          github.com/PetriLahdelma/project-spine/releases
        </a>
        .
      </p>

      <div className="cta-row">
        <Link href="/product">Product tour →</Link>
        <Link href="/docs">Documentation →</Link>
      </div>
    </main>
  );
}
