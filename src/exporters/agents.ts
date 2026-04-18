import type { SpineModel } from "../model/spine.js";
import { renderBlock, section, projectPurpose, stackLine, writtenAt, h } from "./shared.js";

export function renderAgentsMd(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(h(1, "AGENTS.md"));
  lines.push("");
  lines.push(writtenAt());
  lines.push("");
  lines.push(projectPurpose(spine));
  lines.push("");
  lines.push(`**Stack:** ${stackLine(spine)}`);
  lines.push("");
  lines.push(`**Project type:** \`${spine.projectType}\``);
  lines.push("");
  lines.push(`> Source of truth: \`.project-spine/spine.json\` (hash \`${spine.metadata.hash}\`). Every rule below has a traceable source. If a rule is wrong, fix the upstream input (\`brief.md\`, repo state, or \`design-rules.md\`) and rerun \`spine compile\`.`);
  lines.push("");

  lines.push(...section("Repo conventions", renderBlock(spine.repoConventions)));
  lines.push(...section("Do / Don't", renderBlock(spine.agentInstructions.dosAndDonts)));
  lines.push(...section("Never do this (unsafe)", renderBlock(spine.agentInstructions.unsafeActions)));
  lines.push(...section("File placement", renderBlock(spine.agentInstructions.filePlacement)));
  lines.push(...section("Response expectations", renderBlock(spine.agentInstructions.responseExpectations)));

  lines.push(...section(
    "Component & design rules",
    [...renderBlock(spine.componentGuidance), ...(spine.designRules.length > 0 ? ["", ..."Design rules (from `design-rules.md`):".split("|"), ...renderBlock(spine.designRules)] : [])]
  ));
  lines.push(...section("Accessibility baseline", renderBlock(spine.a11yRules)));
  lines.push(...section("UX rules", renderBlock(spine.uxRules)));
  lines.push(...section("QA guardrails", renderBlock(spine.qaGuardrails)));

  const goalsBlock = spine.goals.length > 0
    ? spine.goals.map((g) => `- ${g.text}`)
    : ["_(no goals captured in brief)_"];
  lines.push(...section("What we are building (from brief)", goalsBlock));

  if (spine.constraints.length > 0) {
    lines.push(...section("Constraints", spine.constraints.map((c) => `- ${c.text}`)));
  }
  if (spine.risks.length > 0) {
    lines.push(...section("Known risks", spine.risks.map((r) => `- ${r.text}`)));
  }

  if (spine.warnings.length > 0) {
    lines.push(h(2, "Open warnings"));
    lines.push("");
    lines.push(`There ${spine.warnings.length === 1 ? "is" : "are"} ${spine.warnings.length} unresolved warning${spine.warnings.length === 1 ? "" : "s"} in \`warnings.json\`. Agents should review them before starting a new capability.`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`See \`.project-spine/exports/\` for the full scaffold plan, route inventory, component plan, QA guardrails, sprint-1 backlog, and client-facing rationale.`);
  lines.push("");
  return lines.join("\n");
}
