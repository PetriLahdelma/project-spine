import { HOME_MARKDOWN, markdownResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return markdownResponse(HOME_MARKDOWN);
}
