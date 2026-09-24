import { describe, expect, it } from "vitest";
import { decodeReleaseHash, filterReleases, formatReleaseDate, getActiveReleaseId, getReleaseChannel, getReleaseHref, getReleaseId, type ChangelogRelease } from "./changelog";

const releases: ChangelogRelease[] = [
  { tag_name: "v0.10.0-beta.0", name: "Repository learning", html_url: "https://example.com/beta", published_at: "2026-09-23T17:18:50Z", prerelease: true, bodyHtml: "<p>Git replay</p>", searchText: "Git replay and verified guardrails" },
  { tag_name: "v0.9.0-alpha.0", name: "Design tokens", html_url: "https://example.com/alpha", published_at: "2026-04-18T10:26:32Z", prerelease: false, bodyHtml: "", searchText: "Figma and DTCG tokens" },
  { tag_name: "v1.0.0", name: null, html_url: "https://example.com/stable", published_at: null, prerelease: false, bodyHtml: "", searchText: "Stable compiler" },
];

describe("changelog search", () => {
  it("matches versions, names and body terms without changing release order", () => {
    expect(filterReleases(releases, "", "all")).toEqual(releases);
    expect(filterReleases(releases, "  GIT   replay ", "all")).toEqual([releases[0]]);
    expect(filterReleases(releases, "0.9.0 FIGMA", "alpha")).toEqual([releases[1]]);
    expect(filterReleases(releases, "repository", "beta")).toEqual([releases[0]]);
  });

  it("combines channel and search, and treats punctuation literally", () => {
    expect(filterReleases(releases, "tokens", "beta")).toEqual([]);
    expect(filterReleases(releases, "[.*]", "all")).toEqual([]);
    expect(filterReleases(releases, "compiler", "stable")).toEqual([releases[2]]);
    expect(filterReleases([], "", "all")).toEqual([]);
  });

  it("recognizes alpha tags even when the historical GitHub flag is false", () => {
    expect(getReleaseChannel(releases[1]!)).toBe("alpha");
    expect(getReleaseChannel({ tag_name: "v1.0.0-rc.1", prerelease: true })).toBe("pre-release");
    expect(getReleaseChannel(releases[2]!)).toBe("stable");
  });
});

describe("release navigation", () => {
  it("round-trips version fragments without slug collisions", () => {
    for (const tag of ["v0.10.0-beta.0", "release/1.0", "release-1.0", "version#1", "version%2F"]) {
      expect(decodeReleaseHash(getReleaseHref(tag))).toBe(getReleaseId(tag));
    }
    expect(getReleaseId("release/1.0")).not.toBe(getReleaseId("release-1.0"));
    expect(decodeReleaseHash("#%E0%A4%A")).toBeNull();
    expect(decodeReleaseHash("")).toBeNull();
  });

  it("keeps the current section active through a long release and selects the next at the reading line", () => {
    expect(getActiveReleaseId([{ id: "first", top: -1400 }, { id: "next", top: 300 }], 112)).toBe("first");
    expect(getActiveReleaseId([{ id: "first", top: -1600 }, { id: "next", top: 112 }], 112)).toBe("next");
    expect(getActiveReleaseId([{ id: "first", top: 500 }], 112)).toBe("first");
    expect(getActiveReleaseId([], 112)).toBe("");
  });

  it("formats dates consistently across server and client time zones", () => {
    expect(formatReleaseDate("2026-09-23T23:55:00-07:00")).toBe("Sep 24, 2026");
    expect(formatReleaseDate(null)).toBe("Date unavailable");
    expect(formatReleaseDate("not a date")).toBe("Date unavailable");
  });

  it("keeps fragment targets active after subpixel scroll rounding", () => {
    expect(getActiveReleaseId([{ id: "first", top: -1000 }, { id: "next", top: 112.18 }], 112)).toBe("next");
    expect(getActiveReleaseId([{ id: "first", top: -1000 }, { id: "next", top: 113.5 }], 112)).toBe("first");
  });
});
