import { defineCommand } from "citty";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile } from "../brief/parse.js";
import { parseDesignFromFile } from "../design/parse.js";
import { compileSpine } from "../compiler/compile.js";
import { renderArchitectureSummary } from "../reporters/architecture-summary.js";
import { renderBriefSummary } from "../reporters/brief-summary.js";
import { renderWarningsJson } from "../reporters/warnings.js";
import { writeAllExports } from "../exporters/index.js";
import { getTemplate } from "../templates/registry.js";

export default defineCommand({
  meta: {
    name: "compile",
    description: "Compile brief + repo + optional design + optional template into spine.json and exports.",
  },
  args: {
    brief: { type: "string", description: "Path to brief.md", required: true },
    repo: { type: "string", description: "Path to repo root", default: "." },
    design: { type: "string", description: "Optional path to design-rules.md", required: false },
    template: {
      type: "string",
      description: "Preset: saas-marketing | app-dashboard | design-system | docs-portal",
      required: false,
    },
    out: { type: "string", description: "Output directory (relative to repo)", default: ".project-spine" },
    name: { type: "string", description: "Project name override", required: false },
    version: { type: "string", description: "Project version", default: "0.1.0" },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const briefPath = resolve(process.cwd(), args.brief);
    const designPath = args.design ? resolve(process.cwd(), args.design) : null;

    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(root)]);
    const design = designPath ? await parseDesignFromFile(designPath) : null;
    const template = args.template ? (await getTemplate(args.template)).manifest : null;

    const spine = compileSpine({
      brief,
      repo,
      design,
      template,
      projectName: args.name,
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

    const exportedFiles = await writeAllExports(spine, { repoRoot: root, outDir });

    const warnSummary = summarizeWarnings(spine.warnings);
    console.log(`compiled spine for "${spine.metadata.name}" v${spine.metadata.version}`);
    if (template) console.log(`  template:     ${template.name} (${template.title})`);
    console.log(`  hash:         ${spine.metadata.hash}`);
    console.log(`  project type: ${spine.projectType}`);
    console.log(`  stack:        ${spine.stack.framework} / ${spine.stack.styling} / ${spine.stack.language}`);
    console.log(`  goals:        ${spine.goals.length}`);
    console.log(`  constraints:  ${spine.constraints.length}`);
    console.log(`  qa rules:     ${spine.qaGuardrails.length}`);
    console.log(`  warnings:     ${warnSummary}`);
    console.log("");
    console.log(`wrote ${exportedFiles.length + 6} files under ${outDir} and repo root.`);
    console.log("review the outputs, commit what you want to keep, and edit `brief.md` to refine.");
  },
});

function summarizeWarnings(warnings: { severity: string }[]): string {
  if (warnings.length === 0) return "0";
  const counts = { info: 0, warn: 0, error: 0 } as Record<string, number>;
  for (const w of warnings) counts[w.severity] = (counts[w.severity] ?? 0) + 1;
  return `${warnings.length} (${counts.error ?? 0} error, ${counts.warn ?? 0} warn, ${counts.info ?? 0} info)`;
}
