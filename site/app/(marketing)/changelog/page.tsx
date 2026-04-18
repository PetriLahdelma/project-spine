import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Project Spine",
  description: "Every release, pulled from GitHub. Nothing hidden.",
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

function trimBody(body: string | null): string {
  if (!body) return "";
  const lines = body.split("\n");
  const limited = lines.slice(0, 30).join("\n");
  return limited.length > 1400 ? limited.slice(0, 1400) + "…" : limited;
}

export default async function ChangelogPage() {
  const releases = await fetchReleases();
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

      {releases.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>
          Could not load releases right now. See the{" "}
          <a href="https://github.com/PetriLahdelma/project-spine/releases">
            releases page on GitHub
          </a>{" "}
          directly.
        </p>
      ) : (
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {releases.map((r) => (
            <li
              key={r.tag_name}
              style={{
                borderTop: "1px solid var(--line)",
                padding: "24px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                  <a href={r.html_url} style={{ color: "var(--ink)" }}>
                    {r.name || r.tag_name}
                  </a>
                </h3>
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  {r.published_at
                    ? new Date(r.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                  {r.prerelease ? " · pre-release" : ""}
                </span>
              </div>
              {r.body ? (
                <pre
                  style={{
                    background: "transparent",
                    color: "var(--ink-soft)",
                    padding: 0,
                    border: 0,
                    fontFamily: "inherit",
                    fontSize: 14,
                    whiteSpace: "pre-wrap",
                    marginTop: 12,
                  }}
                >
                  {trimBody(r.body)}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <p style={{ marginTop: 48, fontSize: 13, color: "var(--ink-muted)" }}>
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
