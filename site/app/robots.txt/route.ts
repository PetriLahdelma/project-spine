import { CONTENT_SIGNAL, SITE, textResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

const ROBOTS = `# As a condition of accessing this website, you agree to abide by the following content signals:
# If a content-signal = yes, you may collect content for the corresponding use.
# If a content-signal = no, you may not collect content for the corresponding use.
# The content signals are search, ai-input, and ai-train.

User-Agent: *
Content-Signal: ${CONTENT_SIGNAL}
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /logout
Disallow: /device
Disallow: /invite/
Disallow: /w/
Disallow: /workspaces/
Disallow: /r/

Host: ${SITE}
Sitemap: ${SITE}/sitemap.xml
`;

export function GET(): Response {
  return textResponse(ROBOTS);
}
