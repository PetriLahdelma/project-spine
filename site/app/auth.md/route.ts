import { AUTH_MD, markdownResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return markdownResponse(AUTH_MD);
}
