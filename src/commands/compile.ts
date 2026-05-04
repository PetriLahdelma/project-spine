import { defineCommand } from "citty";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile } from "../brief/parse.js";
import { parseDesignFromFile } from "../design/parse.js";
import { parseTokensFromFile, tokensIngestToDesignRules, mergeDesignRules } from "../design/tokens.js";
import { compileSpine } from "../compiler/compile.js";
import { renderArchitectureSummary } from "../reporters/architecture-summary.js";
import { renderBriefSummary } from "../reporters/brief-summary.js";
import { renderWarningsJson } from "../reporters/warnings.js";
import { writeAllExports } from "../exporters/index.js";
import { getTemplate } from "../templates/registry.js";
import { buildManifest, sha256OfFile } from "../compiler/manifest.js";
import { resolveLlmConfig } from "../llm/index.js";
import { enrichRationaleIntro } from "../llm/enrich.js";
import type { FileFingerprint } from "../model/export-manifest.js";

type FailOn = "never" | "info" | "warn" | "error";

const AGENT_FILE_BUDGET_BYTES = 32 * 1024;
const TOOL_DISCOVERY_EXPORTS = [
  { path: "AGENTS.md", label: "AGENTS.md" },
  { path: "CLAUDE.md", label: "CLAUDE.md" },
  { path: ".github/copilot-instructions.md", label: "copilot-instructions.md" },
  { path: ".cursor/rules/project-spine.mdc", label: "project-spine.mdc" },
] as const;

