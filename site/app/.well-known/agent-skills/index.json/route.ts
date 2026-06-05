import { agentSkillsIndex, jsonResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return jsonResponse(await agentSkillsIndex());
}
