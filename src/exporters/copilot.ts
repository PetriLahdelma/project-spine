import type { SpineModel } from "../model/spine.js";
import { renderBlock, stackLine, projectPurpose, writtenAt, h } from "./shared.js";

/**
 * .github/copilot-instructions.md — Copilot does not support `@import`, so this
 * is a single self-contained file. Keep short: Copilot injects it into every
 * prompt.
 */
export function renderCopilotInstructions(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(h(1, "Copilot instructions"));
  lines.push("");
  lines.push(writtenAt());
  lines.push("");
  lines.push(projectPurpose(spine));
  lines.push("");
  lines.push(`**Stack:** ${stackLine(spine)}`);
  lines.push("");

  lines.push(h(2, "Repo conventions"));
  lines.push("");
  lines.push(...renderBlock(spine.repoConventions));
  lines.push("");

  lines.push(h(2, "Do / Don't"));
  lines.push("");
  lines.push(...renderBlock(spine.agentInstructions.dosAndDonts));
  lines.push("");

  lines.push(h(2, "Never do this"));
  lines.push("");
  lines.push(...renderBlock(spine.agentInstructions.unsafeActions));
  lines.push("");

  if (spine.agentInstructions.filePlacement.length > 0) {
    lines.push(h(2, "File placement"));
    lines.push("");
    lines.push(...renderBlock(spine.agentInstructions.filePlacement));
    lines.push("");
  }

  lines.push(h(2, "Quality bar"));
  lines.push("");
  lines.push(...renderBlock(spine.qaGuardrails.slice(0, 6)));
  lines.push("");
  if (spine.qaGuardrails.length > 6) {
    lines.push(`_Full QA guardrails: \`.project-spine/exports/qa-guardrails.md\`._`);
    lines.push("");
  }

  lines.push(h(2, "Accessibility"));
  lines.push("");
  lines.push(...renderBlock(spine.a11yRules));
  lines.push("");

  lines.push(`_Source of truth: \`.project-spine/spine.json\` (hash \`${spine.metadata.hash}\`)._`);
  lines.push("");
  lines.push("<!-- spine:deterministic -->");
  lines.push("");
  return lines.join("\n");
}
