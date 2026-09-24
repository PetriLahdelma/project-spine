import { Buffer } from "node:buffer";
import { CaptureCorrectionOptionsSchema, CorrectionCaseSchema, type CorrectionCase, type CorrectionCheck, type CorrectionContext, type CorrectionVerification } from "./model.js";
import { caseHash, gitBlob, gitSha, materializeSnapshot, MAX_TOTAL_BYTES, readCase, repoRoot, sha256, writeCase } from "./files.js";
import { assertBrokenControl, assertPassingOutcome, runNodeTestInDocker } from "./docker.js";
import { HARNESS_SHA256 } from "./harness.js";
import { stableStringify } from "../compiler/hash.js";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

export type CaptureCorrectionOptions = {
  repoRoot: string;
  outFile: string;
  id: string;
  title: string;
  lesson: string;
  brokenRef: string;
  fixedRef: string;
  image: string;
  testPath: string;
  sourceFiles: string[];
  sourceUrl?: string;
};

function contextFor(correction: CorrectionCase, status: "candidate" | "verified", files?: string[]): CorrectionContext {
  const selected = files ? correction.sourceFiles.filter((path) => files.includes(path)) : correction.sourceFiles;
  const matched = selected.length > 0;
  return {
    status,
    matched,
    caseId: correction.id,
    title: correction.title,
    lesson: matched ? correction.lesson : "",
    files: selected,
    provenance: { ...correction.source, ...correction.revisions },
    ...(status === "candidate" ? { warning: matched ? "Candidate guidance only. Verification receipts are observational and are never trusted as activation." : "No correction guidance matches the requested files." } : {}),
  };
}

function canonicalTarget(requestedRoot: string, canonicalRoot: string, target: string): string {
  const rel = relative(resolve(requestedRoot), resolve(target));
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`Path escapes repository: ${target}`);
  return join(canonicalRoot, rel);
}

export async function captureCorrection(options: CaptureCorrectionOptions): Promise<CorrectionCase> {
  const input = CaptureCorrectionOptionsSchema.parse({
    id: options.id, title: options.title, lesson: options.lesson, image: options.image,
    testPath: options.testPath, sourceFiles: options.sourceFiles, ...(options.sourceUrl ? { sourceUrl: options.sourceUrl } : {}),
  });
  const root = await repoRoot(options.repoRoot);
  const outFile = canonicalTarget(options.repoRoot, root, options.outFile);
  const [brokenSha, fixedSha] = await Promise.all([gitSha(root, options.brokenRef), gitSha(root, options.fixedRef)]);
  const test = await gitBlob(root, fixedSha, input.testPath);
  if (test.length === 0 || test.length > 256 * 1024) throw new Error("Correction test must be between 1 byte and 256 KiB");
  let brokenBytes = test.length;
  let fixedBytes = test.length;
  for (const path of input.sourceFiles) {
    const [broken, fixed] = await Promise.all([gitBlob(root, brokenSha, path), gitBlob(root, fixedSha, path)]);
    brokenBytes += broken.length;
    fixedBytes += fixed.length;
    if (brokenBytes > MAX_TOTAL_BYTES || fixedBytes > MAX_TOTAL_BYTES) throw new Error(`Correction closure exceeds ${MAX_TOTAL_BYTES} bytes`);
  }
  const correction = CorrectionCaseSchema.parse({
    version: 1,
    id: input.id,
    title: input.title,
    lesson: input.lesson,
    source: input.sourceUrl ? { kind: "github", url: input.sourceUrl } : { kind: "manual" },
    revisions: { brokenSha, fixedSha },
    execution: {
      image: input.image,
      harnessSha256: HARNESS_SHA256,
      testPath: input.testPath,
      testSha256: sha256(test),
      testBase64: test.toString("base64"),
    },
    sourceFiles: input.sourceFiles,
  });
  await writeCase(root, outFile, correction);
  return correction;
}

async function runRevision(root: string, correction: CorrectionCase, revision: string | "current", label: "broken" | "fixed" | "current") {
  const snapshot = await materializeSnapshot(root, correction, revision);
  try {
    const result = await runNodeTestInDocker({ image: correction.execution.image, snapshot: snapshot.directory, testPath: correction.execution.testPath, revision: label, forbiddenRoots: [root] });
    return { ...result, outcome: { ...result.outcome, snapshot: snapshot.manifest } };
  } finally {
    await snapshot.cleanup();
  }
}

