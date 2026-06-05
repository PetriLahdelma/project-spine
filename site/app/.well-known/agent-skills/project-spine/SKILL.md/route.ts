import { PROJECT_SPINE_SKILL, markdownResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return markdownResponse(PROJECT_SPINE_SKILL);
}
