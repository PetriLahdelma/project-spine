import { defineCommand } from "citty";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { checkDrift } from "../drift/check.js";
import { renderDriftReportMd } from "../drift/report.js";
import { buildDriftDiff, renderDriftDiffText } from "../drift/diff.js";
import { apiFetch, ApiError } from "../cli-client/api.js";
import { readConfig } from "../cli-client/config.js";
import { SpineModel } from "../model/spine.js";
import { slugify } from "../cli-client/config-helpers.js";

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
    push: {
      type: "boolean",
      description: "Push the report to the active workspace's drift fleet view",
      default: false,
    },
    project: {
      type: "string",
      required: false,
      description: "Project slug for workspace drift (default: derived from spine.metadata.name)",
    },
    workspace: {
      type: "string",
      required: false,
      description: "Workspace slug (default: active)",
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

    if (args.push) {
      await pushToWorkspace({
        root,
        outDir,
        report,
        projectSlugArg: args.project,
        workspaceArg: args.workspace,
      });
    }

    const failOn = parseFailOn(args["fail-on"]);
    const shouldFail = selectFailure(report, failOn);
    if (shouldFail) process.exitCode = 1;
  },
});

const diff = defineCommand({
  meta: {
    name: "diff",
    description: "Show what drifted — unified diffs for hand-edited exports, hash changes for inputs.",
  },
  args: {
    repo: { type: "string", description: "Path to repo root", default: "." },
    out: { type: "string", description: ".project-spine directory", default: ".project-spine" },
    json: { type: "boolean", description: "Print JSON to stdout (for CI)", default: false },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const report = await checkDrift({ repo: root, out: args.out });
    const driftDiff = await buildDriftDiff({ repo: root, out: args.out, report });

    if (args.json) {
      process.stdout.write(JSON.stringify(driftDiff, null, 2) + "\n");
    } else {
      process.stdout.write(renderDriftDiffText(driftDiff));
    }

    if (!driftDiff.clean) process.exitCode = 1;
  },
});

export default defineCommand({
  meta: { name: "drift", description: "Drift detection — compare current state to the last compile." },
  subCommands: { check, diff },
});

async function pushToWorkspace(params: {
  root: string;
  outDir: string;
  report: Awaited<ReturnType<typeof checkDrift>>;
  projectSlugArg: string | undefined;
  workspaceArg: string | undefined;
}): Promise<void> {
  const cfg = await readConfig();
  if (!cfg.auth?.token) {
    console.error("--push: not signed in. run `spine login`.");
    return;
  }
  const workspace = params.workspaceArg ?? cfg.activeWorkspace;
  if (!workspace) {
    console.error("--push: no active workspace. run `spine workspace switch <slug>` or pass --workspace.");
    return;
  }

  let projectName: string;
  try {
    const spine = SpineModel.parse(JSON.parse(await readFile(join(params.outDir, "spine.json"), "utf8")));
    projectName = spine.metadata.name;
  } catch {
    projectName = basename(params.root);
  }
  const projectSlug = params.projectSlugArg ?? slugify(projectName);

  try {
    const { body } = await apiFetch<{
      workspace: string;
      project: string;
      snapshotId: string;
      url: string;
      status: string;
    }>(`/api/workspaces/${encodeURIComponent(workspace)}/drift`, {
      method: "POST",
      body: {
        projectSlug,
        projectName,
        storedSpineHash: params.report.storedSpineHash,
        currentSpineHash: params.report.currentSpineHash,
        clean: params.report.clean,
        counts: {
          total: params.report.counts.total,
          inputDrift: params.report.counts.inputDrift,
          exportHandEdits: params.report.counts.exportHandEdits,
          missingExports: params.report.counts.missingExports,
        },
        items: params.report.items.map((i) => ({
          kind: i.kind,
          path: i.path,
          detail: i.detail,
        })),
      },
    });
    console.log("");
    console.log(`pushed to workspace "${body.workspace}" → project "${body.project}" (${body.status})`);
    console.log(`  ${body.url}`);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) console.error("--push: token rejected. run `spine login`.");
      else if (err.status === 404) console.error("--push: workspace not found.");
      else console.error(`--push: api error ${err.status}: ${err.message}`);
    } else {
      console.error(`--push failed: ${(err as Error).message}`);
    }
  }
}

function parseFailOn(raw: string): FailOn {
  const v = raw.trim().toLowerCase();
  if (v === "none" || v === "any" || v === "inputs" || v === "exports") return v;
  throw new Error(`invalid --fail-on "${raw}" — expected one of: none, any, inputs, exports`);
}

function selectFailure(
  report: { clean: boolean; counts: { inputDrift: number; exportHandEdits: number; missingExports: number } },
  failOn: FailOn,
): boolean {
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
