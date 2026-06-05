import { jsonResponse, mcpServerCard } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(mcpServerCard());
}
