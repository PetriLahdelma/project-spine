import { LLMS_TXT, markdownResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return markdownResponse(LLMS_TXT);
}
