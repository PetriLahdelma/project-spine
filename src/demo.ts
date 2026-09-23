import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { learnCase, replayCase, guardRepo, contextForFiles, renderGuardReportHtml, type FailureCase } from "./learning/index.js";

const exec = promisify(execFile);
const broken = 'export function tenantQuery(tenantId) {\n  return db.query("SELECT * FROM invoices");\n}\n';
const fixed = 'export function tenantQuery(tenantId) {\n  return db.query("SELECT * FROM invoices WHERE tenant_id = ?", [tenantId]);\n}\n';

/** A real, offline Git fixture. No model calls or execution of fixture code. */
export async function runLearningDemo(output?: string) {
  const repo = output ? resolve(output) : await mkdtemp(join(tmpdir(), "spine-learning-demo-"));
  if (output) await mkdir(repo); // Refuse to overwrite even an empty existing directory.
  const hooks = join(repo, ".empty-hooks");
  await mkdir(hooks);
  await mkdir(join(repo, "src"));
  const git = async (...args: string[]) => (await exec("git", [
    "-c", `core.hooksPath=${hooks}`, "-c", "commit.gpgsign=false",
    "-c", "user.name=Project Spine Demo", "-c", "user.email=demo@projectspine.dev", ...args,
  ], { cwd: repo, timeout: 15_000, maxBuffer: 1024 * 1024 })).stdout.trim();
  await git("init", "--quiet", "--initial-branch=main", `--template=${hooks}`);
  await writeFile(join(repo, "src", "invoices.js"), broken, "utf8");
  await git("add", "src/invoices.js");
  await git("commit", "--quiet", "-m", "Demonstrate an unscoped invoice query");
  const brokenRef = await git("rev-parse", "HEAD");
  await writeFile(join(repo, "src", "invoices.js"), fixed, "utf8");
  await git("add", "src/invoices.js");
  await git("commit", "--quiet", "-m", "Scope the invoice query to its tenant");
  const fixedRef = await git("rev-parse", "HEAD");
  const failureCase: FailureCase = {
    version: 1, id: "tenant-query", title: "Preserve the tenant filter on invoice queries",
    summary: "Synthetic demonstration fixture. This literal guard catches the observed query; it does not prove authorization correctness.",
    source: { kind: "manual", revision: fixedRef },
    rules: [{ id: "tenant-filter", description: "Invoice queries must retain the observed tenant filter.", files: ["src/invoices.js"], kind: "require-text", text: "WHERE tenant_id = ?" }],
    replay: { brokenRef, fixedRef },
  };
  const caseFile = join(repo, "failure.json");
  await writeFile(caseFile, JSON.stringify(failureCase, null, 2) + "\n", "utf8");
  const candidate = await learnCase(repo, caseFile);
  const replay = await replayCase(repo, failureCase.id);
  const corrected = await guardRepo(repo);
  const context = await contextForFiles(repo, ["src/invoices.js"]);
  await writeFile(join(repo, "src", "invoices.js"), broken, "utf8");
  const recurrence = await guardRepo(repo);
  const reportPath = join(repo, "report.html");
  await writeFile(reportPath, renderGuardReportHtml(recurrence), "utf8");
  // Leave the fixture healthy; the captured recurrence report remains inspectable.
  await writeFile(join(repo, "src", "invoices.js"), fixed, "utf8");
  return {
    ok: replay.verified && corrected.passed && !recurrence.passed && context.instructions.length === 1,
    fixture: true, repo, reportPath, caseId: candidate.case.id, replay, corrected, recurrence, context,
    limitation: "Historical literal-check replay. No AI task was rerun; no general security guarantee is implied.",
  };
}
