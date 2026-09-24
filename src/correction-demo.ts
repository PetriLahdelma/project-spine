import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { resolveTrustedExecutable, scrubbedGitEnvironment } from "./corrections/executable.js";

const exec = promisify(execFile);

const SOURCE_PATH = "src/invoices.mjs";
const TEST_PATH = "test/invoices.tenant.test.mjs";

const brokenSource = `export function invoicesForTenant(invoices, tenantId) {
  return invoices;
}
`;

const fixedSource = `export function invoicesForTenant(invoices, tenantId) {
  return invoices.filter((invoice) => invoice.tenantId === tenantId);
}
`;

const reviewedTest = `import assert from "node:assert/strict";
import test from "node:test";
import { invoicesForTenant } from "../src/invoices.mjs";

test("returns only invoices for the requested tenant", () => {
  const invoices = [
    { id: "invoice-a1", tenantId: "tenant-a", amount: 1200 },
    { id: "invoice-b1", tenantId: "tenant-b", amount: 800 },
    { id: "invoice-a2", tenantId: "tenant-a", amount: 450 },
  ];

  assert.deepEqual(invoicesForTenant(invoices, "tenant-a"), [
    { id: "invoice-a1", tenantId: "tenant-a", amount: 1200 },
    { id: "invoice-a2", tenantId: "tenant-a", amount: 450 },
  ]);
});

test("returns an empty result for an empty invoice collection", () => {
  assert.deepEqual(invoicesForTenant([], "tenant-a"), []);
});
`;

export interface CorrectionDemo {
  repo: string;
  brokenSha: string;
  fixedSha: string;
  testPath: string;
  sourceFiles: string[];
  title: string;
  lesson: string;
  id: string;
  limitation: string;
}

/**
 * Creates a synthetic two-commit correction fixture for later capture and replay.
 * The helper does not execute the fixture or invoke Docker.
 */
export async function createCorrectionDemo(output?: string): Promise<CorrectionDemo> {
  const repo = output ? resolve(output) : await mkdtemp(join(tmpdir(), "spine-correction-demo-"));
  if (output) await mkdir(repo); // An explicit destination must be new, including when an existing directory is empty.

  const hooks = join(repo, ".empty-hooks");
  await mkdir(hooks);
  await mkdir(join(repo, dirname(SOURCE_PATH)), { recursive: true });
  const gitExecutable = await resolveTrustedExecutable("git", [repo, process.cwd()]);
  const git = async (...args: string[]) => (await exec(
    gitExecutable,
    [
      "-c", `core.hooksPath=${hooks}`,
      "-c", "commit.gpgsign=false",
      "-c", "user.name=Project Spine Demo",
      "-c", "user.email=demo@projectspine.dev",
      ...args,
    ],
    { cwd: repo, encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024, env: scrubbedGitEnvironment() },
  )).stdout.trim();

  await git("init", "--quiet", "--initial-branch=main", `--template=${hooks}`);
  await writeFile(join(repo, SOURCE_PATH), brokenSource, "utf8");
  await git("add", "--", SOURCE_PATH);
  await git(
    "commit",
    "--quiet",
    "-m", "Preserve a reproducible tenant-isolation failure",
    "-m", "The synthetic history gives correction replay a known behavioral failure without using customer code.\n\nConstraint: The reviewed test is introduced only with the correction\nConfidence: high\nScope-risk: narrow\nNot-tested: Fixture generation does not execute repository code",
  );
  const brokenSha = await git("rev-parse", "HEAD");

  await mkdir(join(repo, dirname(TEST_PATH)), { recursive: true });
  await writeFile(join(repo, SOURCE_PATH), fixedSource, "utf8");
  await writeFile(join(repo, TEST_PATH), reviewedTest, "utf8");
  await git("add", "--", SOURCE_PATH, TEST_PATH);
  await git(
    "commit",
    "--quiet",
    "-m", "Prevent invoices from escaping the requested tenant scope",
    "-m", "The correction filters returned invoices and records the reviewed behavior as a dependency-free node:test regression.\n\nConstraint: The fixture must run without package installation or network access\nConfidence: high\nScope-risk: narrow\nNot-tested: Fixture generation does not execute repository code",
  );
  const fixedSha = await git("rev-parse", "HEAD");

  return {
    repo,
    brokenSha,
    fixedSha,
    testPath: TEST_PATH,
    sourceFiles: [SOURCE_PATH],
    title: "Keep invoice results scoped to the requested tenant",
    lesson: "A reviewed behavior test catches cross-tenant invoice leakage without relying on a particular query or source-code literal.",
    id: "tenant-invoice-scope",
    limitation: "Synthetic correction fixture only. It does not run an AI model and is not evidence of model performance or production security.",
  };
}
