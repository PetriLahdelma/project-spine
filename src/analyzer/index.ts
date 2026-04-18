import { detectPackageManager } from "./package-manager.js";
import { detectFramework, detectRouting } from "./framework.js";
import { detectStyling } from "./styling.js";
import { detectLanguage } from "./language.js";
import { detectTesting } from "./testing.js";
import { detectLinting } from "./linting.js";
import { detectCi } from "./ci.js";
import { detectAgentFiles } from "./agent-files.js";
import { detectMonorepo } from "./monorepo.js";
import { readJson, rootPath } from "./fs.js";
import { RepoProfile } from "../model/repo-profile.js";

export async function analyzeRepo(root: string): Promise<RepoProfile> {
  const pkg = await readJson<Record<string, unknown>>(rootPath(root, "package.json"));
  const [packageManager, framework, styling, language, testing, linting, ci, agentFiles, monorepo] = await Promise.all([
    detectPackageManager(root),
    detectFramework(root, pkg),
    detectStyling(root, pkg),
    detectLanguage(root),
    detectTesting(root, pkg),
    detectLinting(root, pkg),
    detectCi(root),
    detectAgentFiles(root),
    detectMonorepo(root, pkg),
  ]);
  const routing = await detectRouting(root, framework.value);

  const warnings: RepoProfile["warnings"] = [];
  if (!pkg) {
    warnings.push({
      id: "no-package-json",
      severity: "warn",
      message: "No readable package.json — framework and styling detection are unreliable.",
      suggestion: "Run `npm init` (or equivalent) at the repo root, or point `--repo` at a directory that has one.",
    });
  }
  if (framework.confidence < 0.5 && !monorepo.isMonorepo) {
    warnings.push({
      id: "framework-uncertain",
      severity: "warn",
      message: `Framework detection confidence ${framework.confidence}. Evidence: ${framework.evidence.join("; ")}`,
      suggestion:
        "Install the framework dependency explicitly (e.g., `npm i next`), or bootstrap from a framework starter before compiling.",
    });
  }
  if (monorepo.isMonorepo) {
    const count = monorepo.workspaces.length;
    warnings.push({
      id: "monorepo-detected",
      severity: "warn",
      message: `Detected a ${monorepo.tool} monorepo with ${count} workspace${count === 1 ? "" : "s"}. Framework detection at the root is unreliable; compile against a specific workspace instead.`,
      suggestion:
        count > 0
          ? `Re-run with \`--repo ${monorepo.workspaces[0]}\` (or another workspace). Workspaces detected: ${monorepo.workspaces.slice(0, 6).join(", ")}${count > 6 ? ", …" : ""}.`
          : "Point `--repo` at the specific package you want to compile (e.g., `apps/web`).",
    });
  }
  if (styling.value === "mixed") {
    warnings.push({
      id: "styling-mixed",
      severity: "warn",
      message: `Multiple styling approaches detected: ${styling.evidence.join("; ")}`,
      suggestion:
        "Pick one approach for new work and document the migration plan under `Constraints` in brief.md. The compiler will generate a rule telling agents to match the pattern already in the file.",
    });
  }
  if (routing.value === "next-hybrid") {
    warnings.push({
      id: "next-hybrid-routing",
      severity: "warn",
      message: "Both Next app/ and pages/ routers are present. Component and routing rules will be ambiguous until reconciled.",
      suggestion:
        "Decide which router is canonical. Migrate the other or note the split explicitly in brief.md so agents know where new surfaces belong.",
    });
  }
  if (language.typescript && language.strict === false) {
    warnings.push({
      id: "ts-strict-off",
      severity: "info",
      message: "TypeScript is used but strict mode is disabled.",
      suggestion:
        'Set `"strict": true` in tsconfig.json compilerOptions. Spine will then generate a "never use any" convention automatically.',
    });
  }
  if (!agentFiles.agentsMd && !agentFiles.claudeMd && !agentFiles.copilotInstructions) {
    warnings.push({
      id: "no-agent-files",
      severity: "info",
      message: "No agent instruction files found.",
      suggestion: "Run `spine compile --brief ./brief.md --repo .` to generate AGENTS.md, CLAUDE.md, and copilot-instructions.md.",
    });
  }

  const profile: RepoProfile = {
    schemaVersion: 1,
    root,
    detectedAt: new Date().toISOString(),
    packageManager,
    framework,
    routing,
    styling,
    language,
    testing,
    linting,
    ci,
    agentFiles,
    monorepo,
    rawPackageJson: pkg,
    warnings,
  };
  return RepoProfile.parse(profile);
}
