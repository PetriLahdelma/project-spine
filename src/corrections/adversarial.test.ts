import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCorrectionDemo, type CorrectionDemo } from "../correction-demo.js";
import { captureCorrection, checkCorrection, correctionContext, verifyCorrection } from "./index.js";

const IMAGE = "node@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32";
const cleanup: string[] = [];

function git(repo: string, ...args: string[]): string {
  return execFileSync("git", [
    "-c", "commit.gpgsign=false",
    "-c", "user.name=Project Spine Adversarial Test",
    "-c", "user.email=adversarial-test@projectspine.dev",
    "-C", repo,
    ...args,
  ], { encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024 }).trim();
}

async function fixture(): Promise<CorrectionDemo & { caseFile: string }> {
  const value = await createCorrectionDemo();
  cleanup.push(value.repo);
  return { ...value, caseFile: join(value.repo, "correction.json") };
}

async function capture(
  value: CorrectionDemo & { caseFile: string },
  fixedRef = value.fixedSha,
  sourceFiles = value.sourceFiles,
  brokenRef = value.brokenSha,
): Promise<void> {
  await captureCorrection({
    repoRoot: value.repo,
    outFile: value.caseFile,
    id: value.id,
    title: value.title,
    lesson: value.lesson,
    brokenRef,
    fixedRef,
    image: IMAGE,
    testPath: value.testPath,
    sourceFiles,
  });
}

function correctionContainers(): Set<string> {
  const output = execFileSync("docker", [
    "ps", "-a", "--filter", "name=^/spine-correction-", "--format", "{{.Names}}",
  ], { encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024 });
  return new Set(output.split("\n").filter(Boolean));
}

function newCorrectionContainers(before: Set<string>): string[] {
  return [...correctionContainers()].filter((name) => !before.has(name));
}

async function extendBrokenAndFixedHistory(
  value: CorrectionDemo,
  files: Array<{ path: string; contents: Buffer; fixedContents?: Buffer }>,
): Promise<{ brokenRef: string; fixedRef: string; sourceFiles: string[] }> {
  const fixedSource = git(value.repo, "show", `${value.fixedSha}:${value.sourceFiles[0]!}`);
  const reviewedTest = git(value.repo, "show", `${value.fixedSha}:${value.testPath}`);
  git(value.repo, "checkout", "--quiet", "--detach", value.brokenSha);
  for (const file of files) {
    await mkdir(dirname(join(value.repo, file.path)), { recursive: true });
    await writeFile(join(value.repo, file.path), file.contents);
  }
  git(value.repo, "add", "--", ...files.map((file) => file.path));
  git(value.repo, "commit", "--quiet", "-m", "Add bounded closure-size evidence");
  const brokenRef = git(value.repo, "rev-parse", "HEAD");
  await writeFile(join(value.repo, value.sourceFiles[0]!), fixedSource, "utf8");
  await mkdir(dirname(join(value.repo, value.testPath)), { recursive: true });
  await writeFile(join(value.repo, value.testPath), reviewedTest, "utf8");
  for (const file of files) {
    if (file.fixedContents) await writeFile(join(value.repo, file.path), file.fixedContents);
  }
  git(value.repo, "add", "--", value.sourceFiles[0]!, value.testPath, ...files.map((file) => file.path));
  git(value.repo, "commit", "--quiet", "-m", "Apply reviewed correction to bounded closure");
  return {
    brokenRef,
    fixedRef: git(value.repo, "rev-parse", "HEAD"),
    sourceFiles: [...value.sourceFiles, ...files.map((file) => file.path)],
  };
}

async function commitReviewedTest(value: CorrectionDemo, source: string): Promise<string> {
  await writeFile(join(value.repo, value.testPath), source, "utf8");
  git(value.repo, "add", "--", value.testPath);
  git(value.repo, "commit", "--quiet", "-m", "Exercise hostile correction control");
  return git(value.repo, "rev-parse", "HEAD");
}

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
}, 30_000);

