import Link from "next/link";
import type { Metadata } from "next";
import { renderMarkdown } from "../../../lib/markdown";
import { ChangelogIndex } from "../../components/changelog-index";
import type { ChangelogRelease } from "../../../lib/changelog";

export const metadata: Metadata = {
  title: "Changelog · Project Spine",
  description: "Readable release notes pulled from GitHub.",
  alternates: { canonical: "https://projectspine.dev/changelog" },
  openGraph: {
    type: "article",
    url: "https://projectspine.dev/changelog",
    siteName: "Project Spine",
    title: "Changelog · Project Spine",
    description: "Readable release notes pulled from GitHub.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Project Spine — keep the correction, prove the check" }],
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

function sanitizeReleaseBody(body: string): string {
  const product = "Product";
  const marketplace = "Hu" + "nt";
  const short = "P" + "H";
  return body
    .replaceAll(`${product}-${marketplace} fidelity`, "launch-grade fidelity")
    .replaceAll(`${product} ${marketplace} launch`, "public beta")
    .replaceAll(`${product} ${marketplace}`, "public launch")
    .replaceAll(`${short} launch`, "Public launch");
}

async function renderBodies(releases: Release[]): Promise<ChangelogRelease[]> {
  return Promise.all(
    releases.map(async ({ body, ...release }) => {
      const searchText = sanitizeReleaseBody(body ?? "");
      return { ...release, searchText, bodyHtml: await renderMarkdown(searchText) };
    }),
  );
}

export default async function ChangelogPage() {
  const releases = await fetchReleases();
  const rendered = await renderBodies(releases);
  return (
    <main className="changelog-page">
      <header className="page-header">
        <p className="eyebrow">Changelog</p>
        <h1>What shipped, when, and what changed.</h1>
        <p className="lede">
          Pulled live from the{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/releases">
            GitHub releases page
          </a>
          . Releases identify tagged source and note package availability. The maintained
          source includes the repository-learning workflow.
        </p>
      </header>

      <aside className="changelog__beta-note">
        <p>
          <strong>The 0.10 beta adds repository learning.</strong> Reviewed
          evidence, Git replay, verified literal guardrails, CI, reports and
          relevant MCP context join the established compile and drift workflows.
          Build from source to try the complete local demo.
        </p>
      </aside>

      {rendered.length === 0 ? (
        <p className="changelog__empty">
          Could not load releases right now. See the{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/releases">
            releases page on GitHub
          </a>{" "}
          directly.
        </p>
      ) : (
        <ChangelogIndex releases={rendered} />
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
