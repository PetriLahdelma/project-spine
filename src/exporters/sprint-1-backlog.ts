import type { Rule, SpineModel } from "../model/spine.js";
import { renderHeader, h } from "./shared.js";

export function renderSprint1Backlog(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, "Sprint 1 — backlog seed", "Starter items with acceptance criteria. Every item traces back to a brief goal or a setup need."));

  const items = spine.scaffoldPlan.sprint1;
  if (items.length === 0) {
    lines.push("> No sprint-1 items generated. Add goals to `brief.md` and rerun `spine compile`.");
    lines.push("");
    return lines.join("\n");
  }

  items.forEach((item, index) => {
    lines.push(h(2, `${index + 1}. ${short(item.text)}`));
    lines.push("");
    lines.push(`**Detail:** ${item.text}`);
    lines.push("");
    lines.push(`**Acceptance:**`);
    lines.push(...acceptanceFor(item, spine));
    lines.push("");
    lines.push(`**Source:** \`${item.source.kind}:${item.source.pointer}\``);
    lines.push("");
  });

  return lines.join("\n");
}

function short(text: string): string {
  const t = text.replace(/^Deliver:\s*/, "");
  return t.length > 72 ? t.slice(0, 69) + "…" : t;
}

function acceptanceFor(item: Rule, spine: SpineModel): string[] {
  const generic = [
    "- [ ] Implemented behind the stack and conventions declared in `AGENTS.md`.",
    "- [ ] Typecheck + lint + tests pass locally and in CI.",
    "- [ ] No `any` introduced. No new dependency without rationale.",
  ];
  const a11y = spine.a11yRules.length > 0
    ? ["- [ ] Keyboard-only walkthrough completes the flow.", "- [ ] Screen reader announces labels and state changes."]
    : [];
  return [...generic, ...a11y];
}
