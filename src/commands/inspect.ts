import { defineCommand } from "citty";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { renderArchitectureSummary } from "../reporters/architecture-summary.js";

const AGENT_FILE_BYTE_BUDGET = 32 * 1024;
const AGENT_FILE_TOKEN_BUDGET = 8_000;

type AgentFileReport = {
  byteBudget: number;
  tokenBudget: number;
  files: AgentFileEntry[];
};

type AgentFileEntry = {
  consumer: string;
  path: string;
  status: "ok" | "warn" | "missing";
  bytes: number;
  estimatedTokens: number;
  note: string;
};

export default defineCommand({
  meta: {
    name: "inspect",
    description: "Analyze a repo and emit architecture-summary.md + repo-profile.json (no brief required).",
  },
  args: {
    repo: { type: "string", description: "Path to repo root", default: "." },
    json: { type: "boolean", description: "Print JSON to stdout instead of writing files", default: false },
    "agent-files": {
      type: "boolean",
      description: "Explain target agent files and approximate byte/token budgets.",
      default: false,
    },
    out: {
      type: "string",
      description: "Output directory (relative to repo)",
      default: ".project-spine",
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const profile = await analyzeRepo(root);
    const agentFiles = args["agent-files"] ? await inspectAgentFiles(root) : null;

    if (args.json) {
      process.stdout.write(JSON.stringify(agentFiles ? { profile, agentFiles } : profile, null, 2) + "\n");
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
    if (agentFiles) {
      console.log("");
      printAgentFiles(agentFiles);
    }
    console.log("");
    console.log(`wrote ${profilePath}`);
    console.log(`wrote ${summaryPath}`);
    console.log("");
    console.log(
      "next: sketch goals in `brief.md`, then run `spine compile --brief ./brief.md --repo .` to emit AGENTS.md, CLAUDE.md, and the full export set.",
    );
  },
});

async function inspectAgentFiles(root: string): Promise<AgentFileReport> {
  const fixedTargets: Array<{ consumer: string; path: string }> = [
    { consumer: "Codex / generic agents", path: "AGENTS.md" },
    { consumer: "Claude Code", path: "CLAUDE.md" },
    { consumer: "GitHub Copilot", path: ".github/copilot-instructions.md" },
    { consumer: "Cursor project rule", path: ".cursor/rules/project-spine.mdc" },
  ];

  const scopedCursorTargets = await discoverScopedCursorRules(root);
  const files = await Promise.all(
    [...fixedTargets, ...scopedCursorTargets].map((target) => inspectAgentFile(root, target.consumer, target.path)),
  );

  return {
    byteBudget: AGENT_FILE_BYTE_BUDGET,
    tokenBudget: AGENT_FILE_TOKEN_BUDGET,
    files,
  };
}

async function discoverScopedCursorRules(root: string): Promise<Array<{ consumer: string; path: string }>> {
  const rulesDir = join(root, ".cursor", "rules");
  const entries = await readdir(rulesDir).catch(() => []);
  return entries
    .filter((entry) => /^project-spine-.+\.mdc$/.test(entry))
    .sort()
    .map((entry) => ({
      consumer: "Cursor scoped rule",
      path: `.cursor/rules/${entry}`,
    }));
}

async function inspectAgentFile(root: string, consumer: string, relativePath: string): Promise<AgentFileEntry> {
  const content = await readFile(join(root, relativePath), "utf8").catch(() => null);
  if (content === null) {
    return {
      consumer,
      path: relativePath,
      status: "missing",
      bytes: 0,
      estimatedTokens: 0,
      note: "missing; run `spine compile --brief ./brief.md --repo .` to generate it",
    };
  }

  const bytes = Buffer.byteLength(content, "utf8");
  const estimatedTokens = estimateTokens(content);
  const overBudget = bytes > AGENT_FILE_BYTE_BUDGET || estimatedTokens > AGENT_FILE_TOKEN_BUDGET;
  return {
    consumer,
    path: relativePath,
    status: overBudget ? "warn" : "ok",
    bytes,
    estimatedTokens,
    note: overBudget
      ? `over budget (${formatBytes(AGENT_FILE_BYTE_BUDGET)} / ~${AGENT_FILE_TOKEN_BUDGET.toLocaleString()} tokens)`
      : "within budget",
  };
}

function printAgentFiles(report: AgentFileReport): void {
  console.log("agent files:");
  console.log(
    `  budget: ${formatBytes(report.byteBudget)} per file / ~${report.tokenBudget.toLocaleString()} tokens`,
  );
  for (const file of report.files) {
    const marker = file.status === "ok" ? "[ok]" : file.status === "warn" ? "[warn]" : "[missing]";
    const size =
      file.status === "missing"
        ? "not present"
        : `${formatBytes(file.bytes)} / ~${file.estimatedTokens.toLocaleString()} tokens`;
    console.log(`  ${marker} ${file.consumer}: ${file.path} — ${size}; ${file.note}`);
  }
}

function estimateTokens(content: string): number {
  if (content.length === 0) return 0;
  return Math.ceil(Buffer.byteLength(content, "utf8") / 4);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}
