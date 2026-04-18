import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { getWebSessionUser } from "@/lib/web-auth";
import { HeaderLogo } from "./header-logo";
import { SiteNav } from "./site-nav";

const NAV: Array<{ label: string; href: string }> = [
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
];

const PRODUCT_MENU: Array<{ label: string; href: string; desc: string }> = [
  { label: "Overview", href: "/product", desc: "The compile pipeline and every capability." },
  { label: "Drift detection", href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/drift.md", desc: "sha256-backed manifest, CI-friendly exit codes." },
  { label: "Design tokens", href: "https://github.com/PetriLahdelma/project-spine/blob/main/docs/tokens.md", desc: "DTCG and Tokens Studio JSON, alias resolution." },
  { label: "Agent skills", href: "https://github.com/PetriLahdelma/project-spine/tree/main/skills", desc: "Six SKILL.md files for Claude Code, Codex, Cursor." },
  { label: "Rationales", href: "/product#rationale", desc: "Branded, shareable, revocable client URLs." },
  { label: "Security", href: "/security", desc: "CSP nonces, rate limits, hashed tokens, no tracking." },
];

function GitHubIcon() {
  return (
    <svg role="img" aria-hidden="true" focusable="false" width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

async function firstWorkspaceSlug(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(workspaces.createdAt))
    .limit(1);
  return row?.slug ?? null;
}

export async function SiteHeader() {
  const user = await getWebSessionUser();
  const wsSlug = user ? await firstWorkspaceSlug(user.id) : null;
  const dashboardHref = wsSlug ? `/w/${wsSlug}` : "/workspaces/new";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="Project Spine home">
          <HeaderLogo />
          Project Spine
        </Link>
        <SiteNav productMenu={PRODUCT_MENU} items={NAV} />
        <div className="site-header__actions">
          <a
            href="https://github.com/PetriLahdelma/project-spine"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
          </a>
          {user ? (
            <>
              <Link href={dashboardHref} className="site-header__cta">
                {wsSlug ? "Dashboard" : "Create workspace"}
              </Link>
              <Link href="/logout" className="site-header__signout" aria-label="Log out">
                {user.githubLogin}
              </Link>
            </>
          ) : (
            <Link href="/login" className="site-header__cta">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
