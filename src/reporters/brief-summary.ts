import type { NormalizedBrief } from "../model/brief.js";

export function renderBriefSummary(brief: NormalizedBrief): string {
  const lines: string[] = [];
  lines.push(`# Brief summary`);
  lines.push("");
  lines.push(`_Normalized by Project Spine on ${brief.parsedAt}._`);
  lines.push("");
  if (brief.name) lines.push(`**Project:** ${brief.name}`);
  lines.push(`**Type:** ${brief.projectType} _(confidence ${brief.projectTypeConfidence})_`);
  lines.push("");

  const order: Array<[keyof NormalizedBrief["sections"], string]> = [
    ["goals", "Goals"],
    ["nonGoals", "Non-goals"],
    ["audience", "Audience"],
    ["constraints", "Constraints"],
    ["assumptions", "Assumptions"],
    ["risks", "Risks"],
    ["successCriteria", "Success criteria"],
  ];

  for (const [key, label] of order) {
    const items = brief.sections[key];
    if (items.length === 0) continue;
    lines.push(`## ${label}`);
    lines.push("");
    for (const item of items) lines.push(`- ${item.text}`);
    lines.push("");
  }

  if (brief.unknownSections.length > 0) {
    lines.push(`## Unrecognized sections`);
    lines.push("");
    for (const u of brief.unknownSections) {
      lines.push(`- **${u.heading}** — skipped (${u.items.length} items)`);
    }
    lines.push("");
  }

  if (brief.warnings.length > 0) {
    lines.push(`## Warnings`);
    lines.push("");
    for (const w of brief.warnings) {
      lines.push(`- **[${w.severity}] ${w.id}** — ${w.message}`);
    }
    lines.push("");
  }

  lines.push(`<!-- spine:deterministic -->`);
  lines.push("");
  return lines.join("\n");
}
