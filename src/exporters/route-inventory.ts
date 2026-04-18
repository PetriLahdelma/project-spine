import type { SpineModel } from "../model/spine.js";
import { renderHeader, section, renderBlock } from "./shared.js";

export function renderRouteInventory(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, "Route inventory", "Proposed routes for the project, derived from project type and brief goals."));
  if (spine.scaffoldPlan.routes.length === 0) {
    lines.push("> No routes were proposed. Either the project is not route-based, or the brief is too thin to derive them.");
    lines.push("");
  } else {
    lines.push(...section("Routes", renderBlock(spine.scaffoldPlan.routes, true)));
  }
  if (spine.goals.length > 0) {
    lines.push(...section("Brief goals these routes serve", spine.goals.map((g) => `- ${g.text}`)));
  }
  return lines.join("\n");
}
