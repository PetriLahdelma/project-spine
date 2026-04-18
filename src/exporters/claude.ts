import type { SpineModel } from "../model/spine.js";
import { renderBlock, section, projectPurpose, stackLine, writtenAt, h } from "./shared.js";

/**
 * CLAUDE.md follows HumanLayer / Addy Osmani guidance: keep it lean, lean on
 * imports for deeper rule docs. Claude Code supports `@path/to/file` imports.
 */
export function renderClaudeMd(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(h(1, `${spine.metadata.name} — Claude instructions`));
  lines.push("");
  lines.push(writtenAt());
  lines.push("");
  lines.push(projectPurpose(spine));
  lines.push("");
  lines.push(`**Stack:** ${stackLine(spine)}`);
  lines.push("");

  lines.push(h(2, "Working agreement"));
  lines.push("");
  lines.push(...renderBlock(spine.agentInstructions.dosAndDonts));
  lines.push("");

  lines.push(h(2, "Never do this"));
  lines.push("");
  lines.push(...renderBlock(spine.agentInstructions.unsafeActions));
  lines.push("");

  lines.push(h(2, "Response expectations"));
  lines.push("");
  lines.push(...renderBlock(spine.agentInstructions.responseExpectations));
  lines.push("");

  if (spine.agentInstructions.filePlacement.length > 0) {
    lines.push(h(2, "File placement"));
    lines.push("");
    lines.push(...renderBlock(spine.agentInstructions.filePlacement));
    lines.push("");
  }

  lines.push(h(2, "Deeper context (imported)"));
  lines.push("");
  lines.push("When you need more than the above, read:");
  lines.push("");
  lines.push("- @.project-spine/exports/architecture-summary.md");
  lines.push("- @.project-spine/exports/component-plan.md");
  lines.push("- @.project-spine/exports/qa-guardrails.md");
  lines.push("- @.project-spine/exports/scaffold-plan.md");
  lines.push("- @.project-spine/exports/route-inventory.md");
  lines.push("- @.project-spine/exports/sprint-1-backlog.md");
  lines.push("- @AGENTS.md");
  lines.push("");

  lines.push(h(2, "Source of truth"));
  lines.push("");
  lines.push(`All rules above are compiled from \`brief.md\` + repo state${spine.designRules.length > 0 ? " + `design-rules.md`" : ""}.`);
  lines.push(`Canonical model: \`.project-spine/spine.json\` (hash \`${spine.metadata.hash}\`).`);
  lines.push(`To change a rule, edit the upstream input and run \`spine compile\` — do not hand-edit this file.`);
  lines.push("");
  if (spine.warnings.length > 0) {
    lines.push(`⚠ ${spine.warnings.length} warning${spine.warnings.length === 1 ? "" : "s"} in \`.project-spine/warnings.json\` — review before adding a new capability.`);
    lines.push("");
  }
  lines.push("<!-- spine:deterministic -->");
  lines.push("");
  return lines.join("\n");
}
