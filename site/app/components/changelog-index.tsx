"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { channelLabels, decodeReleaseHash, filterReleases, formatReleaseDate, getActiveReleaseId, getReleaseChannel, getReleaseHref, getReleaseId, releaseChannels, type ChangelogRelease, type ReleaseFilter } from "../../lib/changelog";

export function ChangelogIndex({ releases }: { releases: ChangelogRelease[] }) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<ReleaseFilter>("all");
  const [activeId, setActiveId] = useState(releases[0] ? getReleaseId(releases[0].tag_name) : "");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const visible = useMemo(() => filterReleases(releases, query, channel), [releases, query, channel]);
  const channels = useMemo(() => releaseChannels.filter((value) => releases.some((release) => getReleaseChannel(release) === value)), [releases]);
  const hasFilters = query.length > 0 || channel !== "all";
  const selectedId = visible.some((release) => getReleaseId(release.tag_name) === activeId)
    ? activeId : visible[0] ? getReleaseId(visible[0].tag_name) : "";

  useEffect(() => {
    if (pendingId) {
      const target = document.getElementById(pendingId);
      if (target) {
        target.scrollIntoView({ block: "start" });
        target.focus({ preventScroll: true });
        setPendingId(null);
      }
    }
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const sections = visible.flatMap((release) => {
        const id = getReleaseId(release.tag_name);
        const element = document.getElementById(id);
        return element ? [{ id, top: element.getBoundingClientRect().top }] : [];
      });
      setActiveId(getActiveReleaseId(sections, 112));
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    };
    updateActive();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [visible, pendingId]);

  useEffect(() => {
    const followHash = () => {
      const id = decodeReleaseHash(window.location.hash);
      if (!id || !releases.some((release) => getReleaseId(release.tag_name) === id)) return;
      if (!visible.some((release) => getReleaseId(release.tag_name) === id)) {
        setQuery("");
        setChannel("all");
        setPendingId(id);
      }
      setActiveId(id);
    };
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [releases, visible]);

  useEffect(() => {
    const navigation = navigationRef.current;
    const link = navigation?.querySelector('[aria-current="location"]');
    if (!navigation || !link) return;
    const bounds = navigation.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top < bounds.top) navigation.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom) navigation.scrollTop += item.bottom - bounds.bottom;
  }, [selectedId]);

  function returnToIndex() {
    const container = containerRef.current;
    if (container && container.getBoundingClientRect().top < 88) {
      container.scrollIntoView({ block: "start" });
    }
  }

  function resetFilters() {
    setQuery("");
    setChannel("all");
    returnToIndex();
    document.getElementById("changelog-search")?.focus({ preventScroll: true });
  }

  return (
    <div className="changelog__browser" ref={containerRef}>
      <aside className="changelog__index" aria-label="Release navigation">
        <h2 className="changelog__index-title" id="changelog-index" tabIndex={-1}>Release index</h2>
        <label className="changelog__search-label" htmlFor="changelog-search">Search releases</label>
        <input
          id="changelog-search"
          className="changelog__search"
          type="search"
          placeholder="Version or keyword"
          value={query}
          onChange={(event) => { setQuery(event.target.value); returnToIndex(); }}
        />
        <fieldset className="changelog__channels">
          <legend>Channel</legend>
          {(["all", ...channels] as ReleaseFilter[]).map((value) => (
            <label key={value}>
              <input type="radio" name="release-channel" value={value} checked={channel === value}
                onChange={() => { setChannel(value); returnToIndex(); }} />
              <span>{channelLabels[value]}</span>
            </label>
          ))}
        </fieldset>
        <div className="changelog__result-summary">
          <p role="status" aria-live="polite" aria-atomic="true">
            {hasFilters ? `${visible.length} of ${releases.length}` : releases.length} releases
          </p>
          {hasFilters ? <button type="button" onClick={resetFilters}>Reset</button> : null}
        </div>
        <div className="changelog__mobile-picker">
          <label htmlFor="changelog-jump">Jump to release</label>
          <select id="changelog-jump" value="" disabled={visible.length === 0}
            onChange={(event) => {
              const id = event.target.value;
              window.location.hash = encodeURIComponent(id);
              document.getElementById(id)?.scrollIntoView({ block: "start" });
              document.getElementById(id)?.focus({ preventScroll: true });
              setActiveId(id);
            }}>
            <option value="" disabled>{visible.length === 0 ? "No matching releases" : "Select a version"}</option>
            {visible.map((release) => <option key={release.tag_name} value={getReleaseId(release.tag_name)}>{release.tag_name}</option>)}
          </select>
        </div>
        <nav className="changelog__index-links" aria-label="Release index" ref={navigationRef}>
          <ol>
            {visible.map((release) => (
              <li key={release.tag_name}>
                <a href={getReleaseHref(release.tag_name)} aria-current={selectedId === getReleaseId(release.tag_name) ? "location" : undefined}>
                  <span>{release.tag_name}</span>
                  <time dateTime={release.published_at ?? undefined}>{formatReleaseDate(release.published_at)}</time>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="changelog__results">
        {visible.length === 0 ? (
          <div className="changelog__no-results">
            <h2>No matching releases</h2>
            <p>{query.trim() ? `No release matches "${query.trim()}"${channel !== "all" ? ` in ${channelLabels[channel].toLowerCase()}` : ""}.` : `No ${channelLabels[channel].toLowerCase()} releases found.`}</p>
            <button type="button" onClick={resetFilters}>Reset filters</button>
          </div>
        ) : (
          <ol className="changelog__list" aria-label="Release notes">
            {visible.map((release) => (
              <li key={release.tag_name} className="changelog__item" id={getReleaseId(release.tag_name)} tabIndex={-1}>
                <div className="changelog__meta">
                  <h2 className="changelog__title"><a href={release.html_url}>{release.name || release.tag_name}</a></h2>
                  <span className="changelog__date">
                    <time dateTime={release.published_at ?? undefined}>{formatReleaseDate(release.published_at)}</time>
                    {" · "}{channelLabels[getReleaseChannel(release)]}
                  </span>
                  <a className="changelog__return" href="#changelog-index">Release index</a>
                </div>
                {release.bodyHtml ? <div className="changelog__body" dangerouslySetInnerHTML={{ __html: release.bodyHtml }} /> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
