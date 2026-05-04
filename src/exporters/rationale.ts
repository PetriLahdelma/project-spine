import type { SpineModel } from "../model/spine.js";
import { renderHeader, section } from "./shared.js";

export type RationaleExtras = {
  /** Optional intro paragraph rendered between the header and the first section. */
  introParagraph?: string;
};

/**
 * Client-facing rationale. Translates the compiled spine into prose a non-technical
 * stakeholder can read. No inline rule traces — keep it narrative. Everything
 * here is derived from brief + repo + design, so content is honest by construction.
 *
 * `extras.introParagraph` is the one LLM-friendly slot — callers who want to pass
 * enriched prose can inject it here. The default (no extras) renders identically
 * to the offline build.
 */
export function renderRationale(spine: SpineModel, extras: RationaleExtras = {}): string {
  const lines: string[] = [];
  lines.push(...renderHeader(spine, `${spine.metadata.name} — Project rationale`, "Why the project is set up this way. Shareable with clients and non-technical stakeholders."));

  if (extras.introParagraph && extras.introParagraph.trim().length > 0) {
    lines.push(extras.introParagraph.trim(), "");
  }

  lines.push(...section("What we are building", spine.goals.length > 0
    ? spine.goals.map((g) => `- ${g.text}`)
    : ["_(goals will populate once `brief.md` lists them)_"]));

  if (spine.audience.length > 0) {
    lines.push(...section("Who we are building it for", spine.audience.map((a) => `- ${a.text}`)));
  }
  if (spine.constraints.length > 0) {
    lines.push(...section("Constraints we accepted", spine.constraints.map((c) => `- ${c.text}`)));
  }
  if (spine.assumptions.length > 0) {
    lines.push(...section("Assumptions we are making", spine.assumptions.map((a) => `- ${a.text}`)));
  }
  if (spine.risks.length > 0) {
    lines.push(...section("Risks we are watching", spine.risks.map((r) => `- ${r.text}`)));
  }

  const stackSummary: string[] = [];
  if (spine.stack.framework) stackSummary.push(`Framework: **${spine.stack.framework}**.`);
  if (spine.stack.styling && spine.stack.styling !== "unknown") stackSummary.push(`Styling: **${spine.stack.styling}**.`);
  if (spine.stack.language) stackSummary.push(`Language: **${spine.stack.language}**${spine.stack.detected && (spine.stack.detected as { tsStrict?: boolean }).tsStrict ? " (strict)" : ""}.`);
  if (spine.stack.testing.length > 0) stackSummary.push(`Testing: ${spine.stack.testing.map((t) => `**${t}**`).join(", ")}.`);
  if (stackSummary.length > 0) {
    lines.push(...section("The stack we are using", [stackSummary.join(" ")]));
  }

  const qualityNote = [
    "We enforce accessibility and testing guardrails from day one, not at the end. Every interactive surface is tested with keyboard only. Contrast, focus, and screen-reader behavior are part of the definition of done — not polish.",
  ];
  lines.push(...section("How we will ship quality", qualityNote));

  const howWeWork = [
    "Project context is compiled into a machine-readable layer (`.project-spine/spine.json`). Agent instruction files (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/project-spine.mdc`) are generated from that same source, so humans and coding agents stay aligned without hand-editing duplicated docs.",
    "When the brief or design evolves, we update the upstream input and recompile. That keeps the working context honest.",
  ];
  lines.push(...section("How we will work", howWeWork));

  if (spine.warnings.length > 0) {
    lines.push(...section("Open questions", spine.warnings
      .filter((w) => w.severity !== "info")
      .map((w) => `- ${humanizeWarning(w.message)}`)));
  }
  return lines.join("\n");
}

function humanizeWarning(msg: string): string {
  return msg
    .replace(/`([^`]+)`/g, "_$1_")
    .replace(/\s+/g, " ")
    .trim();
}