export default defineCommand({
  meta: {
    name: "compile",
    description: "Compile brief + repo + optional design + optional template into spine.json and exports.",
  },
  args: {
    brief: { type: "string", description: "Path to brief.md", required: true },
    repo: { type: "string", description: "Path to repo root", default: "." },
    design: { type: "string", description: "Optional path to design-rules.md", required: false },
    tokens: {
      type: "string",
      description: "Optional path to a design tokens JSON file (DTCG or Tokens Studio format). Merges with --design if both are given.",
      required: false,
    },
    template: { type: "string", description: "Preset name", required: false },
    out: { type: "string", description: "Output directory (relative to repo)", default: ".project-spine" },
    name: { type: "string", description: "Project name override", required: false },
    version: { type: "string", description: "Project version", default: "0.1.0" },
    "fail-on": {
      type: "string",
      description: "Exit non-zero if any warning meets this severity: never | info | warn | error",
      default: "never",
    },
    enrich: {
      type: "boolean",
      description:
        "Opt-in LLM enrichment of prose artefacts (rationale intro). Requires ANTHROPIC_API_KEY. Never load-bearing — deterministic output is preserved on any failure.",
      default: false,
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const briefPath = resolve(process.cwd(), args.brief);
    const designPath = args.design ? resolve(process.cwd(), args.design) : null;
    const tokensPath = args.tokens ? resolve(process.cwd(), args.tokens) : null;
    const failOn = parseFailOn(args["fail-on"]);

    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(root)]);
    const designFromFile = designPath ? await parseDesignFromFile(designPath) : null;
    const designFromTokens = tokensPath ? tokensIngestToDesignRules(await parseTokensFromFile(tokensPath)) : null;
    const design = mergeDesignRules(designFromFile, designFromTokens);
    const template = args.template ? (await getTemplate(args.template)).manifest : null;

    const spine = compileSpine({
      brief,
      repo,
      design,
      template,
      ...(args.name !== undefined && { projectName: args.name }),
      projectVersion: args.version,
    });

    const outDir = resolve(root, args.out);
    const exportsDir = join(outDir, "exports");
    await mkdir(exportsDir, { recursive: true });

    await Promise.all([
      writeFile(join(outDir, "brief.normalized.json"), JSON.stringify(brief, null, 2) + "\n", "utf8"),
      writeFile(join(outDir, "repo-profile.json"), JSON.stringify(repo, null, 2) + "\n", "utf8"),
      writeFile(join(outDir, "spine.json"), JSON.stringify(spine, null, 2) + "\n", "utf8"),
      writeFile(join(outDir, "warnings.json"), renderWarningsJson(spine), "utf8"),
      writeFile(join(exportsDir, "brief-summary.md"), renderBriefSummary(brief), "utf8"),
      writeFile(join(exportsDir, "architecture-summary.md"), renderArchitectureSummary(repo), "utf8"),
    ]);

    // Optional LLM enrichment. Opt-in via --enrich; requires an API key in env.
    // Skipped silently if the key is missing so the compile command stays
    // offline-safe. Enrichment failures fall back to the deterministic output.
    const llmCfg = args.enrich ? resolveLlmConfig() : null;
    let rationaleIntro: string | undefined;
    let enrichmentStatus = "disabled";
    if (args.enrich && !llmCfg) {
      enrichmentStatus = "no ANTHROPIC_API_KEY — skipped";
    } else if (llmCfg) {
      const res = await enrichRationaleIntro({
        baseline: "",
        projectName: spine.metadata.name,
        goals: spine.goals.map((g) => g.text),
        audience: spine.audience.map((a) => a.text),
        cfg: llmCfg,
      });
      if (res.enriched) {
        rationaleIntro = res.text;
        enrichmentStatus = `enriched (${res.scrubbedHits} secrets scrubbed)`;
      } else {
        enrichmentStatus = "attempted, fell back to deterministic";
      }
    }

    const { written: exportedFiles, fingerprints } = await writeAllExports(spine, {
      repoRoot: root,
      outDir,
      ...(rationaleIntro !== undefined && { extras: { rationaleIntroParagraph: rationaleIntro } }),
    });

    const tokensSha256 = tokensPath ? await sha256OfFile(tokensPath) : null;
    const manifest = buildManifest({
      spine,
      brief,
      briefPath,
      repo,
      // Only hash the file-based design for the manifest's designSha256 so
      // that a tokens-file edit triggers `input:tokens` drift rather than
      // double-firing `input:design` as well.
      design: designFromFile,
      designPath,
      tokensPath,
      tokensSha256,
      template,
      exports: fingerprints,
      repoRoot: root,
    });
    await writeFile(join(outDir, "export-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

    const warnSummary = summarizeWarnings(spine.warnings);
    console.log(`compiled spine for "${spine.metadata.name}" v${spine.metadata.version}`);
    if (template) console.log(`  template:     ${template.name} (${template.title})`);
    console.log(`  hash:         ${spine.metadata.hash}`);
    console.log(`  project type: ${spine.projectType}`);
    console.log(`  stack:        ${spine.stack.framework} / ${spine.stack.styling} / ${spine.stack.language}`);
    console.log(`  goals:        ${spine.goals.length}`);
    console.log(`  constraints:  ${spine.constraints.length}`);
    console.log(`  qa rules:     ${spine.qaGuardrails.length}`);
    console.log(`  agent files:  ${summarizeAgentFileBudget(fingerprints)}`);
    console.log(`  warnings:     ${warnSummary}`);
    if (args.enrich) console.log(`  enrichment:   ${enrichmentStatus}`);
    console.log("");
    console.log(`wrote ${exportedFiles.length + 7} files under ${outDir} and repo root.`);

    const triggered = triggeringWarnings(spine.warnings, failOn);
    if (triggered.length > 0) {
      console.error("");
      console.error(`--fail-on=${args["fail-on"]} triggered by ${triggered.length} warning(s):`);
      for (const w of triggered) console.error(`  [${w.severity}] ${w.id} — ${w.message}`);
      console.error("");
      console.error(`run \`spine explain <id>\` for suggested fixes, or pass --fail-on=never to ignore.`);
      process.exitCode = 2;
      return;
    }

    console.log("review the outputs, commit what you want to keep, and edit `brief.md` to refine.");
  },
});

function parseFailOn(raw: string): FailOn {
  const v = raw.trim().toLowerCase();
  if (v === "never" || v === "info" || v === "warn" || v === "error") return v;
  throw new Error(`invalid --fail-on value "${raw}" — expected one of: never, info, warn, error`);
}

function severityRank(s: string): number {
  switch (s) {
    case "info":
      return 1;
    case "warn":
      return 2;
    case "error":
      return 3;
    default:
      return 0;
  }
}

function triggeringWarnings(
  warnings: Array<{ severity: string; id: string; message: string }>,
  failOn: FailOn
): Array<{ severity: string; id: string; message: string }> {
  if (failOn === "never") return [];
  const threshold = severityRank(failOn);
  return warnings.filter((w) => severityRank(w.severity) >= threshold);
}

function summarizeWarnings(warnings: { severity: string }[]): string {
  if (warnings.length === 0) return "0";
  const counts = { info: 0, warn: 0, error: 0 } as Record<string, number>;
  for (const w of warnings) counts[w.severity] = (counts[w.severity] ?? 0) + 1;
  return `${warnings.length} (${counts.error ?? 0} error, ${counts.warn ?? 0} warn, ${counts.info ?? 0} info)`;
}

function summarizeAgentFileBudget(fingerprints: FileFingerprint[]): string {
  const entries = TOOL_DISCOVERY_EXPORTS.flatMap((target) => {
    const fp = fingerprints.find((f) => f.path === target.path);
    return fp ? [{ label: target.label, bytes: fp.bytes }] : [];
  });
  if (entries.length === 0) return "none written";

  const sizes = entries.map((e) => `${e.label} ${formatBytes(e.bytes)}`).join(", ");
  const over = entries.filter((e) => e.bytes > AGENT_FILE_BUDGET_BYTES).map((e) => e.label);
  const budget = `${formatBytes(AGENT_FILE_BUDGET_BYTES)}/file budget`;
  return over.length > 0 ? `${sizes} (over ${budget}: ${over.join(", ")})` : `${sizes} (${budget})`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
}
