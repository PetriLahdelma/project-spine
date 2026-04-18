import type { SpineModel } from "../model/spine.js";
import { renderHeader, section, renderBlock } from "./shared.js";

export function renderScaffoldPlan(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, "Scaffold plan", "Concrete setup decisions derived from the brief, the repo profile, and any design-system input."));

  lines.push(...section("Routes", renderBlock(spine.scaffoldPlan.routes)));
  lines.push(...section("Component buckets", renderBlock(spine.scaffoldPlan.components)));
  lines.push(...section("Sprint 1 seed", renderBlock(spine.scaffoldPlan.sprint1, true)));

  lines.push(...section("Stack notes", [
    `- **Framework:** \`${spine.stack.framework ?? "unknown"}\``,
    `- **Language:** \`${spine.stack.language ?? "unknown"}\``,
    `- **Styling:** \`${spine.stack.styling ?? "unknown"}\``,
    `- **Package manager:** \`${spine.stack.packageManager ?? "unknown"}\``,
    `- **Testing:** ${spine.stack.testing.length > 0 ? spine.stack.testing.map((t) => `\`${t}\``).join(", ") : "_none_"}`,
  ]));

  if (spine.warnings.length > 0) {
    lines.push(...section("Warnings worth resolving before build", spine.warnings.map((w) => `- **[${w.severity}] ${w.id}** — ${w.message}`)));
  }
  return lines.join("\n");
}
