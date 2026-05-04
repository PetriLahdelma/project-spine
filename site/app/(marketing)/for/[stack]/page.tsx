import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TerminalMock } from "../../../components/terminal-mock";

type StackCopy = {
  slug: string;
  label: string;
  runtime: string;
  tagline: string;
  lede: string;
  detects: string[];
  templates: Array<{ name: string; blurb: string }>;
  guardrails: string[];
};

const STACKS: Record<string, StackCopy> = {
  nextjs: {
    slug: "nextjs",
    label: "Next.js",
    runtime: "Next.js 14/15/16 (App Router)",
    tagline: "Agent instructions that know the App Router, Server Components, and Turbopack.",
    lede:
      "Project Spine inspects your Next.js repo and compiles AGENTS.md, CLAUDE.md, copilot-instructions.md, and a Cursor project rule that actually track the App Router conventions in your tree — not the Pages Router your agent half-remembers from 2023.",
    detects: [
      "App Router vs Pages Router",
      "Server / client component boundaries",
      "Route groups, parallel routes, intercepted routes",
      "Middleware + CSP usage",
      "Drizzle / Prisma / Vercel Postgres data layer",
    ],
    templates: [
      { name: "saas-marketing", blurb: "Marketing site scaffold with hero, pricing, legal." },
      { name: "app-dashboard", blurb: "Authenticated dashboard with role-aware routes." },
    ],
    guardrails: [
      "Core Web Vitals gates with real Next metrics",
      "CSP + nonce expectations surfaced as rules",
      "Image + font optimization defaults",
      "Route-level a11y guardrails",
    ],
  },
  vite: {
    slug: "vite",
    label: "Vite",
    runtime: "Vite 5/6 (React, Vue, Svelte)",
    tagline: "One compile step for any Vite-powered SPA. Agents stop guessing the bundler.",
    lede:
      "Project Spine inspects Vite repos regardless of framework — React, Vue, or Svelte — and emits deterministic agent instructions tied to your real config, not a generic Vite template from a tutorial.",
    detects: [
      "Framework plugin in vite.config",
      "TypeScript vs JavaScript",
      "Routing (react-router, vue-router, svelte-kit-style)",
      "Test runner (vitest, playwright)",
    ],
    templates: [
      { name: "app-dashboard", blurb: "SPA with auth + role-aware routing." },
      { name: "design-system", blurb: "Primitive library shipped from a Vite lib build." },
    ],
    guardrails: [
      "Bundle-size budgets surfaced as rules",
      "HMR + dev-server expectations documented",
      "Test coverage floor",
      "Dep graph and unused-export checks",
    ],
  },
  remix: {
    slug: "remix",
    label: "Remix",
    runtime: "Remix / React Router 7",
    tagline: "Loaders, actions, and nested routes — rendered into rules an agent can follow.",
    lede:
      "Project Spine reads your Remix route tree and server/client split, then compiles agent instructions that respect loaders, actions, and the data boundary.",
    detects: [
      "Route tree including nested and pathless routes",
      "Loaders and actions per route",
      "Server utilities (cookies, sessions)",
      "Deployment adapter (Node, Vercel, Cloudflare)",
    ],
    templates: [
      { name: "app-dashboard", blurb: "Authenticated app with nested dashboards." },
      { name: "saas-marketing", blurb: "Remix-flavored marketing site." },
    ],
    guardrails: [
      "Server-vs-client contract on every shared module",
      "Session + cookie rules surfaced",
      "Form action patterns as agent rules",
      "Error boundary coverage",
    ],
  },
  sveltekit: {
    slug: "sveltekit",
    label: "SvelteKit",
    runtime: "SvelteKit 2",
    tagline: "Route groups, load functions, actions — compiled into agent context.",
    lede:
      "Spine detects SvelteKit adapters, load functions, and form actions and emits a deterministic set of agent rules that mirror the structure of your app — not a boilerplate example.",
    detects: [
      "Adapter (auto, vercel, cloudflare, node)",
      "Route groups and layouts",
      "Load functions and form actions",
      "Runes vs pre-runes syntax",
    ],
    templates: [
      { name: "app-dashboard", blurb: "Authenticated SvelteKit dashboard." },
      { name: "docs-portal", blurb: "Docs site in SvelteKit with search + versioning." },
    ],
    guardrails: [
      "Adapter-specific deployment rules",
      "Runes migration signals surfaced as warnings",
      "Form action patterns codified",
      "Server hook contracts documented",
    ],
  },
  astro: {
    slug: "astro",
    label: "Astro",
    runtime: "Astro 5",
    tagline: "Islands architecture, content collections, adapters — captured as agent rules.",
    lede:
      "Spine reads Astro content collections, islands, and adapter configuration and emits rules agents follow when editing marketing + docs sites at scale.",
    detects: [
      "Content collections and their schemas",
      "Framework islands (React, Vue, Svelte, Solid)",
      "Integrations pipeline",
      "Output mode (static, hybrid, server)",
    ],
    templates: [
      { name: "docs-portal", blurb: "Docs site with content collections + versioning." },
      { name: "saas-marketing", blurb: "Content-driven marketing site." },
    ],
    guardrails: [
      "Content schema rules enforced",
      "Island hydration decisions documented",
      "Core Web Vitals gates per route",
      "Search + sitemap contract",
    ],
  },
  expo: {
    slug: "expo",
    label: "Expo",
    runtime: "Expo 52+ (React Native)",
    tagline: "Expo Router, EAS, native modules — translated into agent-friendly rules.",
    lede:
      "Spine inspects your Expo project, detects Expo Router vs React Navigation, EAS config, and native module usage, and emits agent instructions that respect the mobile runtime.",
    detects: [
      "Expo Router vs React Navigation",
      "EAS build + submit config",
      "Native modules and prebuild state",
      "Reanimated / Gesture Handler usage",
    ],
    templates: [
      { name: "app-dashboard", blurb: "Authenticated mobile dashboard shell." },
    ],
    guardrails: [
      "Platform-split rules (iOS / Android)",
      "Accessibility rules for RN primitives",
      "EAS channel + OTA update contract",
      "Native module ownership",
    ],
  },
  "react-native": {
    slug: "react-native",
    label: "React Native (bare)",
    runtime: "React Native 0.74+ (bare workflow)",
    tagline: "Bare RN with its own native projects gets the same deterministic compile.",
    lede:
      "Spine handles bare React Native projects — including the native iOS and Android folders — and emits agent rules that respect platform-specific constraints.",
    detects: [
      "Native projects (Pods, Gradle)",
      "Navigation stack",
      "State libraries (Redux, Zustand, Jotai)",
      "Hermes vs JSC",
    ],
    templates: [
      { name: "app-dashboard", blurb: "Mobile dashboard with role-aware surfaces." },
    ],
    guardrails: [
      "Platform rules and gotchas",
      "Pods / Gradle update expectations",
      "Testing strategy (Detox, Maestro)",
      "Release channel contract",
    ],
  },
  nuxt: {
    slug: "nuxt",
    label: "Nuxt",
    runtime: "Nuxt 3/4",
    tagline: "Nitro, auto-imports, modules — compiled into rules your agents won't misread.",
    lede:
      "Spine reads Nuxt project structure, Nitro server routes, modules, and auto-imports, and emits deterministic agent rules tied to real files.",
    detects: [
      "Nitro server routes + plugins",
      "Module set and their contracts",
      "Auto-import boundary",
      "Render mode (SSR, SPA, hybrid)",
    ],
    templates: [
      { name: "saas-marketing", blurb: "Content-driven marketing site in Nuxt." },
      { name: "app-dashboard", blurb: "Authenticated Nuxt app with server routes." },
    ],
    guardrails: [
      "Server vs client boundaries documented",
      "Module usage surfaced as rules",
      "Render mode constraints codified",
      "Deployment target contract",
    ],
  },
};

