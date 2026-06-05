import { jsonResponse, publicAnalyticsMetadataSchema } from "@/lib/agent-discovery";

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(publicAnalyticsMetadataSchema(), "application/schema+json; charset=utf-8");
}
