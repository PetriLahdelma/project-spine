"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { HeaderLogo } from "./header-logo";

type Item = { label: string; href: string };
type ProductItem = { label: string; href: string; desc: string };

function HamburgerIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * Mobile slide-in nav. The hamburger sits in the header (CSS-hidden on
 * desktop, visible on mobile). The panel is fixed-positioned and slides
 * from the right with a dimmed scrim behind it. Close conditions: tap
 * scrim, tap X, press ESC, or navigate (pathname change).
 */
export function MobileNav({
  productMenu,
  items,
}: {
  productMenu: ProductItem[];
  items: Item[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const hasOpenedRef = useRef(false);
  const panelId = useId();

  const isActive = (href: string) =>
    pathname ? pathname === href || pathname.startsWith(href + "/") : false;

  // Close on navigation (pathname change while open). Skip the first render.
  const firstPathnameRender = useRef(true);
  useEffect(() => {
    if (firstPathnameRender.current) {
      firstPathnameRender.current = false;
      return;
    }
    setOpen(false);
  }, [pathname]);

  // ESC to close + scroll lock + focus management
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      const first = panelRef.current?.querySelector<HTMLElement>("a, button");
      first?.focus();

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKey);

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevOverflow;
      };
    } else if (hasOpenedRef.current) {
      toggleRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="mobile-nav__toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      <div className={`mobile-nav${open ? " mobile-nav--open" : ""}`} aria-hidden={!open}>
        <button
          type="button"
          className="mobile-nav__scrim"
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        />
        <aside
          id={panelId}
          ref={panelRef}
          className="mobile-nav__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className="mobile-nav__header">
            <Link href="/" className="mobile-nav__brand" onClick={() => setOpen(false)}>
              <HeaderLogo />
              <span>Project Spine</span>
            </Link>
            <button
              type="button"
              className="mobile-nav__close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="mobile-nav__nav" aria-label="Mobile primary">
            <p className="mobile-nav__heading">Product</p>
            <ul className="mobile-nav__list">
              {productMenu.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="mobile-nav__link"
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <span className="mobile-nav__label">{item.label}</span>
                    <span className="mobile-nav__desc">{item.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mobile-nav__heading">Pages</p>
            <ul className="mobile-nav__list">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="mobile-nav__link"
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <span className="mobile-nav__label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mobile-nav__footer">
            <a
              href="https://github.com/PetriLahdelma/project-spine"
              className="mobile-nav__github"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
