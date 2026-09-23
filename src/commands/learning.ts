import { defineCommand } from "citty";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { learnCase, replayCase, guardRepo, contextForFiles, listCases, explainCase, renderGuardReportHtml, FailureCaseSchema, type GuardReport } from "../learning/index.js";
import { runLearningDemo } from "../demo.js";
import { fetchPullRequestEvidence } from "../github/index.js";
import { evaluateCase } from "../evaluation/index.js";

const exec = promisify(execFile);
const commonArgs = {
  repo: { type: "string" as const, default: ".", description: "Repository root" },
  json: { type: "boolean" as const, default: false, description: "Emit structured JSON" },
};
function json(value: unknown) { process.stdout.write(JSON.stringify(value, null, 2) + "\n"); }
function fileList(value: string): string[] {
  const files = value.split(",").map((file) => file.trim()).filter(Boolean);
  if (!files.length) throw new Error("Provide at least one repository-relative path with --files.");
  return files;
}
function guardExit(report: GuardReport): number {
  if (report.skippedCaseIds.length || report.status === "unprotected" || report.status === "uncovered") return 2;
  return report.passed ? 0 : 1;
}
function printGuard(report: GuardReport): void {
  const code = guardExit(report);
  console.log(`Project Spine guard — ${code === 0 ? "passed" : code === 2 ? "incomplete evidence" : "failed"}`);
  console.log(`${report.checkedRuleCount}/${report.ruleCount} verified rules checked across ${report.caseCount} cases.`);
  for (const item of report.evaluations) {
    console.log(`[${item.passed ? "pass" : "fail"}] ${item.caseId}/${item.ruleId}: ${item.description}`);
    if (!item.passed) console.log(`  ${item.reason ?? item.violatingFiles.join(", ")}`);
  }
  if (report.skippedCaseIds.length) console.log(`Unverified cases: ${report.skippedCaseIds.join(", ")}. Run spine replay <case-id>.`);
  if (!report.ruleCount) console.log("No verified guardrails. Start with spine demo or spine learn --case failure.json.");
}

export const demoCommand = defineCommand({
  meta: { name: "demo", description: "Run the complete learning loop in a new offline Git fixture." },
  args: {
    out: { type: "string", description: "New directory for the demo (must not exist); defaults to a temporary directory" },
    json: commonArgs.json,
  },
  async run({ args }) {
    const result = await runLearningDemo(args.out);
    if (args.json) json(result);
    else {
      console.log("Project Spine — learn from a failure, then catch its recurrence\n");
      console.log("[1/4] Recorded a candidate rule from a synthetic invoice-query correction.");
      console.log("[2/4] Replayed Git revisions: broken fails, corrected passes.");
      console.log("[3/4] Verified the corrected working tree and retrieved scoped context.");
      console.log("[4/4] Reintroduced the defect: guard caught it. Restored corrected fixture.\n");
      console.log(`Fixture: ${result.repo}\nReport:  ${result.reportPath}\n\n${result.limitation}`);
      console.log(`\nNext: spine guard --repo "${result.repo}"`);
    }
    if (!result.ok) process.exitCode = 1;
  },
});

export const learnCommand = defineCommand({
  meta: { name: "learn", description: "Record reviewed candidate guardrails, or retrieve GitHub PR evidence." },
  args: {
    ...commonArgs,
    case: { type: "string", description: "Reviewed failure-case JSON; paths are relative to --repo" },
    "from-pr": { type: "string", description: "GitHub PR URL; requires gh authentication; never infers broken/fixed revisions" },
  },
  async run({ args }) {
    if (!args.case && !args["from-pr"]) throw new Error("Provide --case failure.json or --from-pr https://github.com/owner/repo/pull/123.");
    const root = resolve(args.repo);
    const evidence = args["from-pr"] ? await fetchPullRequestEvidence(args["from-pr"]) : undefined;
    if (!args.case) {
      json({ evidence, next: "Review the evidence and create a failure-case JSON with explicit brokenRef/fixedRef and literal rules. Then run spine learn --case failure.json." });
      return;
    }
    const path = resolve(root, args.case);
    if (evidence) {
      if ((await stat(path)).size > 256 * 1024) throw new Error("Failure-case file is too large (256 KiB maximum).");
      const candidate = FailureCaseSchema.parse(JSON.parse(await readFile(path, "utf8")));
      if (candidate.source.kind !== "github" || candidate.source.url !== args["from-pr"]) {
        throw new Error("The reviewed case source must name the same GitHub PR URL as --from-pr.");
      }
    }
    const stored = await learnCase(root, path);
    if (args.json) json({ status: "candidate", stored, ...(evidence ? { evidence } : {}) });
    else console.log(`Recorded candidate ${stored.case.id}: ${stored.case.title}\nNo rule is active yet. Next: spine replay ${stored.case.id} --repo "${root}"`);
  },
});

export const replayCommand = defineCommand({
  meta: { name: "replay", description: "Prove candidate rules against broken and corrected Git revisions; activate only proven rules." },
  args: { ...commonArgs, id: { type: "positional", required: true, description: "Learning case id" } },
  async run({ args }) {
    const result = await replayCase(resolve(args.repo), args.id);
    if (args.json) json(result);
    else console.log(`Verified ${result.caseId}\nBroken: ${result.brokenSha} (rule violations reproduced)\nFixed:  ${result.fixedSha} (rules pass)\n${result.fixed.length} rule(s) now active. Next: spine guard\nHistorical literal checks only; no agent task was rerun.`);
  },
});

