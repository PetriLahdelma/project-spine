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
  const scopedRules = renderCursorWorkspaceRules(spine);
  if (scopedRules.length > 0) {
    lines.push(
      `- Cursor scoped workspace rules are generated for: ${scopedRules.map((rule) => `\`${rule.workspace}\``).join(", ")}.`,
    );
  }
  lines.push("- If this rule or the imported files look wrong, edit the upstream brief/repo/design/template input and rerun `spine compile`.");
  lines.push("");
  lines.push("<!-- spine:deterministic -->");
  lines.push("");
  return lines.join("\n");
}

export type CursorWorkspaceRule = {
  workspace: string;
  filename: string;
  content: string;
};

export function renderCursorWorkspaceRules(spine: SpineModel): CursorWorkspaceRule[] {
  const workspaces = workspacePaths(spine);
  return workspaces.map((workspace) => {
    const filename = workspaceRuleFilename(workspace);
    const lines: string[] = [];
    lines.push("---");
    lines.push(`description: Project Spine scoped guidance for ${yamlScalar(workspace)}`);
    lines.push(`globs: ${yamlScalar(`${workspace}/**`)}`);
    lines.push("alwaysApply: false");
    lines.push("---");
    lines.push("");
    lines.push(h(1, `Project Spine — ${workspace}`));
    lines.push("");
    lines.push(writtenAt());
    lines.push("");
    lines.push(`This scoped Cursor rule applies when editing \`${workspace}\`.`);
    lines.push("");
    lines.push("- Follow `@AGENTS.md` for the repo-wide operating contract.");
    lines.push("- Review `@.project-spine/exports/qa-guardrails.md` before claiming completion.");
    lines.push(`- If framework or routing guidance is wrong for this workspace, re-run compile with \`spine compile --brief ./brief.md --repo ${workspace}\`.`);
    lines.push("- Keep imports inside the workspace boundary unless a shared package owns the dependency.");
    lines.push("");
    lines.push(`Source of truth: \`.project-spine/spine.json\` (hash \`${spine.metadata.hash}\`).`);
    lines.push("");
    lines.push("<!-- spine:deterministic -->");
    lines.push("");
    return { workspace, filename, content: lines.join("\n") };
  });
}

function workspaceRuleFilename(workspace: string): string {
  const slug = workspace
    .replace(/^[./]+/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `project-spine-${slug || "workspace"}.mdc`;
}

function workspacePaths(spine: SpineModel): string[] {
  const monorepo = spine.stack.detected["monorepo"];
  if (!isDetectedMonorepo(monorepo)) return [];
  return monorepo.workspaces
    .filter((workspace) => !workspace.startsWith("."))
    .slice()
    .sort();
}

function isDetectedMonorepo(value: unknown): value is { isMonorepo: true; workspaces: string[] } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { isMonorepo?: unknown; workspaces?: unknown };
  return candidate.isMonorepo === true && Array.isArray(candidate.workspaces) && candidate.workspaces.every((item) => typeof item === "string");
}

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}
