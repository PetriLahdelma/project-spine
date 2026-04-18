import type { Rule, SpineModel } from "../model/spine.js";
import { renderHeader, h } from "./shared.js";

export function renderSprint1Backlog(spine: SpineModel): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, "Sprint 1 — backlog seed", "Starter items with acceptance criteria. Setup items clear the runway; delivery items trace to brief goals."));

  const items = spine.scaffoldPlan.sprint1;
  if (items.length === 0) {
    lines.push("> No sprint-1 items generated. Add goals to `brief.md` and rerun `spine compile`.");
    lines.push("");
    return lines.join("\n");
  }

  const setup = items.filter((i) => i.id.startsWith("setup-"));
  const deliver = items.filter((i) => !i.id.startsWith("setup-"));

  if (setup.length > 0) {
    lines.push(h(2, "Setup — clear the runway"));
    lines.push("");
    setup.forEach((item, index) => {
      lines.push(h(3, `S${index + 1}. ${short(item.text)}`));
      lines.push("");
      lines.push(`**Detail:** ${item.text}`);
      lines.push("");
      lines.push(`**Acceptance:**`);
      lines.push(...setupAcceptance(item));
      lines.push("");
      lines.push(`**Source:** \`${item.source.kind}:${item.source.pointer}\``);
      lines.push("");
    });
  }

  if (deliver.length > 0) {
    lines.push(h(2, "Deliver — sprint goals"));
    lines.push("");
    deliver.forEach((item, index) => {
      lines.push(h(3, `${index + 1}. ${short(item.text)}`));
      lines.push("");
      lines.push(`**Detail:** ${item.text}`);
      lines.push("");
      lines.push(`**Acceptance:**`);
      lines.push(...deliveryAcceptance(item, spine));
      lines.push("");
      lines.push(`**Source:** \`${item.source.kind}:${item.source.pointer}\``);
      lines.push("");
    });
  }

  return lines.join("\n");
}

function short(text: string): string {
  const t = text.replace(/^Deliver:\s*/, "");
  return t.length > 72 ? t.slice(0, 69) + "…" : t;
}

function setupAcceptance(_item: Rule): string[] {
  return [
    "- [ ] Change landed on main (or a release branch) and merged.",
    "- [ ] Verified locally and in CI where applicable.",
  ];
}

function deliveryAcceptance(_item: Rule, spine: SpineModel): string[] {
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
