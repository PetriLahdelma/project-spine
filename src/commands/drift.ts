import { defineCommand } from "citty";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { checkDrift } from "../drift/check.js";
import { renderDriftReportMd } from "../drift/report.js";

type FailOn = "none" | "any" | "inputs" | "exports";

const check = defineCommand({
  meta: {
    name: "check",
    description: "Compare current repo state to the stored export manifest.",
  },
  args: {
    repo: { type: "string", description: "Path to repo root", default: "." },
    out: { type: "string", description: ".project-spine directory", default: ".project-spine" },
    json: { type: "boolean", description: "Print JSON to stdout (for CI)", default: false },
    "fail-on": {
      type: "string",
      description: "Exit non-zero on: none | any | inputs | exports",
      default: "any",
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const report = await checkDrift({ repo: root, out: args.out });

    const outDir = resolve(root, args.out);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "drift-report.md"), renderDriftReportMd(report), "utf8");
    await writeFile(join(outDir, "drift-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

    if (args.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    } else {
      if (report.clean) {
        console.log(`clean — spine hash ${report.storedSpineHash} matches current.`);
      } else {
        console.log(`drift detected — ${report.counts.total} item(s):`);
        console.log(`  input drift:        ${report.counts.inputDrift}`);
        console.log(`  hand-edited files:  ${report.counts.exportHandEdits}`);
        console.log(`  missing files:      ${report.counts.missingExports}`);
        console.log("");
        for (const item of report.items.slice(0, 10)) {
          console.log(`  [${item.kind}]${item.path ? ` ${item.path}` : ""} — ${item.detail}`);
        }
        if (report.items.length > 10) console.log(`  …and ${report.items.length - 10} more`);
        console.log("");
        console.log(`full report: ${join(outDir, "drift-report.md")}`);
      }
    }

    const failOn = parseFailOn(args["fail-on"]);
    const shouldFail = selectFailure(report, failOn);
    if (shouldFail) process.exitCode = 1;
  },
});

export default defineCommand({
  meta: { name: "drift", description: "Drift detection — compare current state to the last compile." },
  subCommands: { check },
});

function parseFailOn(raw: string): FailOn {
  const v = raw.trim().toLowerCase();
  if (v === "none" || v === "any" || v === "inputs" || v === "exports") return v;
  throw new Error(`invalid --fail-on "${raw}" — expected one of: none, any, inputs, exports`);
}

function selectFailure(report: { clean: boolean; counts: { inputDrift: number; exportHandEdits: number; missingExports: number } }, failOn: FailOn): boolean {
  if (report.clean) return false;
  switch (failOn) {
    case "none":
      return false;
    case "any":
      return true;
    case "inputs":
      return report.counts.inputDrift > 0;
    case "exports":
      return report.counts.exportHandEdits > 0 || report.counts.missingExports > 0;
  }
}
