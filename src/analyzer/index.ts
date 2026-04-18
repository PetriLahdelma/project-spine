import { detectPackageManager } from "./package-manager.js";
import { detectFramework, detectRouting } from "./framework.js";
import { detectStyling } from "./styling.js";
import { detectLanguage } from "./language.js";
import { detectTesting } from "./testing.js";
import { detectLinting } from "./linting.js";
import { detectCi } from "./ci.js";
import { detectAgentFiles } from "./agent-files.js";
import { readJson, rootPath } from "./fs.js";
import { RepoProfile } from "../model/repo-profile.js";

export async function analyzeRepo(root: string): Promise<RepoProfile> {
  const pkg = await readJson<Record<string, unknown>>(rootPath(root, "package.json"));
  const [packageManager, framework, styling, language, testing, linting, ci, agentFiles] = await Promise.all([
    detectPackageManager(root),
    detectFramework(root, pkg),
    detectStyling(root, pkg),
    detectLanguage(root),
    detectTesting(root, pkg),
    detectLinting(root, pkg),
    detectCi(root),
    detectAgentFiles(root),
  ]);
  const routing = await detectRouting(root, framework.value);

  const warnings: RepoProfile["warnings"] = [];
  if (!pkg) {
    warnings.push({
      id: "no-package-json",
      severity: "warn",
      message: "No readable package.json — framework and styling detection are unreliable.",
    });
  }
  if (framework.confidence < 0.5) {
    warnings.push({
      id: "framework-uncertain",
      severity: "warn",
      message: `Framework detection confidence ${framework.confidence}. Evidence: ${framework.evidence.join("; ")}`,
    });
  }
  if (styling.value === "mixed") {
    warnings.push({
      id: "styling-mixed",
      severity: "warn",
      message: `Multiple styling approaches detected: ${styling.evidence.join("; ")}`,
    });
  }
  if (routing.value === "next-hybrid") {
    warnings.push({
      id: "next-hybrid-routing",
      severity: "warn",
      message: "Both Next app/ and pages/ routers are present. Component and routing rules will be ambiguous until reconciled.",
    });
  }
  if (language.typescript && language.strict === false) {
    warnings.push({
      id: "ts-strict-off",
      severity: "info",
      message: "TypeScript is used but strict mode is disabled. Consider enabling it for agent rule clarity.",
    });
  }
  if (!agentFiles.agentsMd && !agentFiles.claudeMd && !agentFiles.copilotInstructions) {
    warnings.push({
      id: "no-agent-files",
      severity: "info",
      message: "No agent instruction files found. Spine will generate them on `spine compile`.",
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
    rawPackageJson: pkg,
    warnings,
  };
  return RepoProfile.parse(profile);
}