function assertCurrentHarness(correction: CorrectionCase): void {
  if (correction.execution.harnessSha256 !== HARNESS_SHA256) throw new Error("Correction case targets a different immutable execution harness");
}

async function verifyLoaded(root: string, correction: CorrectionCase): Promise<CorrectionVerification> {
  assertCurrentHarness(correction);
  const brokenRun = await runRevision(root, correction, correction.revisions.brokenSha, "broken");
  assertBrokenControl(brokenRun.outcome);
  const fixedRun = await runRevision(root, correction, correction.revisions.fixedSha, "fixed");
  assertPassingOutcome(fixedRun.outcome, "Fixed control");
  if (stableStringify(brokenRun.runtime) !== stableStringify(fixedRun.runtime)) throw new Error("Correction controls ran with different container runtimes");
  if (stableStringify(brokenRun.outcome.testIds) !== stableStringify(fixedRun.outcome.testIds)) throw new Error("Broken and fixed controls did not execute the same named tests");
  const hash = caseHash(correction);
  return {
    version: 1,
    kind: "correction-verification",
    verified: true,
    observational: true,
    checkedAt: new Date().toISOString(),
    caseHash: hash,
    testHash: correction.execution.testSha256,
    runtime: brokenRun.runtime,
    controlHash: sha256(stableStringify({ caseHash: hash, runtime: brokenRun.runtime, broken: brokenRun.outcome, fixed: fixedRun.outcome })),
    broken: brokenRun.outcome,
    fixed: fixedRun.outcome,
    context: contextFor(correction, "verified"),
  };
}

export async function verifyCorrection(caseFile: string, options: { repoRoot: string; allowExecution: boolean }): Promise<CorrectionVerification> {
  if (options.allowExecution !== true) throw new Error("Correction verification requires explicit --allow-execution");
  const root = await repoRoot(options.repoRoot);
  const correction = await readCase(canonicalTarget(options.repoRoot, root, caseFile), root);
  return verifyLoaded(root, correction);
}

export async function checkCorrection(caseFile: string, options: { repoRoot: string; allowExecution: boolean }): Promise<CorrectionCheck> {
  if (options.allowExecution !== true) throw new Error("Correction check requires explicit --allow-execution");
  const root = await repoRoot(options.repoRoot);
  const canonicalCaseFile = canonicalTarget(options.repoRoot, root, caseFile);
  const correction = await readCase(canonicalCaseFile, root);
  const controls = await verifyLoaded(root, correction);
  const currentRun = await runRevision(root, correction, "current", "current");
  if (stableStringify(currentRun.runtime) !== stableStringify(controls.runtime)) throw new Error("Current check ran with a different container runtime");
  if (stableStringify(currentRun.outcome.testIds) !== stableStringify(controls.fixed.testIds)) throw new Error("Current check did not execute the same named tests as the controls");
  let passed: boolean;
  try {
    assertPassingOutcome(currentRun.outcome, "Current check");
    passed = true;
  } catch {
    // A current regression is a valid negative result only when it reproduces
    // the same class of reviewed assertion failure as the broken control.
    assertBrokenControl(currentRun.outcome);
    passed = false;
  }
  return {
    version: 1,
    kind: "correction-check",
    passed,
    observational: true,
    checkedAt: new Date().toISOString(),
    caseHash: controls.caseHash,
    testHash: controls.testHash,
    controlHash: controls.controlHash,
    checkHash: sha256(stableStringify({ caseHash: controls.caseHash, controlHash: controls.controlHash, runtime: controls.runtime, current: currentRun.outcome })),
    runtime: controls.runtime,
    controls,
    current: currentRun.outcome,
    context: contextFor(correction, "verified"),
  };
}

export async function correctionContext(caseFile: string, options: { repoRoot: string; files?: string[] }): Promise<CorrectionContext> {
  const root = await repoRoot(options.repoRoot);
  const correction = await readCase(canonicalTarget(options.repoRoot, root, caseFile), root);
  return contextFor(correction, "candidate", options.files);
}