const SITE = "https://projectspine.dev";

export function generateStaticParams() {
  return Object.keys(STACKS).map((stack) => ({ stack }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stack: string }>;
}): Promise<Metadata> {
  const { stack } = await params;
  const s = STACKS[stack];
  if (!s) return {};
  const title = `Project Spine for ${s.label} · AGENTS.md, CLAUDE.md, Copilot, Cursor`;
  const description = `${s.tagline} Context compiler that inspects ${s.runtime} and emits deterministic agent instructions, scaffold plans, and drift checks.`;
  const url = `${SITE}/for/${s.slug}`;
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
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    keywords: [
      `${s.label} AGENTS.md`,
      `${s.label} CLAUDE.md`,
      `${s.label} AI coding agent instructions`,
      `Project Spine ${s.label}`,
      `${s.label} context for agents`,
    ],
  };
}

export default async function StackPage({
  params,
}: {
  params: Promise<{ stack: string }>;
}) {
  const { stack } = await params;
  const s = STACKS[stack];
  if (!s) return notFound();
  const url = `${SITE}/for/${s.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `Project Spine for ${s.label}`,
    description: s.tagline,
    url,
    about: s.runtime,
    author: { "@type": "Organization", name: "Project Spine" },
    publisher: { "@type": "Organization", name: "Project Spine" },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="page-header">
        <p className="eyebrow">For {s.label}</p>
        <h1>Project Spine for {s.label}</h1>
        <p className="lede">{s.tagline}</p>
      </header>

      <p>{s.lede}</p>

      <h2>What Spine detects in a {s.label} repo</h2>
      <ul className="features">
        {s.detects.map((d) => (
          <li key={d}>
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <h2>Get started</h2>
      <TerminalMock title={`~ — spine inspect --repo .`}>
        <span className="tok-prompt">$ </span>
        <span className="tok-command">npm install -g project-spine@beta</span>
        {"\n"}
        <span className="tok-prompt">$ </span>
        <span className="tok-command">spine inspect --repo .</span>
        {"\n"}
        <span className="tok-success">✓</span> detected <span className="tok-accent">{s.runtime}</span>
        {"\n"}
        <span className="tok-prompt">$ </span>
        <span className="tok-command">spine compile --brief ./brief.md --repo .</span>
        {"\n"}
        <span className="tok-success">✓</span> wrote <span className="tok-accent">AGENTS.md</span>, <span className="tok-accent">CLAUDE.md</span>, <span className="tok-accent">copilot-instructions.md</span>, <span className="tok-accent">project-spine.mdc</span>
      </TerminalMock>

      <h2>Templates that fit {s.label}</h2>
      <ul className="features">
        {s.templates.map((t) => (
          <li key={t.name}>
            <strong>
              <Link href={`/product/templates/${t.name}`}>{t.name}</Link>
            </strong>
            <span>{t.blurb}</span>
          </li>
        ))}
      </ul>

      <h2>Guardrails Spine compiles for {s.label}</h2>
      <ul className="features">
        {s.guardrails.map((g) => (
          <li key={g}>
            <span>{g}</span>
          </li>
        ))}
      </ul>

      <div className="cta-row">
        <Link href="/docs">Read the docs</Link>
        <a href="https://github.com/PetriLahdelma/project-spine">GitHub →</a>
        <Link href="/product">Product tour</Link>
      </div>
    </main>
  );
}
