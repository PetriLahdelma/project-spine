import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { SpineModel } from "../model/spine.js";
import { renderAgentsMd } from "./agents.js";
import { renderClaudeMd } from "./claude.js";
import { renderCopilotInstructions } from "./copilot.js";
import { renderCursorProjectRule, renderCursorWorkspaceRules } from "./cursor.js";
import { renderScaffoldPlan } from "./scaffold-plan.js";
import { renderRouteInventory } from "./route-inventory.js";
import { renderComponentPlan } from "./component-plan.js";
import { renderQaGuardrails } from "./qa-guardrails.js";
import { renderSprint1Backlog } from "./sprint-1-backlog.js";
import { renderRationale } from "./rationale.js";
import { fingerprintFile } from "../compiler/manifest.js";
import type { FileFingerprint } from "../model/export-manifest.js";

export type ExportTarget =
  | "agents"
  | "claude"
  | "copilot"
  | "cursor"
  | "scaffold"
  | "routes"
  | "components"
  | "qa"
  | "backlog"
  | "rationale";

export const ALL_TARGETS: ExportTarget[] = [
  "agents",
  "claude",
  "copilot",
  "cursor",
  "scaffold",
  "routes",
  "components",
  "qa",
  "backlog",
  "rationale",
];

export type RenderedExports = Record<ExportTarget, string>;

export type RenderExtras = {
  /** Optional LLM-enriched rationale intro paragraph. */
  rationaleIntroParagraph?: string;
};

export function renderAllExports(spine: SpineModel, extras: RenderExtras = {}): RenderedExports {
  return {
    agents: renderAgentsMd(spine),
    claude: renderClaudeMd(spine),
    copilot: renderCopilotInstructions(spine),
    cursor: renderCursorProjectRule(spine),
    scaffold: renderScaffoldPlan(spine),
    routes: renderRouteInventory(spine),
    components: renderComponentPlan(spine),
    qa: renderQaGuardrails(spine),
    backlog: renderSprint1Backlog(spine),
    rationale: renderRationale(spine, {
      ...(extras.rationaleIntroParagraph !== undefined && { introParagraph: extras.rationaleIntroParagraph }),
    }),
  };
}

export type WriteOptions = {
  repoRoot: string;
  outDir: string; // absolute path to .project-spine/
  targets?: ExportTarget[];
  extras?: RenderExtras;
};

/**
 * Writes exports to both locations:
 * - repo root: AGENTS.md, CLAUDE.md, .github/copilot-instructions.md,
 *   .cursor/rules/project-spine.mdc plus scoped workspace rules when detected
 *   (where tools look)
 * - .project-spine/exports/: canonical copies + the scaffold/docs family
 *
 * Returns the list of absolute paths written AND their sha256 fingerprints
 * for the export-manifest used by drift detection.
 */
export async function writeAllExports(
  spine: SpineModel,
  opts: WriteOptions
): Promise<{ written: string[]; fingerprints: FileFingerprint[] }> {
  const targets = opts.targets ?? ALL_TARGETS;
  const rendered = renderAllExports(spine, opts.extras ?? {});
  const exportsDir = join(opts.outDir, "exports");
  await mkdir(exportsDir, { recursive: true });

  const written: string[] = [];
  const tasks: Promise<unknown>[] = [];

  const push = async (path: string, content: string) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
    written.push(path);
  };

  const pushRoot = async (path: string, content: string) => {
    const existing = await readFile(path, "utf8").catch(() => "");
    await push(path, preserveLocalBlocks(content, existing));
  };

  for (const target of targets) {
    const content = rendered[target];
    const filename = exportFilename(target);
    tasks.push(push(join(exportsDir, filename), content));

    // Tool-discovery locations at repo root
    if (target === "agents") tasks.push(pushRoot(join(opts.repoRoot, "AGENTS.md"), content));
    if (target === "claude") tasks.push(pushRoot(join(opts.repoRoot, "CLAUDE.md"), content));
    if (target === "copilot")
      tasks.push(pushRoot(join(opts.repoRoot, ".github", "copilot-instructions.md"), content));
    if (target === "cursor") {
      tasks.push(pushRoot(join(opts.repoRoot, ".cursor", "rules", "project-spine.mdc"), content));
      for (const rule of renderCursorWorkspaceRules(spine)) {
        tasks.push(push(join(exportsDir, "cursor-rules", rule.filename), rule.content));
        tasks.push(pushRoot(join(opts.repoRoot, ".cursor", "rules", rule.filename), rule.content));
      }
    }
  }
  await Promise.all(tasks);
  written.sort();

  const fingerprints = await Promise.all(written.map((p) => fingerprintFile(p, opts.repoRoot)));
  return { written, fingerprints };
}

export function preserveLocalBlocks(generated: string, existing: string): string {
  const blocks = extractLocalBlocks(existing).filter((block) => !generated.includes(block.start));
  if (blocks.length === 0) return generated;

  const normalized = generated.endsWith("\n") ? generated.trimEnd() : generated;
  return `${normalized}\n\n${blocks.map((block) => block.content).join("\n\n")}\n`;
}

type LocalBlock = {
  start: string;
  content: string;
};

function extractLocalBlocks(text: string): LocalBlock[] {
  const blocks: LocalBlock[] = [];
  const markerPattern = /<!--\s*([A-Z][A-Z0-9_-]*):START\s*-->/g;
  let match: RegExpExecArray | null;

  while ((match = markerPattern.exec(text)) !== null) {
    const name = match[1]!;
    const start = match[0];
    const endPattern = new RegExp(`<!--\\s*${escapeRegExp(name)}:END\\s*-->`, "g");
    endPattern.lastIndex = markerPattern.lastIndex;
    const end = endPattern.exec(text);
    if (!end) continue;

    blocks.push({
      start,
      content: text.slice(match.index, end.index + end[0].length).trim(),
    });
    markerPattern.lastIndex = end.index + end[0].length;
  }

  return blocks;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function exportFilename(target: ExportTarget): string {
  switch (target) {
    case "agents":
      return "AGENTS.md";
    case "claude":
      return "CLAUDE.md";
    case "copilot":
      return "copilot-instructions.md";
    case "cursor":
      return "cursor-project-rule.mdc";
    case "scaffold":
      return "scaffold-plan.md";
    case "routes":
      return "route-inventory.md";
    case "components":
      return "component-plan.md";
    case "qa":
      return "qa-guardrails.md";
    case "backlog":
      return "sprint-1-backlog.md";
    case "rationale":
      return "rationale.md";
  }
}

export function parseTargets(raw: string): ExportTarget[] {
  if (!raw || raw === "all") return ALL_TARGETS;
  const parts = raw.split(",").map((s) => s.trim());
  const out: ExportTarget[] = [];
  for (const p of parts) {
    if (ALL_TARGETS.includes(p as ExportTarget)) {
      out.push(p as ExportTarget);
    } else {
      throw new Error(
        `unknown export target: "${p}". Pick from: ${ALL_TARGETS.join(", ")} (or --targets=all).`,
      );
    }
  }
  return out;
}