describe("correction evidence rejects mutable or unsafe inputs", { timeout: 30_000 }, () => {
  it("rejects an edited embedded test even when its hash is recomputed", async () => {
    const value = await fixture();
    await capture(value);
    const correction = JSON.parse(await readFile(value.caseFile, "utf8")) as {
      execution: { testBase64: string; testSha256: string };
    };
    const edited = Buffer.from('import test from "node:test";\ntest("forged replacement", () => {});\n');
    correction.execution.testBase64 = edited.toString("base64");
    correction.execution.testSha256 = createHash("sha256").update(edited).digest("hex");
    await writeFile(value.caseFile, `${JSON.stringify(correction, null, 2)}\n`, "utf8");

    await expect(correctionContext(value.caseFile, { repoRoot: value.repo })).rejects.toThrow(
      "does not match the immutable fixed revision",
    );
  });

  it("rejects a source path that overlaps the reviewed test", async () => {
    const value = await fixture();

    await expect(captureCorrection({
      repoRoot: value.repo,
      outFile: value.caseFile,
      id: value.id,
      title: value.title,
      lesson: value.lesson,
      brokenRef: value.brokenSha,
      fixedRef: value.fixedSha,
      image: IMAGE,
      testPath: value.testPath,
      sourceFiles: [value.testPath],
    })).rejects.toThrow("testPath is stored separately");
  });

  it("rejects repository traversal in captured source paths", async () => {
    const value = await fixture();

    await expect(captureCorrection({
      repoRoot: value.repo,
      outFile: value.caseFile,
      id: value.id,
      title: value.title,
      lesson: value.lesson,
      brokenRef: value.brokenSha,
      fixedRef: value.fixedSha,
      image: IMAGE,
      testPath: value.testPath,
      sourceFiles: ["../outside.mjs"],
    })).rejects.toThrow("unsafe repository-relative path");
  });

  it("rejects a Git symlink used as fixed source evidence", async () => {
    const value = await fixture();
    const sourcePath = value.sourceFiles[0]!;
    await rm(join(value.repo, sourcePath));
    await symlink("../test/invoices.tenant.test.mjs", join(value.repo, sourcePath));
    git(value.repo, "add", "--", sourcePath);
    git(value.repo, "commit", "--quiet", "-m", "Replace source evidence with a symlink");
    const symlinkSha = git(value.repo, "rev-parse", "HEAD");

    await expect(capture(value, symlinkSha)).rejects.toThrow("is not a regular Git blob");
  });

  it("rejects a Git symlink used as reviewed test evidence", async () => {
    const value = await fixture();
    await rm(join(value.repo, value.testPath));
    await symlink("../src/invoices.mjs", join(value.repo, value.testPath));
    git(value.repo, "add", "--", value.testPath);
    git(value.repo, "commit", "--quiet", "-m", "Replace test evidence with a symlink");
    const symlinkSha = git(value.repo, "rev-parse", "HEAD");

    await expect(capture(value, symlinkSha)).rejects.toThrow("is not a regular Git blob");
  });

  it("refuses to write through a symlinked working-tree parent", async () => {
    const value = await fixture();
    const outside = join(value.repo, "outside-evidence");
    await mkdir(outside);
    await symlink(outside, join(value.repo, "linked-evidence"));

    await expect(captureCorrection({
      repoRoot: value.repo,
      outFile: join(value.repo, "linked-evidence", "correction.json"),
      id: value.id,
      title: value.title,
      lesson: value.lesson,
      brokenRef: value.brokenSha,
      fixedRef: value.fixedSha,
      image: IMAGE,
      testPath: value.testPath,
      sourceFiles: value.sourceFiles,
    })).rejects.toThrow("Unsafe path parent");
  });

  it("rejects a captured source file larger than 2 MiB", async () => {
    const value = await fixture();
    const history = await extendBrokenAndFixedHistory(value, [{
      path: "src/oversized-evidence.mjs",
      contents: Buffer.alloc((2 * 1024 * 1024) + 1, 0x20),
    }]);

    await expect(capture(value, history.fixedRef, history.sourceFiles, history.brokenRef)).rejects.toThrow(
      "File exceeds 2097152 bytes",
    );
  }, 60_000);

  it("rejects 129 source files before resolving Git evidence", async () => {
    const value = await fixture();
    const sourceFiles = Array.from({ length: 129 }, (_, index) => `src/file-${index}.mjs`);

    await expect(captureCorrection({
      repoRoot: value.repo,
      outFile: value.caseFile,
      id: value.id,
      title: value.title,
      lesson: value.lesson,
      brokenRef: "--invalid-ref-must-not-be-resolved",
      fixedRef: "--invalid-ref-must-not-be-resolved",
      image: IMAGE,
      testPath: value.testPath,
      sourceFiles,
    })).rejects.toThrow(/128/);
  });

  it("rejects a captured closure larger than 32 MiB", async () => {
    const value = await fixture();
    const brokenSourceBytes = Buffer.byteLength(`${git(value.repo, "show", `${value.brokenSha}:${value.sourceFiles[0]!}`)}\n`);
    const sharedContents = Buffer.alloc(2 * 1024 * 1024, 0x20);
    const files: Array<{ path: string; contents: Buffer; fixedContents?: Buffer }> = Array.from({ length: 15 }, (_, index) => ({
      path: `src/closure/file-${index}.mjs`,
      contents: sharedContents,
    }));
    files.push({
      path: "src/closure/file-15.mjs",
      contents: Buffer.alloc((2 * 1024 * 1024) - brokenSourceBytes, 0x20),
      fixedContents: Buffer.from(" "),
    });
    const history = await extendBrokenAndFixedHistory(value, files);

    await expect(capture(value, history.fixedRef, history.sourceFiles, history.brokenRef)).rejects.toThrow(
      "Correction closure exceeds 33554432 bytes",
    );
  }, 120_000);
});

