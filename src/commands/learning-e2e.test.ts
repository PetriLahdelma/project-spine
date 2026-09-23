import { afterEach, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const exec = promisify(execFile);
const cli = resolve("dist/cli.js");
const dirs: string[] = [];
async function run(...args: string[]) {
  try {
    const result = await exec(process.execPath, [cli, ...args], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
    return { ...result, code: 0 };
  } catch (error) {
    const failure = error as Error & { code: number; stdout: string; stderr: string };
    return { code: failure.code, stdout: failure.stdout, stderr: failure.stderr };
  }
}
afterEach(async () => { for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true }); });

describe("learning CLI", () => {
  it("runs the offline demo, exposes provenance, and gates recurrence across the built CLI", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spine-cli-learning-")); dirs.push(dir);
    const repo = join(dir, "fixture");
    const demo = await run("demo", "--out", repo, "--json");
    expect(demo.code, demo.stderr).toBe(0);
    const result = JSON.parse(demo.stdout);
    expect(result.ok).toBe(true);
    expect(result.fixture).toBe(true);
    expect(result.recurrence.passed).toBe(false);
    expect(result.corrected.passed).toBe(true);
    const guard = await run("guard", "--repo", repo, "--json");
    expect(guard.code, guard.stderr).toBe(0);
    const context = await run("context", "--repo", repo, "--files", "src/invoices.js", "--json");
    expect(JSON.parse(context.stdout).instructions[0].provenance.verification.fixedSha).toHaveLength(40);
    const explain = await run("report", "--repo", repo, "--case", "tenant-query");
    expect(JSON.parse(explain.stdout).enforceable).toBe(true);
    const reportPath = join(dir, "report.html");
    expect((await run("report", "--repo", repo, "--format", "html", "--out", reportPath)).code).toBe(0);
    expect(await readFile(reportPath, "utf8")).toContain("tenant-filter");
    expect((await run("report", "--repo", repo, "--format", "html", "--out", reportPath)).code).toBe(1);
    await writeFile(join(repo, "src/invoices.js"), "export const query = 'SELECT * FROM invoices';\n");
    const regression = await run("guard", "--repo", repo, "--diff", "HEAD", "--json");
    expect(regression.code).toBe(1);
    expect(JSON.parse(regression.stdout).violations).toHaveLength(1);
    expect((await run("guard", "--repo", repo, "--files", "README.md", "--json")).code).toBe(2);
    expect((await run("demo", "--out", repo, "--json")).code).toBe(1);
    expect((await run("context", "--repo", repo, "--files", "../secret", "--json")).code).toBe(1);
  }, 45_000);

  it("does not present an empty or candidate-only ledger as a passing gate", async () => {
    const repo = await mkdtemp(join(tmpdir(), "spine-cli-empty-")); dirs.push(repo);
    const empty = await run("guard", "--repo", repo, "--json");
    expect(empty.code).toBe(2);
    expect(JSON.parse(empty.stdout).passed).toBe(false);
    expect((await run("learn", "--repo", repo)).code).toBe(1);
    expect((await run("guard", "--repo", repo, "--files", "a.ts", "--diff", "HEAD")).code).toBe(1);
    expect((await run("report", "--repo", repo, "--format", "xml")).code).toBe(1);
  });
});
