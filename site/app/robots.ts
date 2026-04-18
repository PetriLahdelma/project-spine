import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE = "https://projectspine.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/logout",
          "/device",
          "/invite/",
          "/w/",
          "/workspaces/",
          "/r/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
