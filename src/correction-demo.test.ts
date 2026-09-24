import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCorrectionDemo } from "./correction-demo.js";

const cleanup: string[] = [];

function git(repo: string, ...args: string[]): string {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    timeout: 15_000,
    maxBuffer: 1024 * 1024,
  }).trim();
}

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("createCorrectionDemo", () => {
  it("creates a ready behavioral correction manifest and leaves the fixed tree healthy", async () => {
    const fixture = await createCorrectionDemo();
    cleanup.push(fixture.repo);

    expect(fixture).toMatchObject({
      repo: expect.any(String),
      brokenSha: expect.stringMatching(/^[a-f0-9]{40}$/),
      fixedSha: expect.stringMatching(/^[a-f0-9]{40}$/),
      testPath: "test/invoices.tenant.test.mjs",
      sourceFiles: ["src/invoices.mjs"],
      title: "Keep invoice results scoped to the requested tenant",
      id: "tenant-invoice-scope",
    });
    expect(fixture.brokenSha).not.toBe(fixture.fixedSha);
    expect(fixture.lesson).toMatch(/behavior test/i);
    expect(fixture.limitation).toMatch(/Synthetic correction fixture/);
    expect(fixture.limitation).toMatch(/not evidence of model performance/);
    expect(git(fixture.repo, "rev-parse", "HEAD")).toBe(fixture.fixedSha);
    expect(git(fixture.repo, "status", "--short")).toBe("");

    const currentSource = await readFile(join(fixture.repo, fixture.sourceFiles[0]!), "utf8");
    const currentTest = await readFile(join(fixture.repo, fixture.testPath), "utf8");
    expect(currentSource).toContain("invoice.tenantId === tenantId");
    expect(currentSource).not.toContain("WHERE tenant_id");
    expect(currentTest).toContain('test("returns only invoices for the requested tenant"');
    expect(currentTest).toContain('test("returns an empty result for an empty invoice collection"');

    expect(() => execFileSync(process.execPath, ["--test", fixture.testPath], {
      cwd: fixture.repo,
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
    })).not.toThrow();
  });

  it("keeps reviewed test bytes at the fixed revision while the broken source reproduces the behavior", async () => {
    const fixture = await createCorrectionDemo();
    cleanup.push(fixture.repo);

    const brokenTree = git(fixture.repo, "ls-tree", "-r", "--name-only", fixture.brokenSha).split("\n").filter(Boolean);
    const fixedTree = git(fixture.repo, "ls-tree", "-r", "--name-only", fixture.fixedSha).split("\n").filter(Boolean);
    expect(brokenTree).toContain(fixture.sourceFiles[0]);
    expect(brokenTree).not.toContain(fixture.testPath);
    expect(fixedTree).toEqual(expect.arrayContaining([fixture.sourceFiles[0], fixture.testPath]));

    const brokenSource = git(fixture.repo, "show", `${fixture.brokenSha}:${fixture.sourceFiles[0]}`);
    const fixedSource = git(fixture.repo, "show", `${fixture.fixedSha}:${fixture.sourceFiles[0]}`);
    const testAtFix = git(fixture.repo, "show", `${fixture.fixedSha}:${fixture.testPath}`);
    expect(brokenSource).toContain("return invoices;");
    expect(brokenSource).not.toContain("invoice.tenantId === tenantId");
    expect(fixedSource).toContain("invoice.tenantId === tenantId");
    expect(testAtFix).toContain("assert.deepEqual");
    expect(testAtFix).toContain("returns an empty result for an empty invoice collection");
  });

  it("refuses to overwrite a user-selected directory, including an empty one", async () => {
    const parent = await mkdtemp(join(tmpdir(), "spine-correction-demo-parent-"));
    cleanup.push(parent);
    const destination = join(parent, "fixture");
    const first = await createCorrectionDemo(destination);
    expect(first.repo).toBe(destination);
    await access(join(destination, first.testPath));

    await expect(createCorrectionDemo(destination)).rejects.toMatchObject({ code: "EEXIST" });
    expect(git(destination, "rev-parse", "HEAD")).toBe(first.fixedSha);
    expect(git(destination, "status", "--short")).toBe("");
  });
});
