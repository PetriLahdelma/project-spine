import type { SpineModel } from "../model/spine.js";
import { renderHeader, section, renderBlock } from "./shared.js";

export function renderComponentPlan(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, "Component plan", "How components are organized and how agents should extend them."));
  lines.push(...section("Buckets", renderBlock(spine.scaffoldPlan.components)));
  lines.push(...section("Usage guidance", renderBlock(spine.componentGuidance, true)));
  if (spine.designRules.length > 0) {
    lines.push(...section("From design rules", renderBlock(spine.designRules, true)));
  }
  lines.push(...section("UX rules", renderBlock(spine.uxRules, true)));
  return lines.join("\n");
}
