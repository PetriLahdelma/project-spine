import { defineCommand } from "citty";
import { join, resolve } from "node:path";
import { captureCorrection, checkCorrection, correctionContext, verifyCorrection } from "../corrections/index.js";
import { createCorrectionDemo } from "../correction-demo.js";

function json(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function paths(value: string, label: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} must be a JSON array of exact repository-relative paths`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every((item) => typeof item === "string" && item.length > 0)) {
    throw new Error(`${label} must be a non-empty JSON array of exact repository-relative paths`);
  }
  return parsed;
}

const common = {
  repo: { type: "string" as const, default: ".", description: "Git repository root" },
  json: { type: "boolean" as const, default: false, description: "Emit structured JSON" },
};

const capture = defineCommand({
  meta: { name: "capture", description: "Capture a reviewer-approved node:test regression from an immutable fixed commit without executing it." },
  args: {
    ...common,
    id: { type: "string", required: true, description: "Portable correction id" },
    title: { type: "string", required: true, description: "Short correction title" },
    lesson: { type: "string", required: true, description: "Guidance learned from the correction" },
    broken: { type: "string", required: true, description: "Broken commit or ref" },
    fixed: { type: "string", required: true, description: "Fixed commit or ref" },
    image: { type: "string", required: true, description: "Immutable Docker image, including @sha256 digest" },
    test: { type: "string", required: true, description: "Reviewed node:test path at the fixed commit" },
    "files-json": { type: "string", required: true, description: "JSON array containing the exact source-file closure" },
    out: { type: "string", required: true, description: "New portable correction-case JSON file" },
    "from-pr": { type: "string", description: "Optional source pull-request URL; stored as provenance only" },
  },
  async run({ args }) {
    const root = resolve(args.repo);
    const correction = await captureCorrection({
      repoRoot: root,
      outFile: resolve(root, args.out),
      id: args.id,
      title: args.title,
      lesson: args.lesson,
      brokenRef: args.broken,
      fixedRef: args.fixed,
      image: args.image,
      testPath: args.test,
      sourceFiles: paths(args["files-json"], "--files-json"),
      ...(args["from-pr"] ? { sourceUrl: args["from-pr"] } : {}),
    });
    if (args.json) json(correction);
    else console.log(`Captured candidate correction ${correction.id}. No repository code or test was executed.\nNext: spine correction verify --case ${args.out} --allow-execution`);
  },
});

const verify = defineCommand({
  meta: { name: "verify", description: "Replay the reviewed test against broken and fixed snapshots in constrained Docker." },
  args: {
    ...common,
    case: { type: "string", required: true, description: "Portable correction-case JSON file" },
    "allow-execution": { type: "boolean", default: false, description: "Explicitly allow constrained Docker test execution" },
  },
  async run({ args }) {
    const root = resolve(args.repo);
    const report = await verifyCorrection(resolve(root, args.case), { repoRoot: root, allowExecution: args["allow-execution"] });
    json(report);
  },
});

const check = defineCommand({
  meta: { name: "check", description: "Revalidate historical controls, then run the reviewed test against the current exact file closure." },
  args: {
    ...common,
    case: { type: "string", required: true, description: "Portable correction-case JSON file" },
    "allow-execution": { type: "boolean", default: false, description: "Explicitly allow constrained Docker test execution" },
  },
  async run({ args }) {
    const root = resolve(args.repo);
    const report = await checkCorrection(resolve(root, args.case), { repoRoot: root, allowExecution: args["allow-execution"] });
    json(report);
    if (!report.passed) process.exitCode = 1;
  },
});

const context = defineCommand({
  meta: { name: "context", description: "Read candidate correction guidance without Docker or test execution." },
  args: {
    ...common,
    case: { type: "string", required: true, description: "Portable correction-case JSON file" },
    "files-json": { type: "string", description: "Optional JSON array of exact paths used to filter guidance" },
  },
  async run({ args }) {
    const root = resolve(args.repo);
    const result = await correctionContext(resolve(root, args.case), {
      repoRoot: root,
      ...(args["files-json"] ? { files: paths(args["files-json"], "--files-json") } : {}),
    });
    if (args.json) json(result);
    else if (!result.matched) console.log("No correction guidance matches the requested files.");
    else console.log(`${result.status.toUpperCase()}: ${result.title}\n${result.lesson}\nFiles: ${result.files.join(", ")}\n${result.warning ?? ""}`);
  },
});

const demo = defineCommand({
  meta: { name: "demo", description: "Create a synthetic correction, verify its controls, and check the fixed tree." },
  args: {
    out: { type: "string", description: "New directory for the synthetic repository" },
    image: { type: "string", required: true, description: "Locally available immutable Docker image with @sha256 digest" },
    "allow-execution": { type: "boolean", default: false, description: "Explicitly allow constrained Docker test execution" },
    json: common.json,
  },
  async run({ args }) {
    if (!args["allow-execution"]) throw new Error("Correction demo requires explicit --allow-execution");
    const fixture = await createCorrectionDemo(args.out);
    const caseFile = join(fixture.repo, "correction.json");
    const correction = await captureCorrection({
      repoRoot: fixture.repo,
      outFile: caseFile,
      id: fixture.id,
      title: fixture.title,
      lesson: fixture.lesson,
      brokenRef: fixture.brokenSha,
      fixedRef: fixture.fixedSha,
      image: args.image,
      testPath: fixture.testPath,
      sourceFiles: fixture.sourceFiles,
    });
    const verification = await verifyCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: true });
    const checkResult = await checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: true });
    const result = { repo: fixture.repo, caseFile, correction, verification, check: checkResult, limitation: fixture.limitation };
    if (args.json) json(result);
    else console.log(`Correction demo passed.\nRepository: ${fixture.repo}\nCase: ${caseFile}\nBroken assertions failed: ${verification.broken.assertionFailures}\nFixed/current checks passed: ${verification.fixed.passed}/${checkResult.current.passed}\n${fixture.limitation}`);
  },
});

export default defineCommand({
  meta: { name: "correction", description: "Capture and prove reviewer-approved executable regression evidence." },
  subCommands: { demo, capture, verify, check, context },
});