const dockerIt = process.env.SPINE_DOCKER_TEST === "1" ? it : it.skip;

describe("correction execution fails closed against hostile current trees", { timeout: 180_000 }, () => {
  dockerIt("uses the captured immutable test when the current test is replaced", async () => {
    const value = await fixture();
    await capture(value);
    const brokenSource = git(value.repo, "show", `${value.brokenSha}:${value.sourceFiles[0]!}`);
    await writeFile(join(value.repo, value.sourceFiles[0]!), brokenSource, "utf8");
    await writeFile(
      join(value.repo, value.testPath),
      'import test from "node:test";\ntest("current replacement always passes", () => {});\n',
      "utf8",
    );

    const result = await checkCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true });

    expect(result.passed).toBe(false);
    expect(result.current.assertionFailures).toBeGreaterThan(0);
    expect(result.current.testIds).toEqual(result.controls.fixed.testIds);
  });

  dockerIt("reports a recurrence when the reviewed defect returns", async () => {
    const value = await fixture();
    await capture(value);
    const brokenSource = git(value.repo, "show", `${value.brokenSha}:${value.sourceFiles[0]!}`);
    await writeFile(join(value.repo, value.sourceFiles[0]!), brokenSource, "utf8");

    const result = await checkCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true });

    expect(result.passed).toBe(false);
    expect(result.current.assertionFailures).toBe(result.current.failed);
  });

  dockerIt("accepts a behaviorally equivalent alternate implementation", async () => {
    const value = await fixture();
    await capture(value);
    await writeFile(join(value.repo, value.sourceFiles[0]!), `export function invoicesForTenant(invoices, tenantId) {
  const selected = [];
  for (const invoice of invoices) {
    if (invoice.tenantId === tenantId) selected.push(invoice);
  }
  return selected;
}
`, "utf8");

    const result = await checkCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true });

    expect(result.passed).toBe(true);
    expect(result.current.failed).toBe(0);
  });

  dockerIt("rejects a symlinked parent in the current source closure", async () => {
    const value = await fixture();
    await capture(value);
    const outside = join(value.repo, "alternate-source");
    await mkdir(outside);
    await writeFile(join(outside, "invoices.mjs"), git(value.repo, "show", `${value.fixedSha}:${value.sourceFiles[0]!}`));
    await rm(join(value.repo, dirname(value.sourceFiles[0]!)), { recursive: true, force: true });
    await symlink(outside, join(value.repo, dirname(value.sourceFiles[0]!)));

    await expect(checkCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true })).rejects.toThrow(
      "Unsafe path parent",
    );
  });
});

