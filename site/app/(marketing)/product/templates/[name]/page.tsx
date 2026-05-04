import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TerminalMock } from "../../../../components/terminal-mock";

type TemplateCopy = {
  name: string;
  hero: string;
  tagline: string;
  keyword: string;
  lede: string;
  audience: string;
  routes: string[];
  exports: string[];
  fit: string[];
  pairsWith: string[];
};

const TEMPLATES: Record<string, TemplateCopy> = {
  "saas-marketing": {
    name: "saas-marketing",
    hero: "SaaS marketing site",
    tagline: "Launch a conversion-focused marketing site your agents actually understand.",
    keyword: "SaaS marketing site template with AI agent instructions",
    lede:
      "Spine's saas-marketing template compiles a complete operating layer for a classic marketing site — hero, pricing, customer stories, compliance, legal — and emits AGENTS.md, CLAUDE.md, copilot-instructions.md, and a Cursor project rule so every tool in your stack speaks the same language.",
    audience:
      "Agencies shipping marketing sites for B2B SaaS. Frontend leads standing up a new brand presence. Founders with a Figma and a deadline.",
    routes: [
      "/ — Hero, social proof, primary CTA above the fold",
      "/product — Core product overview and features",
      "/pricing — Plans, tiers, FAQ",
      "/customers — Customer stories / case studies",
      "/security — Security posture",
      "/legal/privacy · /legal/terms",
    ],
    exports: [
      "AGENTS.md, CLAUDE.md, copilot-instructions.md, cursor-project-rule.mdc",
      "architecture-summary.md with stack + a11y + performance rules",
      "scaffold-plan.md — folder structure, routing, CMS decisions",
      "qa-guardrails.md — Core Web Vitals targets, a11y gates",
      "sprint-1-backlog.md — day-1 tickets sized for a real team",
    ],
    fit: [
      "B2B SaaS going from nothing to a live site in 2 weeks",
      "Rebrand or redesign of an existing marketing surface",
      "Agency kickoffs where context usually walks out the door with the designer",
    ],
    pairsWith: ["design-system", "docs-portal"],
  },
  "app-dashboard": {
    name: "app-dashboard",
    hero: "Product dashboard (authenticated app)",
    tagline: "Role-aware dashboard context, compiled. No more reinventing the auth shell.",
    keyword: "authenticated SaaS dashboard template with AI agent instructions",
    lede:
      "Spine's app-dashboard template captures the shape of a real authenticated product — login, role-gated surfaces, settings, team, billing — and hands your agents a deterministic map so they stop inventing route structures on every prompt.",
    audience:
      "Product teams shipping the first version of a real SaaS app. Agencies building customer portals. Anyone tired of explaining what an AppShell is to Claude.",
    routes: [
      "/login — Auth entry (SSO + email/password paths)",
      "/app — Default authenticated surface, role-aware",
      "/app/settings — User / workspace settings",
      "/app/team — Members, roles, invites",
      "/app/billing — Subscription + invoices (admin-only)",
    ],
    exports: [
      "AppShell component contract (sidebar + topbar, collapsed/expanded)",
      "Role matrix — member / admin / owner permissions as compiled rules",
      "Route guardrails — which paths are public, auth, or admin-only",
      "QA guardrails covering auth states, empty states, loading states",
      "sprint-1-backlog.md scoped to a real first week",
    ],
    fit: [
      "V1 SaaS builds where auth + billing are on the critical path",
      "Internal tools with real role requirements",
      "Agency projects handing off to an in-house team on day 60",
    ],
    pairsWith: ["design-system", "saas-marketing"],
  },
  "design-system": {
    name: "design-system",
    hero: "Design system repo",
    tagline: "Tokens, primitives, Storybook, docs — compiled into rules every consumer repo inherits.",
    keyword: "design system monorepo template with AI agent instructions",
    lede:
      "Spine's design-system template compiles the contract your downstream apps depend on: token schema, primitive set, theme surfaces, a11y defaults, Storybook expectations. Each rule carries a source pointer back to your tokens or brief so agents can't drift.",
    audience:
      "Design system teams at agencies or in-house. Platform engineers owning the primitives everyone else builds on. Anyone who has watched a button component fork four times in one quarter.",
    routes: [],
    exports: [
      "Token schema — colors, spacing, radius, motion, typography",
      "Primitive contract — Button, Input, Field, Select, Dialog, Toast, Tooltip",
      "Layout primitives — Stack, Inline, Grid, Box with the spacing scale",
      "Theme surfaces — light / dark / high-contrast via tokens",
      "Icon set rules — tree-shakeable, accessible by default",
    ],
    fit: [
      "Teams maintaining tokens across multiple product apps",
      "Rebrands where the token graph needs to stay honest",
      "Agencies handing a design system off to a client team",
    ],
    pairsWith: ["saas-marketing", "app-dashboard", "docs-portal"],
  },
  "docs-portal": {
    name: "docs-portal",
    hero: "Documentation portal",
    tagline: "Technical docs your agents can read, update, and keep honest.",
    keyword: "documentation site template with AI agent instructions",
    lede:
      "Spine's docs-portal template compiles a working contract for a technical docs site — quickstart, guides, reference, changelog, versioning — with drift checks so stale docs fail CI instead of rotting in the open.",
    audience:
      "Open-source maintainers. DevRel teams. Anyone whose docs are one release behind and whose agents keep hallucinating the old API.",
    routes: [
      "/ — Landing with quickstart CTA and top guides",
      "/quickstart — 5-minute setup",
      "/guides — Task-oriented topic index",
      "/reference — Generated API reference",
      "/changelog — Release notes, newest first",
    ],
    exports: [
      "Sidebar nav contract with active-state + collapsible sections",
      "Search contract — what's indexed, how stale content is flagged",
      "Versioning rules for API reference",
      "Guide style guardrails — heading depth, code samples, callouts",
      "Drift rules that fail CI when reference pages and code diverge",
    ],
    fit: [
      "Dev tools launching v1 docs",
      "Teams whose docs keep drifting behind the API",
      "Projects with multiple versions live at once",
    ],
    pairsWith: ["design-system"],
  },
  "api-service": {
    name: "api-service",
    hero: "API service (Node / TypeScript backend)",
    tagline: "Health checks, typed contracts, error envelopes, and operational guardrails from day one.",
    keyword: "Node TypeScript API service template with AI agent instructions",
    lede:
      "Spine's api-service template compiles the operating layer for a production-minded HTTP API: request/response contracts, health and readiness probes, structured logging, rate-limit posture, and a single error-envelope convention agents can follow consistently.",
    audience:
      "Backend teams and full-stack builders starting a Node API that needs real operational shape before framework details take over. Works as a planning layer for Fastify, Express, Hono, or plain node:http.",
    routes: [
      "/health - Liveness probe for process-level uptime",
      "/ready - Readiness probe for dependencies and deploy gates",
      "/v1/* - Versioned API surface with typed request/response contracts",
    ],
    exports: [
      "ErrorEnvelope contract for consistent client-facing errors",
      "RequestContext guidance for auth, tracing, and correlation IDs",
      "RateLimiter rules with explicit bypass and failure behavior",
      "QA guardrails covering status codes, schema validation, and logging",
      "sprint-1-backlog.md focused on the first operationally safe API slice",
    ],
    fit: [
      "Teams starting a service before choosing every framework detail",
      "Existing APIs that need consistent agent instructions and QA gates",
      "Client projects where health/readiness and error behavior are part of the handoff",
    ],
    pairsWith: ["monorepo", "docs-portal"],
  },
  "monorepo": {
    name: "monorepo",
    hero: "Monorepo (pnpm / Turborepo / Nx)",
    tagline: "Workspace-aware context for packages, apps, build graphs, and affected-only checks.",
    keyword: "monorepo template with AI agent instructions for pnpm Turborepo Nx",
    lede:
      "Spine's monorepo template captures the project-level contract that agents usually miss at the repo root: package boundaries, app ownership, build graph rules, affected-only CI, release constraints, and when to compile against a specific workspace instead of the root.",
    audience:
      "Teams consolidating apps and packages under one repo, platform teams standardising shared packages, and agencies with repeatable client stacks split across apps and packages.",
    routes: [],
    exports: [
      "Workspace layout contract for apps/* and packages/*",
      "BuildGraph guidance for cached, affected-only checks",
      "ChangeGate rules for package boundaries and dependency direction",
      "QA guardrails covering root vs workspace test/typecheck commands",
      "Agent instructions warning when framework detection at the root is low-confidence",
    ],
    fit: [
      "pnpm workspace, Turborepo, or Nx repos with multiple deployable apps",
      "Shared UI/domain packages consumed by several frontends",
      "Teams that need agents to respect package boundaries instead of editing everywhere",
    ],
    pairsWith: ["api-service", "app-dashboard", "design-system"],
  },
};

