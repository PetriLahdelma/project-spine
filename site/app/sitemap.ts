import type { MetadataRoute } from "next";

const SITE = "https://projectspine.dev";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/product", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/changelog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/security", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

const TEMPLATES = ["saas-marketing", "app-dashboard", "design-system", "docs-portal"];

const STACKS = [
  "nextjs",
  "vite",
  "remix",
  "sveltekit",
  "astro",
  "expo",
  "react-native",
  "nuxt",
];

export const dynamic = "force-static";
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const templateEntries: MetadataRoute.Sitemap = TEMPLATES.map((name) => ({
    url: `${SITE}/product/templates/${name}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const stackEntries: MetadataRoute.Sitemap = STACKS.map((stack) => ({
    url: `${SITE}/for/${stack}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...templateEntries, ...stackEntries];
}