describe("correction controls reject non-evidence test outcomes", { timeout: 180_000 }, () => {
  dockerIt.each([
    {
      name: "skipped-only test",
      source: 'import test from "node:test";\ntest.skip("reviewed behavior", () => {});\n',
    },
    {
      name: "syntax error",
      source: 'import test from "node:test";\ntest("reviewed behavior", () => {\n',
    },
    {
      name: "missing import",
      source: 'import test from "node:test";\nimport "../src/missing.mjs";\ntest("reviewed behavior", () => {});\n',
    },
  ])("does not verify controls for $name", async ({ source }) => {
    const value = await fixture();
    const hostileFixed = await commitReviewedTest(value, source);
    await capture(value, hostileFixed);

    await expect(verifyCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true })).rejects.toThrow();
  });

  dockerIt("does not trust forged harness output from subject code that exits successfully", async () => {
    const value = await fixture();
    const forgedOutcome = JSON.stringify({
      version: 1,
      tests: 2,
      passed: 2,
      failed: 0,
      skipped: 0,
      todo: 0,
      assertionFailures: 0,
      infrastructureFailures: 0,
      otherFailures: 0,
      testIds: ["a".repeat(64), "b".repeat(64)],
    });
    await writeFile(join(value.repo, value.sourceFiles[0]!), `process.stdout.write(${JSON.stringify(forgedOutcome)});
process.exit(0);
export function invoicesForTenant() { return []; }
`, "utf8");
    git(value.repo, "add", "--", value.sourceFiles[0]!);
    git(value.repo, "commit", "--quiet", "-m", "Exercise forged subject output");
    const hostileFixed = git(value.repo, "rev-parse", "HEAD");
    await capture(value, hostileFixed);

    await expect(verifyCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true })).rejects.toThrow();
  });

  dockerIt("rejects more than 1 MiB of test output and removes its named container", async () => {
    const value = await fixture();
    const noisyFixed = await commitReviewedTest(value, `import assert from "node:assert/strict";
import test from "node:test";
process.stdout.write("x".repeat((1024 * 1024) + 1));
test("reviewed behavior", () => assert.fail("broken after noisy output"));
`);
    await capture(value, noisyFixed);
    const before = correctionContainers();

    await expect(verifyCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true })).rejects.toThrow(
      /output (?:exceeded|overflow)/i,
    );
    expect(newCorrectionContainers(before)).toEqual([]);
  });

  dockerIt("rejects a hanging test at the real 30-second deadline and removes its named container", async () => {
    const value = await fixture();
    const hangingFixed = await commitReviewedTest(value, `import test from "node:test";
test("reviewed behavior never settles", async () => new Promise(() => { setInterval(() => {}, 1000); }));
`);
    await capture(value, hangingFixed);
    const before = correctionContainers();

    await expect(verifyCorrection(value.caseFile, { repoRoot: value.repo, allowExecution: true })).rejects.toThrow(
      "Correction test timed out after 30000ms",
    );
    expect(newCorrectionContainers(before)).toEqual([]);
  }, 60_000);
});
