import { apiCatalog, jsonResponse } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(
    apiCatalog(),
    'application/linkset+json; charset=utf-8; profile="https://www.rfc-editor.org/info/rfc9727"',
  );
}
