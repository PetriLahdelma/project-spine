import { defineCommand } from "citty";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { renderArchitectureSummary } from "../reporters/architecture-summary.js";

export default defineCommand({
  meta: {
    name: "inspect",
    description: "Analyze a repo and emit architecture-summary.md + repo-profile.json (no brief required).",
  },
  args: {
    repo: { type: "string", description: "Path to repo root", default: "." },
    json: { type: "boolean", description: "Print JSON to stdout instead of writing files", default: false },
    out: {
      type: "string",
      description: "Output directory (relative to repo)",
      default: ".project-spine",
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const profile = await analyzeRepo(root);

    if (args.json) {
      process.stdout.write(JSON.stringify(profile, null, 2) + "\n");
      return;
    }

    const outDir = resolve(root, args.out);
    const exportsDir = join(outDir, "exports");
    await mkdir(exportsDir, { recursive: true });

    const profilePath = join(outDir, "repo-profile.json");
    const summaryPath = join(exportsDir, "architecture-summary.md");

    await writeFile(profilePath, JSON.stringify(profile, null, 2) + "\n", "utf8");
    await writeFile(summaryPath, renderArchitectureSummary(profile), "utf8");

    console.log(`analyzed ${root}`);
    console.log(`  framework:       ${profile.framework.value} (${profile.framework.confidence})`);
    console.log(`  routing:         ${profile.routing.value}`);
    console.log(`  package manager: ${profile.packageManager.value}`);
    console.log(`  styling:         ${profile.styling.value}`);
    console.log(`  typescript:      ${profile.language.typescript ? (profile.language.strict ? "strict" : "non-strict") : "no"}`);
    console.log(`  testing:         ${profile.testing.runners.length ? profile.testing.runners.join(", ") : "none detected"}`);
    console.log(`  warnings:        ${profile.warnings.length}`);
    console.log("");
    console.log(`wrote ${profilePath}`);
    console.log(`wrote ${summaryPath}`);
  },
});
