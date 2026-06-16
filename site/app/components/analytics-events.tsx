"use client";

import { useEffect } from "react";

type GtagFunction = (command: "event", eventName: string, params?: Record<string, string>) => void;

declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

const EXTERNAL_TARGETS: Array<{ pattern: RegExp; event: string }> = [
  { pattern: /github\.com\/PetriLahdelma\/project-spine/i, event: "github_click" },
  { pattern: /npmjs\.com\/package\/project-spine/i, event: "npm_click" },
];

export function AnalyticsEvents() {
  useEffect(() => {
    const send = (eventName: string, params: Record<string, string> = {}) => {
      window.gtag?.("event", eventName, {
        ...params,
        page_path: window.location.pathname,
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const tracked = target?.closest<HTMLElement>("[data-ps-event]");
      if (tracked) {
        send(tracked.dataset.psEvent ?? "interaction", {
          event_label: tracked.dataset.psLabel ?? tracked.textContent?.trim().slice(0, 80) ?? "unknown",
        });
        return;
      }

      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.href;
      const external = EXTERNAL_TARGETS.find((targetPattern) => targetPattern.pattern.test(href));
      if (external) {
        send(external.event, {
          event_label: link.textContent?.trim().slice(0, 80) || href,
          link_url: href,
        });
        return;
      }
      if (link.pathname === "/docs") {
        send("docs_click", { event_label: link.textContent?.trim().slice(0, 80) || "/docs" });
      } else if (link.pathname === "/changelog") {
        send("changelog_click", { event_label: link.textContent?.trim().slice(0, 80) || "/changelog" });
      }
    };

    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const element = entry.target;
            if (!(element instanceof HTMLElement)) continue;
            const eventName = element.dataset.psView;
            if (!eventName) continue;
            send(eventName, {
              event_label: element.dataset.psLabel ?? eventName,
            });
            observer?.unobserve(element);
          }
        },
        { threshold: 0.5 },
      );
    }

    document.addEventListener("click", onClick);
    document.querySelectorAll<HTMLElement>("[data-ps-view]").forEach((element) => observer?.observe(element));

    return () => {
      document.removeEventListener("click", onClick);
      observer?.disconnect();
    };
  }, []);

  return null;
}