export const guardCommand = defineCommand({
  meta: { name: "guard", description: "Check verified guardrails. Exit 1: violation; exit 2: missing/unverified coverage." },
  args: {
    ...commonArgs,
    files: { type: "string", description: "Comma-separated repository-relative paths" },
    diff: { type: "string", description: "Check tracked paths changed since a Git revision (including staged/unstaged edits)" },
    case: { type: "string", description: "Limit enforcement to one learning case" },
  },
  async run({ args }) {
    if (args.files && args.diff) throw new Error("Choose --files or --diff, not both.");
    const root = resolve(args.repo);
    let files = args.files ? fileList(args.files) : undefined;
    if (args.diff) {
      const { stdout: sha } = await exec("git", ["rev-parse", "--verify", "--end-of-options", `${args.diff}^{commit}`], { cwd: root, timeout: 15_000, maxBuffer: 1024 * 1024 });
      const { stdout } = await exec("git", ["diff", "--name-only", "--no-renames", "-z", sha.trim(), "--"], { cwd: root, timeout: 15_000, maxBuffer: 2 * 1024 * 1024 });
      files = stdout.split("\0").filter(Boolean);
    }
    const report = await guardRepo(root, { ...(files ? { files } : {}), ...(args.case ? { caseId: args.case } : {}) });
    if (args.json) json(report); else printGuard(report);
    process.exitCode = guardExit(report);
  },
});

export const evaluateCommand = defineCommand({
  meta: { name: "evaluate", description: "Opt-in paired agent runs in temporary clones. Executes local programs; not an OS sandbox." },
  args: {
    ...commonArgs,
    id: { type: "positional", required: true, description: "Previously verified learning case id" },
    adapter: { type: "string", required: true, description: "Reviewed JSON containing agent and evaluator command argument arrays" },
    runs: { type: "string", default: "1", description: "Number of baseline/guarded pairs, 1–5" },
    "allow-execution": { type: "boolean", default: false, description: "Authorize the adapter's local program execution (may use network/model credits)" },
  },
  async run({ args }) {
    if (!args["allow-execution"]) throw new Error("Review the adapter first, then explicitly pass --allow-execution. Evaluation runs local programs without an OS sandbox and may incur model costs.");
    const report = await evaluateCase(resolve(args.repo), args.id, resolve(args.repo, args.adapter), { allowExecution: true, runs: Number(args.runs) });
    if (args.json) json(report);
    else {
      console.log(`Paired evaluation: ${report.caseId}\nBaseline: ${report.baselineSuccesses}/${report.runs} successful\nWith verified guidance: ${report.guardedSuccesses}/${report.runs} successful\n`);
      for (const limitation of report.limitations) console.log(limitation);
      console.log("Use --json to capture each attempt and its measured outcome. This evaluation does not activate rules.");
    }
  },
});

export const contextCommand = defineCommand({
  meta: { name: "context", description: "Retrieve only verified guidance relevant to specific files, with provenance." },
  args: { ...commonArgs, files: { type: "string", required: true, description: "Comma-separated repository-relative paths" } },
  async run({ args }) {
    const result = await contextForFiles(resolve(args.repo), fileList(args.files));
    if (args.json) json(result);
    else {
      console.log("# Verified repository guidance\n");
      if (!result.instructions.length) console.log("No verified guidance matches these paths.");
      for (const instruction of result.instructions) {
        console.log(`- ${instruction.description}\n  Rule: ${instruction.caseId}/${instruction.ruleId} (${instruction.kind})\n  Literal: ${JSON.stringify(instruction.text)}\n  Applies to: ${instruction.matchingFiles.join(", ")}\n  Evidence: ${instruction.provenance.url ?? instruction.provenance.title}\n  Verified correction: ${instruction.provenance.verification.fixedSha}\n`);
      }
      if (result.skippedCaseIds.length) console.log(`Unverified cases excluded: ${result.skippedCaseIds.join(", ")}`);
    }
  },
});

export const reportCommand = defineCommand({
  meta: { name: "report", description: "Inspect the evidence ledger or export an escaped HTML guard report." },
  args: {
    ...commonArgs,
    case: { type: "string", description: "Show complete provenance for a learning case" },
    format: { type: "string", default: "json", description: "json or html" },
    out: { type: "string", description: "New report file (will not overwrite an existing file)" },
  },
  async run({ args }) {
    if (!["json", "html"].includes(args.format)) throw new Error("Unsupported format. Use --format json or --format html.");
    if (args.case && args.format === "html") throw new Error("Case provenance uses JSON; omit --case for an HTML guard report.");
    const root = resolve(args.repo);
    const report = args.case ? await explainCase(root, args.case) : { cases: await listCases(root), guard: await guardRepo(root) };
    const output = args.format === "html"
      ? renderGuardReportHtml((report as { guard: GuardReport }).guard)
      : JSON.stringify(report, null, 2) + "\n";
    if (args.out) {
      const path = resolve(args.out);
      await writeFile(path, output, { encoding: "utf8", flag: "wx" });
      if (args.json) json({ path, format: args.format });
      else console.log(`Wrote ${path}`);
    } else process.stdout.write(output);
  },
});
