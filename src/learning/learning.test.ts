import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  contextForFiles,
  explainCase,
  guardRepo,
  learnCase,
  listCases,
  renderGuardReportHtml,
  replayCase,
  type FailureCase,
} from "./index.js";

const tempRoots: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 15_000, maxBuffer: 8 * 1024 * 1024 }).trim();
}

async function createRepo(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "spine-learning-"));
  tempRoots.push(root);
  git(root, "init", "-q");
  git(root, "config", "user.name", "Spine Test");
  git(root, "config", "user.email", "spine@example.test");
  return root;
}

async function commitFile(root: string, path: string, contents: string, message: string): Promise<string> {
  await mkdir(join(root, path, ".."), { recursive: true });
  await writeFile(join(root, path), contents);
  git(root, "add", path);
  git(root, "commit", "-q", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function failureCase(overrides: Partial<FailureCase> = {}): FailureCase {
  return {
    version: 1,
    id: "tenant-guard",
    title: "Keep tenant checks in jobs",
    summary: "A background job bypassed tenant authorization.",
    source: { kind: "github", url: "https://github.com/example/repo/pull/42", revision: "review-1" },
    rules: [{
      id: "no-auth-bypass",
      description: "Do not bypass tenant authorization.",
      files: ["src/**/*.ts"],
      kind: "forbid-text",
      text: "BYPASS_AUTH",
    }],
    replay: { brokenRef: "HEAD~1", fixedRef: "HEAD" },
    ...overrides,
  };
}

async function writeCase(root: string, value: FailureCase, name = "failure.json"): Promise<string> {
  const path = join(root, name);
  await writeFile(path, JSON.stringify(value));
  return path;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
}, 30_000);

describe("learning engine", { timeout: 30_000 }, () => {
  it("learns immutable evidence, verifies a historical correction, then guards and routes context", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "export const mode = 'BYPASS_AUTH';\n", "broken");
    await commitFile(root, "src/job.ts", "export const mode = 'CHECK_AUTH';\n", "fixed");
    const input = failureCase();
    const caseFile = await writeCase(root, input);

    const stored = await learnCase(root, caseFile);
    expect(stored.case.id).toBe("tenant-guard");
    expect(stored.evidence.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(await listCases(root)).toMatchObject([{ id: "tenant-guard", status: "candidate" }]);

    const beforeReplay = await guardRepo(root);
    expect(beforeReplay).toMatchObject({ status: "unprotected", protected: false, passed: false, skippedCaseIds: ["tenant-guard"] });

    const replay = await replayCase(root, "tenant-guard");
    expect(replay.verified).toBe(true);
    expect(replay.broken[0]).toMatchObject({ passed: false, violatingFiles: ["src/job.ts"] });
    expect(replay.fixed[0]).toMatchObject({ passed: true });
    expect(await listCases(root)).toMatchObject([{ id: "tenant-guard", status: "verified" }]);

    const guarded = await guardRepo(root);
    expect(guarded).toMatchObject({ status: "passed", protected: true, passed: true, checkedFiles: ["src/job.ts"] });
    expect(guarded.evidence[0]).toMatchObject({ caseId: "tenant-guard", brokenSha: replay.brokenSha, fixedSha: replay.fixedSha });
    expect(renderGuardReportHtml(guarded)).toContain(replay.fixedSha);
    // The cap applies to unique files, not duplicate selections/coverage sources.
    expect((await guardRepo(root, { files: Array<string>(10_001).fill("src/job.ts") })).passed).toBe(true);
    const context = await contextForFiles(root, ["src/job.ts", "README.md"]);
    expect(context.instructions).toMatchObject([{
      caseId: "tenant-guard",
      ruleId: "no-auth-bypass",
      matchingFiles: ["src/job.ts"],
      provenance: { title: "Keep tenant checks in jobs", verification: { brokenSha: replay.brokenSha, fixedSha: replay.fixedSha } },
    }]);
    expect((await explainCase(root, "tenant-guard")).enforceable).toBe(true);

    await writeFile(join(root, "src/job.ts"), "export const mode = 'BYPASS_AUTH';\n");
    const failed = await guardRepo(root, { files: ["src/job.ts"] });
    expect(failed).toMatchObject({ status: "failed", passed: false });
    expect(failed.violations[0]).toMatchObject({ ruleId: "no-auth-bypass", violatingFiles: ["src/job.ts"] });
  });

  it("scopes diff guards and reports deleted matching files as uncovered", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    await replayCase(root, "tenant-guard");

    expect(await guardRepo(root, { files: ["README.md"] })).toMatchObject({ status: "unprotected", ruleCount: 0, passed: false });
    expect(await guardRepo(root, { files: ["src/deleted.ts"] })).toMatchObject({
      status: "uncovered",
      passed: false,
      uncoveredFiles: ["src/deleted.ts"],
    });
  });

  it("rejects replay evidence that passes by deleting the violating file", async () => {
    const root = await createRepo();
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src/a.ts"), "BYPASS_AUTH\n");
    await writeFile(join(root, "src/b.ts"), "CHECK_AUTH\n");
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "broken");
    await rm(join(root, "src/a.ts"));
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "delete failure");
    await learnCase(root, await writeCase(root, failureCase()));

    await expect(replayCase(root, "tenant-guard")).rejects.toThrow("deletes a violating file");
    expect(await listCases(root)).toMatchObject([{ status: "candidate" }]);
  });

  it("rejects missing-glob replay coverage and unsafe case input", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    const noCoverage = failureCase({ rules: [{
      id: "missing",
      description: "Must have evidence.",
      files: ["other/**/*.ts"],
      kind: "forbid-text",
      text: "BYPASS_AUTH",
    }] });
    await learnCase(root, await writeCase(root, noCoverage));
    await expect(replayCase(root, "tenant-guard")).rejects.toThrow("matching files must exist in both revisions");

    const unsafe = failureCase({ id: "../escape" });
    await expect(learnCase(root, await writeCase(root, unsafe, "unsafe.json"))).rejects.toThrow("Invalid learning case");

    const outside = await mkdtemp(join(tmpdir(), "spine-learning-outside-"));
    tempRoots.push(outside);
    const outsideCase = await writeCase(outside, failureCase(), "outside.json");
    const linkedCase = join(root, "linked-case.json");
    await symlink(outsideCase, linkedCase);
    await expect(learnCase(root, linkedCase)).rejects.toThrow("must stay inside the repository");
  });

  it("will not enforce evidence after its stored case is tampered", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    await replayCase(root, "tenant-guard");

    const storedPath = join(root, ".project-spine/learning/cases/tenant-guard.json");
    const raw = JSON.parse(await readFile(storedPath, "utf8")) as { case: FailureCase };
    raw.case.rules[0]!.text = "DIFFERENT_RULE";
    await writeFile(storedPath, JSON.stringify(raw));

    expect(await guardRepo(root)).toMatchObject({ status: "unprotected", passed: false, skippedCaseIds: ["tenant-guard"] });
    expect(await listCases(root)).toMatchObject([{ status: "invalid" }]);
  });

  it("refuses to overwrite a different case with the same id and escapes HTML reports", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    const changed = failureCase({ title: "Changed meaning" });
    await expect(learnCase(root, await writeCase(root, changed, "changed.json"))).rejects.toThrow("Refusing to overwrite different learning case");

    await replayCase(root, "tenant-guard");
    const report = await guardRepo(root);
    report.evaluations[0]!.description = '<script>alert("x")</script>';
    report.skippedCaseIds = ["<untrusted-case>"];
    report.uncoveredFiles = ["src/a&b.ts"];
    const html = renderGuardReportHtml(report);
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;untrusted-case&gt;");
    expect(html).toContain("src/a&amp;b.ts");
    expect(html).toContain(`<h1>${report.status}</h1>`);
    expect(html).not.toContain("<script>");
  });

  it("requires the literal in every matched file for require-text rules", async () => {
    const root = await createRepo();
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src/a.ts"), "export const a = 1;\n");
    await writeFile(join(root, "src/b.ts"), "export const b = 2;\n");
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "missing ownership markers");
    await writeFile(join(root, "src/a.ts"), "// OWNER: platform\nexport const a = 1;\n");
    await writeFile(join(root, "src/b.ts"), "// OWNER: platform\nexport const b = 2;\n");
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "add ownership markers");
    const required = failureCase({
      id: "ownership-marker",
      title: "Keep ownership visible",
      rules: [{
        id: "require-owner",
        description: "Every source file carries an owner marker.",
        files: ["src/*.ts"],
        kind: "require-text",
        text: "OWNER: platform",
      }],
    });
    await learnCase(root, await writeCase(root, required));
    await replayCase(root, "ownership-marker");

    await writeFile(join(root, "src/b.ts"), "export const b = 2;\n");
    const report = await guardRepo(root);
    expect(report.status).toBe("failed");
    expect(report.violations[0]).toMatchObject({ ruleId: "require-owner", violatingFiles: ["src/b.ts"] });
  });

  it("rejects a symlinked evidence directory without writing outside the repository", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    const outside = await mkdtemp(join(tmpdir(), "spine-evidence-outside-"));
    tempRoots.push(outside);
    const sentinel = join(outside, "sentinel.txt");
    await writeFile(sentinel, "keep me");
    await symlink(outside, join(root, ".project-spine"));

    await expect(learnCase(root, await writeCase(root, failureCase()))).rejects.toThrow("Unsafe learning evidence directory");
    expect(await readFile(sentinel, "utf8")).toBe("keep me");
    expect(await readFile(join(root, ".project-spine/sentinel.txt"), "utf8")).toBe("keep me");
  });

  it("refuses a symlinked verification file and preserves its target", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    const outside = await mkdtemp(join(tmpdir(), "spine-verification-outside-"));
    tempRoots.push(outside);
    const sentinel = join(outside, "sentinel.json");
    await writeFile(sentinel, "do not replace");
    const verificationDir = join(root, ".project-spine/learning/verifications");
    await mkdir(verificationDir, { recursive: true });
    await symlink(sentinel, join(verificationDir, "tenant-guard.json"));

    await expect(replayCase(root, "tenant-guard")).rejects.toThrow("Unsafe learning verification file");
    expect(await readFile(sentinel, "utf8")).toBe("do not replace");
  });

  it("marks an applicable working-tree symlink as uncovered", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    await replayCase(root, "tenant-guard");
    const outside = await mkdtemp(join(tmpdir(), "spine-working-outside-"));
    tempRoots.push(outside);
    const target = join(outside, "job.ts");
    await writeFile(target, "CHECK_AUTH\n");
    await rm(join(root, "src/job.ts"));
    await symlink(target, join(root, "src/job.ts"));

    const report = await guardRepo(root);
    expect(report).toMatchObject({ status: "uncovered", passed: false, uncoveredFiles: ["src/job.ts"] });
  });

  it("marks a historically covered file deleted from a full scan as uncovered", async () => {
    const root = await createRepo();
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src/a.ts"), "BYPASS_AUTH\n");
    await writeFile(join(root, "src/b.ts"), "CHECK_AUTH\n");
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "broken");
    await writeFile(join(root, "src/a.ts"), "CHECK_AUTH\n");
    git(root, "add", "src/a.ts");
    git(root, "commit", "-q", "-m", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    await replayCase(root, "tenant-guard");
    await rm(join(root, "src/a.ts"));

    const report = await guardRepo(root);
    expect(report).toMatchObject({ status: "uncovered", passed: false, uncoveredFiles: ["src/a.ts"] });
    expect(report.checkedFiles).toContain("src/b.ts");
  });

  it("marks an explicit file below an internal directory symlink as uncovered", async () => {
    const root = await createRepo();
    await commitFile(root, "src/job.ts", "BYPASS_AUTH\n", "broken");
    await commitFile(root, "src/job.ts", "CHECK_AUTH\n", "fixed");
    await learnCase(root, await writeCase(root, failureCase()));
    await replayCase(root, "tenant-guard");
    const actualDirectory = join(root, "actual-src");
    await rename(join(root, "src"), actualDirectory);
    await symlink("actual-src", join(root, "src"));

    const report = await guardRepo(root, { files: ["src/job.ts"] });
    expect(report).toMatchObject({ status: "uncovered", passed: false, uncoveredFiles: ["src/job.ts"] });
  });

  it("does not accept a Git symlink blob as replay content", async () => {
    const root = await createRepo();
    await commitFile(root, "src/link.ts", "missing literal\n", "broken");
    await rm(join(root, "src/link.ts"));
    await symlink("required-literal", join(root, "src/link.ts"));
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "replace file with symlink");
    const linkCase = failureCase({
      id: "link-content",
      title: "Reject symlink content",
      rules: [{
        id: "require-literal",
        description: "Require a literal in a regular file.",
        files: ["src/link.ts"],
        kind: "require-text",
        text: "required-literal",
      }],
    });
    await learnCase(root, await writeCase(root, linkCase));

    await expect(replayCase(root, "link-content")).rejects.toThrow("matching files must exist in both revisions");
  });

  it("bounds repeated blob content by matched paths, not only unique Git objects", async () => {
    const root = await createRepo();
    await mkdir(join(root, "src"));
    const files = Array.from({ length: 17 }, (_, index) => join(root, `src/copy-${index}.ts`));
    const broken = "BYPASS_AUTH".padEnd(2 * 1024 * 1024, "x");
    for (const file of files) await writeFile(file, broken);
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "repeated broken blob");
    for (const file of files) await writeFile(file, "CHECK_AUTH");
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "fix repeated blob");
    await learnCase(root, await writeCase(root, failureCase()));
    await expect(replayCase(root, "tenant-guard")).rejects.toThrow("aggregate limit across matched paths");
  });

  it("batch reads many UTF-8 blobs using exact byte lengths", async () => {
    const root = await createRepo();
    await mkdir(join(root, "src"));
    for (let index = 0; index < 50; index += 1) {
      await writeFile(join(root, `src/file-${index}.ts`), `export const value${index} = "broken-å-${index}";\n`);
    }
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "broken unicode files");
    for (let index = 0; index < 50; index += 1) {
      await writeFile(join(root, `src/file-${index}.ts`), `// POLICY: ✓ π\nexport const value${index} = "fixed-å-${index}";\n`);
    }
    git(root, "add", "src");
    git(root, "commit", "-q", "-m", "fix unicode files");
    const unicodeCase = failureCase({
      id: "unicode-policy",
      title: "Keep policy markers",
      rules: [{
        id: "require-unicode-policy",
        description: "Every source file contains the UTF-8 policy marker.",
        files: ["src/*.ts"],
        kind: "require-text",
        text: "POLICY: ✓ π",
      }],
    });
    await learnCase(root, await writeCase(root, unicodeCase));

    const replay = await replayCase(root, "unicode-policy");
    expect(replay.fixed[0]).toMatchObject({ passed: true });
    expect(replay.fixed[0]!.matchedFiles).toHaveLength(50);
    expect(await guardRepo(root)).toMatchObject({ status: "passed", checkedFiles: expect.arrayContaining(["src/file-0.ts", "src/file-49.ts"]) });
  });
});
