"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string; desc: string };

/**
 * Client component that highlights the active nav link. usePathname() is
 * the one value that stays fresh across client-side navigation within the
 * same layout segment — the server layout's headers() freezes on first
 * render, which is why the active state looked stale until reload.
 */
export function SiteNav({
  productMenu,
  items,
}: {
  productMenu: Item[];
  items: Array<{ label: string; href: string }>;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (pathname ? pathname === href || pathname.startsWith(href + "/") : false);
  const productActive = isActive("/product");

  return (
    <nav className="site-header__nav" aria-label="Primary">
      <div className="nav-group">
        <Link
          href="/product"
          className="nav-group__trigger"
          aria-haspopup="menu"
          aria-current={productActive ? "page" : undefined}
        >
          Product
          <svg
            className="nav-group__chevron"
            width={10}
            height={10}
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 3.5l3 3 3-3" />
          </svg>
        </Link>
        <div className="nav-group__panel" role="menu">
          {productMenu.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" className="nav-group__item">
              <span className="nav-group__item-label">{item.label}</span>
              <span className="nav-group__item-desc">{item.desc}</span>
            </Link>
          ))}
        </div>
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
