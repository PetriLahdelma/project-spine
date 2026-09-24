export type ReleaseChannel = "beta" | "alpha" | "stable" | "pre-release";
export type ReleaseFilter = "all" | ReleaseChannel;

export type ChangelogRelease = {
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
  bodyHtml: string;
  searchText: string;
};

export const releaseChannels: readonly ReleaseChannel[] = ["beta", "alpha", "stable", "pre-release"];

export const channelLabels: Record<ReleaseFilter, string> = {
  all: "All",
  beta: "Beta",
  alpha: "Alpha",
  stable: "Stable",
  "pre-release": "Pre-release",
};

export function getReleaseChannel(release: Pick<ChangelogRelease, "tag_name" | "prerelease">): ReleaseChannel {
  // Some historical alpha tags were not marked as prereleases on GitHub.
  if (/-beta(?:[.-]|$)/i.test(release.tag_name)) return "beta";
  if (/-alpha(?:[.-]|$)/i.test(release.tag_name)) return "alpha";
  return release.prerelease ? "pre-release" : "stable";
}

export function getReleaseId(tag: string): string {
  return `release-${tag}`;
}

export function getReleaseHref(tag: string): string {
  return `#${encodeURIComponent(getReleaseId(tag))}`;
}

export function decodeReleaseHash(hash: string): string | null {
  try {
    return decodeURIComponent(hash.replace(/^#/, "")) || null;
  } catch {
    return null;
  }
}

export function formatReleaseDate(value: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function filterReleases(releases: readonly ChangelogRelease[], query: string, channel: ReleaseFilter): ChangelogRelease[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return releases.filter((release) => {
    if (channel !== "all" && getReleaseChannel(release) !== channel) return false;
    const text = `${release.tag_name} ${release.name ?? ""} ${release.searchText}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

export function getActiveReleaseId(sections: readonly { id: string; top: number }[], offset: number): string {
  let active = sections[0]?.id ?? "";
  for (const section of sections) {
    // Native fragment scrolling can round the target position by a subpixel.
    if (section.top > offset + 1) break;
    active = section.id;
  }
  return active;
}