const SITE = "https://projectspine.dev";

export function generateStaticParams() {
  return Object.keys(TEMPLATES).map((name) => ({ name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const t = TEMPLATES[name];
  if (!t) return {};
  const title = `${t.hero} template · Project Spine`;
  const description = `${t.tagline} Compiled by Project Spine into AGENTS.md, CLAUDE.md, copilot-instructions, Cursor rules, scaffold plan, QA guardrails, and a sprint-1 backlog.`;
  const url = `${SITE}/product/templates/${t.name}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Project Spine",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Project Spine" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    keywords: [
      t.keyword,
      `${t.name} template`,
      "AGENTS.md template",
      "CLAUDE.md template",
      "AI agent instructions",
      "Project Spine template",
    ],
  };
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const t = TEMPLATES[name];
  if (!t) return notFound();
  const url = `${SITE}/product/templates/${t.name}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: `${t.hero} template (${t.name})`,
    description: t.tagline,
    url,
    codeRepository: "https://github.com/PetriLahdelma/project-spine",
    programmingLanguage: "TypeScript",
    author: { "@type": "Organization", name: "Project Spine" },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="page-header">
        <p className="eyebrow">Template · {t.name}</p>
        <h1>{t.hero}</h1>
        <p className="lede">{t.tagline}</p>
      </header>

      <p>{t.lede}</p>

      <h2>Who this template is for</h2>
      <p>{t.audience}</p>

      <h2>Get started</h2>
      <TerminalMock title={`~ — spine init --template ${t.name}`}>
        <span className="tok-prompt">$ </span>
        <span className="tok-command">npm install -g project-spine@next</span>
        {"\n"}
        <span className="tok-prompt">$ </span>
        <span className="tok-command">{"spine init --template "}{t.name}</span>
        {"\n"}
        <span className="tok-prompt">$ </span>
        <span className="tok-command">{"spine compile --brief ./brief.md --repo . --template "}{t.name}</span>
        {"\n"}
        <span className="tok-success">✓</span> wrote <span className="tok-accent">spine.json</span>
        {"\n"}
        <span className="tok-success">✓</span> wrote <span className="tok-accent">AGENTS.md</span>, <span className="tok-accent">CLAUDE.md</span>, <span className="tok-accent">copilot-instructions.md</span>, <span className="tok-accent">project-spine.mdc</span>
        {"\n"}
        <span className="tok-success">✓</span> wrote scaffold-plan, qa-guardrails, sprint-1-backlog
      </TerminalMock>

      {t.routes.length > 0 ? (
        <>
          <h2>Routes this template plans for</h2>
          <ul className="features">
            {t.routes.map((r) => (
              <li key={r}>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>What spine compile emits</h2>
      <ul className="features">
        {t.exports.map((e) => (
          <li key={e}>
            <span>{e}</span>
          </li>
        ))}
      </ul>

      <h2>Good fit if</h2>
      <ul className="features">
        {t.fit.map((f) => (
          <li key={f}>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <h2>Pairs well with</h2>
      <ul className="features">
        {t.pairsWith.map((p) => (
          <li key={p}>
            <strong>
              <Link href={`/product/templates/${p}`}>{p}</Link>
            </strong>
            <span>{TEMPLATES[p]?.tagline}</span>
          </li>
        ))}
      </ul>

      <div className="cta-row">
        <Link href="/docs">Read the docs</Link>
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <Link href="/pricing">See pricing</Link>
      </div>
    </main>
  );
}
