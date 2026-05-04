import type { SpineModel } from "../model/spine.js";
import { h, projectPurpose, stackLine, writtenAt } from "./shared.js";

/**
 * Cursor project rule.
 *
 * Cursor's current project-rule format is MDC under `.cursor/rules/`.
 * Keep this file intentionally thin and always-on: Cursor can also read
 * AGENTS.md directly, so this rule pins discovery to the Spine source of
 * truth and references the richer generated files instead of duplicating them.
 */
export function renderCursorProjectRule(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`description: Project Spine operating contract for ${yamlScalar(spine.metadata.name)}`);
  lines.push("alwaysApply: true");
  lines.push("---");
  lines.push("");
  lines.push(h(1, "Project Spine"));
  lines.push("");
  lines.push(writtenAt());
  lines.push("");
  lines.push(projectPurpose(spine));
  lines.push("");
  lines.push(`**Stack:** ${stackLine(spine)}`);
  lines.push("");
  lines.push(`Source of truth: \`.project-spine/spine.json\` (hash \`${spine.metadata.hash}\`).`);
  lines.push("");
  lines.push("## How to use this rule");
  lines.push("");
  lines.push("- Follow `@AGENTS.md` for the full repo-wide operating contract.");
  lines.push("- Review `@.project-spine/exports/qa-guardrails.md` before claiming completion.");
  lines.push("- Use `@.project-spine/exports/scaffold-plan.md` when planning new capability work.");
  lines.push("- If this rule or the imported files look wrong, edit the upstream brief/repo/design/template input and rerun `spine compile`.");
  lines.push("");
  lines.push("<!-- spine:deterministic -->");
  lines.push("");
  return lines.join("\n");
}

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}
