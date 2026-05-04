import type { SpineModel } from "../model/spine.js";
import { renderHeader, section, renderBlock } from "./shared.js";

export function renderQaGuardrails(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, "QA guardrails", "What 'done' means for this project. Every item here is actionable."));

  lines.push(...section("Project-level checks", renderBlock(spine.qaGuardrails, true)));
  lines.push(...section("Accessibility baseline", renderBlock(spine.a11yRules, true)));

  const dod = [
    "- [ ] Brief's success criteria all verified on a real environment.",
    "- [ ] `tsc --noEmit` passes (if TypeScript).",
    "- [ ] Lint passes with zero warnings on changed files.",
    "- [ ] Tests run in CI and pass.",
    "- [ ] All interactive surfaces tested with keyboard only.",
    "- [ ] Screen reader pass on primary flows.",
    "- [ ] No new dependencies added without explicit rationale.",
    "- [ ] Generated files (`AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, `project-spine.mdc`) reflect the current spine hash.",
  ];
  lines.push(...section("Definition of done (starter)", dod));

  if (spine.warnings.length > 0) {
    lines.push(...section("Open warnings", spine.warnings.map((w) => `- **[${w.severity}] ${w.id}** — ${w.message}`)));
  }
  return lines.join("\n");
}
