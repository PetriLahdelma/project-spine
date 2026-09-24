import { execFileSync } from "node:child_process";
import { access, chmod, lstat, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCorrectionDemo } from "../correction-demo.js";
import { captureCorrection, checkCorrection, correctionContext, verifyCorrection } from "./index.js";
import { CorrectionCaseSchema } from "./model.js";
import { buildDockerRunArgs, validateImageInspection } from "./docker.js";
import { materializeSnapshot, readCase, repoRoot } from "./files.js";

const cleanup: string[] = [];
const IMAGE = "node@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32";

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
}, 30_000);

describe("correction evidence", { timeout: 120_000 }, () => {
  it("captures immutable reviewed test bytes without execution and returns candidate context", async () => {
    const fixture = await createCorrectionDemo();
    cleanup.push(fixture.repo);
    const caseFile = join(fixture.repo, "correction.json");
    const correction = await captureCorrection({
      repoRoot: fixture.repo,
      outFile: caseFile,
      id: fixture.id,
      title: fixture.title,
      lesson: fixture.lesson,
      brokenRef: fixture.brokenSha,
      fixedRef: fixture.fixedSha,
      image: IMAGE,
      testPath: fixture.testPath,
      sourceFiles: fixture.sourceFiles,
      sourceUrl: "https://github.com/example/repo/pull/42",
    });

    expect(correction).toMatchObject({
      version: 1,
      revisions: { brokenSha: fixture.brokenSha, fixedSha: fixture.fixedSha },
      execution: { image: IMAGE, testPath: fixture.testPath },
      sourceFiles: fixture.sourceFiles,
    });
    const context = await correctionContext(caseFile, { repoRoot: fixture.repo, files: fixture.sourceFiles });
    expect(context).toMatchObject({ status: "candidate", lesson: fixture.lesson, files: fixture.sourceFiles });
    expect(context.matched).toBe(true);
    expect(context.warning).toMatch(/never trusted as activation/);
    await expect(verifyCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: false })).rejects.toThrow("--allow-execution");
    await expect(checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: false })).rejects.toThrow("--allow-execution");
    await expect(verifyCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: "false" as unknown as boolean })).rejects.toThrow("--allow-execution");
    await expect(checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: 1 as unknown as boolean })).rejects.toThrow("--allow-execution");

    const unrelated = await correctionContext(caseFile, { repoRoot: fixture.repo, files: ["src/unrelated.mjs"] });
    expect(unrelated).toMatchObject({ matched: false, lesson: "", files: [], warning: "No correction guidance matches the requested files." });
  });

  it("accepts spaces and commas in exact paths while rejecting overlap and traversal", () => {
    const base = {
      version: 1,
      id: "portable-paths",
      title: "Portable exact paths",
      lesson: "Keep identities exact.",
      source: { kind: "manual" },
      revisions: { brokenSha: "a".repeat(40), fixedSha: "b".repeat(40) },
      execution: {
        image: IMAGE,
        harnessSha256: "c".repeat(64),
        testPath: "test/reviewed test.mjs",
        testSha256: "d".repeat(64),
        testBase64: "YQ==",
      },
      sourceFiles: ["src/invoices, archived.mjs"],
    };
    expect(CorrectionCaseSchema.safeParse(base).success).toBe(true);
    expect(CorrectionCaseSchema.safeParse({ ...base, sourceFiles: ["test/reviewed test.mjs"] }).success).toBe(false);
    expect(CorrectionCaseSchema.safeParse({ ...base, sourceFiles: ["../secret.mjs"] }).success).toBe(false);
  });

  it("rejects repository-local git and docker executables without running them", async () => {
    const fixture = await createCorrectionDemo();
    cleanup.push(fixture.repo);
    const caseFile = join(fixture.repo, "correction.json");
    const fakeBin = join(fixture.repo, "fake-bin");
    const marker = join(fixture.repo, "executed-marker");
    await mkdir(fakeBin);
    for (const name of ["git", "docker"]) {
      await writeFile(join(fakeBin, name), `#!/bin/sh\ntouch ${JSON.stringify(marker)}\nexit 99\n`);
      await chmod(join(fakeBin, name), 0o755);
    }
    const originalPath = process.env.PATH;
    try {
      process.env.PATH = `${fakeBin}:${originalPath ?? ""}`;
      await expect(captureCorrection({
        repoRoot: fixture.repo, outFile: caseFile, id: fixture.id, title: fixture.title, lesson: fixture.lesson,
        brokenRef: fixture.brokenSha, fixedRef: fixture.fixedSha, image: IMAGE, testPath: fixture.testPath, sourceFiles: fixture.sourceFiles,
      })).rejects.toThrow("Refusing repository-local or node_modules git executable");
      await expect(access(marker)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      process.env.PATH = originalPath;
    }

    await rm(join(fakeBin, "git"));
    await captureCorrection({
      repoRoot: fixture.repo, outFile: caseFile, id: fixture.id, title: fixture.title, lesson: fixture.lesson,
      brokenRef: fixture.brokenSha, fixedRef: fixture.fixedSha, image: IMAGE, testPath: fixture.testPath, sourceFiles: fixture.sourceFiles,
    });
    try {
      process.env.PATH = `${fakeBin}:${originalPath ?? ""}`;
      await expect(checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: true })).rejects.toThrow("Refusing repository-local or node_modules docker executable");
      await expect(access(marker)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("rejects a caller-workspace git executable before creating a demo", async () => {
    const fakeBin = await mkdtemp(join(process.cwd(), ".spine-fake-bin-"));
    cleanup.push(fakeBin);
    const marker = join(fakeBin, "executed-marker");
    await writeFile(join(fakeBin, "git"), `#!/bin/sh\ntouch ${JSON.stringify(marker)}\nexit 99\n`);
    await chmod(join(fakeBin, "git"), 0o755);
    const originalPath = process.env.PATH;
    try {
      process.env.PATH = `${fakeBin}:${originalPath ?? ""}`;
      await expect(createCorrectionDemo()).rejects.toThrow("Refusing repository-local or node_modules git executable");
      await expect(access(marker)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it("keeps snapshot material private and rejects image-declared volumes", async () => {
    const fixture = await createCorrectionDemo();
    cleanup.push(fixture.repo);
    const caseFile = join(fixture.repo, "correction.json");
    await chmod(join(fixture.repo, fixture.sourceFiles[0]!), 0o755);
    execFileSync("git", ["-C", fixture.repo, "add", fixture.sourceFiles[0]!], { timeout: 15_000 });
    execFileSync("git", ["-C", fixture.repo, "-c", "user.name=Spine Test", "-c", "user.email=test@example.invalid", "commit", "-m", "Preserve executable source mode"], { timeout: 15_000 });
    const executableFixedSha = execFileSync("git", ["-C", fixture.repo, "rev-parse", "HEAD"], { encoding: "utf8", timeout: 15_000 }).trim();
    await captureCorrection({
      repoRoot: fixture.repo, outFile: caseFile, id: fixture.id, title: fixture.title, lesson: fixture.lesson,
      brokenRef: fixture.brokenSha, fixedRef: executableFixedSha, image: IMAGE, testPath: fixture.testPath, sourceFiles: fixture.sourceFiles,
    });
    const canonicalRoot = await repoRoot(fixture.repo);
    const correction = await readCase(join(canonicalRoot, "correction.json"), canonicalRoot);
    const snapshot = await materializeSnapshot(canonicalRoot, correction, "current");
    try {
      expect((await lstat(snapshot.directory)).mode & 0o077).toBe(0);
      expect((await lstat(join(snapshot.directory, fixture.sourceFiles[0]!))).mode & 0o777).toBe(0o700);
      expect((await lstat(join(snapshot.directory, fixture.testPath))).mode & 0o077).toBe(0);
    } finally {
      await snapshot.cleanup();
    }
    expect(() => validateImageInspection(IMAGE, {
      Id: `sha256:${"a".repeat(64)}`, RepoDigests: [IMAGE], Os: "linux", Architecture: "amd64", Config: { Volumes: { "/data": {} } },
    }, 1000, 1000)).toThrow("declares writable volumes");
    const args = buildDockerRunArgs({ image: IMAGE, snapshot: "/private/snapshot", testPath: "test/a.mjs", name: "case", harnessDirectory: "/private/harness", uid: 501, gid: 20 });
    expect(args).toEqual(expect.arrayContaining(["--pull=never", "--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--memory-swap=256m", "501:20"]));
  });

  const dockerIt = process.env.SPINE_DOCKER_TEST === "1" ? it : it.skip;
  dockerIt("proves broken and fixed controls and checks the current tree in constrained Docker", async () => {
    const fixture = await createCorrectionDemo();
    cleanup.push(fixture.repo);
    const caseFile = join(fixture.repo, "correction.json");
    await captureCorrection({
      repoRoot: fixture.repo,
      outFile: caseFile,
      id: fixture.id,
      title: fixture.title,
      lesson: fixture.lesson,
      brokenRef: fixture.brokenSha,
      fixedRef: fixture.fixedSha,
      image: IMAGE,
      testPath: fixture.testPath,
      sourceFiles: fixture.sourceFiles,
    });

    const result = await checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: true });
    expect(result).toMatchObject({
      passed: true,
      observational: true,
      controls: { verified: true, broken: { assertionFailures: expect.any(Number) }, fixed: { failed: 0 } },
      current: { failed: 0 },
      context: { status: "verified" },
    });
    expect(result.controls.broken.assertionFailures).toBeGreaterThan(0);
    expect(result.runtime.imageReference).toBe(IMAGE);
    expect(result.runtime.imageId).toMatch(/^sha256:/);
    expect(result.controls.broken.snapshot.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.controls.fixed.snapshot.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.current.snapshot.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.controls.fixed.snapshot.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: fixture.testPath, role: "test", bytes: expect.any(Number), mode: "100644" }),
      expect.objectContaining({ path: fixture.sourceFiles[0], role: "subject", bytes: expect.any(Number), mode: "100644" }),
    ]));

    await writeFile(join(fixture.repo, fixture.sourceFiles[0]!), `export function invoicesForTenant(invoices, tenantId) {
  const selected = [];
  for (const invoice of invoices) if (invoice.tenantId === tenantId) selected.push(invoice);
  return selected;
}\n`);
    const alternate = await checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: true });
    expect(alternate.passed).toBe(true);
    expect(alternate.controlHash).toBe(result.controlHash);
    expect(alternate.current.snapshot.snapshotHash).not.toBe(result.current.snapshot.snapshotHash);

    const brokenSource = execFileSync("git", ["-C", fixture.repo, "show", `${fixture.brokenSha}:${fixture.sourceFiles[0]}`], { encoding: "utf8", timeout: 15_000 });
    await writeFile(join(fixture.repo, fixture.sourceFiles[0]!), brokenSource);
    const recurrence = await checkCorrection(caseFile, { repoRoot: fixture.repo, allowExecution: true });
    expect(recurrence.passed).toBe(false);
    expect(recurrence.controlHash).toBe(result.controlHash);
    expect(recurrence.current.snapshot.snapshotHash).not.toBe(alternate.current.snapshot.snapshotHash);
    expect(new Set([result.checkHash, alternate.checkHash, recurrence.checkHash]).size).toBe(3);
  });
});
