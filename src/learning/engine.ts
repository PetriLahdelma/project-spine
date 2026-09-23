import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import fg from "fast-glob";
import type {
  ContextResult,
  FailureCase,
  GuardReport,
  LearningCaseSummary,
  LearningRule,
  ReplayResult,
  ReplayVerification,
  RuleEvaluation,
  StoredLearningCase,
} from "./model.js";
import {
  assertRelativeFile,
  casePath,
  contentHash,
  listStoredCaseFiles,
  loadStoredCase,
  loadVerification,
  parseCaseFile,
  repositoryRoot,
  ruleDigest,
  safeWorkingFile,
  storeCase,
  storeVerification,
} from "./storage.js";

const execFileAsync = promisify(execFile);
const MAX_GIT_OUTPUT = 32 * 1024 * 1024;
const MAX_BLOB_BYTES = 2 * 1024 * 1024;
const MAX_AGGREGATE_BLOB_BYTES = 32 * 1024 * 1024;

type ContentMap = Map<string, string>;

function globRegex(pattern: string): RegExp {
  let output = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]!;
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        const followedBySlash = pattern[index + 2] === "/";
        output += followedBySlash ? "(?:.*/)?" : ".*";
        index += followedBySlash ? 2 : 1;
      } else {
        output += "[^/]*";
      }
    } else if (char === "?") {
      output += "[^/]";
    } else {
      output += char.replace(/[.+^$|\\]/g, "\\$&");
    }
  }
  return new RegExp(`${output}$`);
}

function matchesAny(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globRegex(pattern).test(path));
}

function evaluateRule(caseId: string, rule: LearningRule, contents: ContentMap): RuleEvaluation {
  const matchedFiles = [...contents.keys()].filter((path) => matchesAny(path, rule.files)).sort();
  if (matchedFiles.length === 0) {
    return { caseId, ruleId: rule.id, description: rule.description, kind: rule.kind, passed: false, matchedFiles, violatingFiles: [], reason: "no-coverage" };
  }

  const containing = matchedFiles.filter((path) => contents.get(path)!.includes(rule.text));
  const passed = rule.kind === "forbid-text" ? containing.length === 0 : containing.length === matchedFiles.length;
  const violatingFiles = rule.kind === "forbid-text" ? containing : matchedFiles.filter((path) => !containing.includes(path));
  return { caseId, ruleId: rule.id, description: rule.description, kind: rule.kind, passed, matchedFiles, violatingFiles };
}

async function git(root: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: MAX_GIT_OUTPUT, timeout: 15_000 });
    return stdout;
  } catch (error) {
    const detail = error as Error & { stderr?: string };
    throw new Error(`Git ${args[0] ?? "command"} failed: ${(detail.stderr ?? detail.message).trim()}`);
  }
}

async function assertGitRoot(root: string): Promise<void> {
  const reported = (await git(root, ["rev-parse", "--show-toplevel"])).trim();
  if (await repositoryRoot(reported) !== root) throw new Error(`Replay requires the repository root, got: ${root}`);
}

async function resolveCommit(root: string, ref: string): Promise<string> {
  if (ref.startsWith("-")) throw new Error(`Unsafe Git ref: ${ref}`);
  const sha = (await git(root, ["rev-parse", "--verify", `${ref}^{commit}`])).trim();
  if (!/^[a-f0-9]{40,64}$/.test(sha)) throw new Error(`Git returned an invalid commit id for ${ref}`);
  return sha;
}

type GitBlobEntry = { path: string; oid: string; size: number };

async function gitBatchBlobs(root: string, entries: GitBlobEntry[]): Promise<Map<string, Buffer>> {
  const unique = new Map<string, number>();
  for (const entry of entries) {
    const previous = unique.get(entry.oid);
    if (previous !== undefined && previous !== entry.size) throw new Error(`Git reported conflicting sizes for blob ${entry.oid}`);
    unique.set(entry.oid, entry.size);
  }
  if (unique.size === 0) return new Map();

  const expectedBytes = [...unique.values()].reduce((total, size) => total + size, 0);
  if (expectedBytes > MAX_AGGREGATE_BLOB_BYTES) {
    throw new Error(`Replay content exceeds the ${MAX_AGGREGATE_BLOB_BYTES}-byte aggregate limit`);
  }

  const output = await new Promise<Buffer>((resolvePromise, reject) => {
    const child = spawn("git", ["-C", root, "cat-file", "--batch"], {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let outputBytes = 0;
    let settled = false;
    const maximumOutput = expectedBytes + unique.size * 160 + 1024;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error("Git cat-file batch timed out"));
    }, 30_000);
    const finish = (error?: Error, value?: Buffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolvePromise(value ?? Buffer.alloc(0));
    };

    child.on("error", (error) => finish(new Error(`Git cat-file failed: ${error.message}`)));
    child.stdout.on("data", (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > maximumOutput) {
        child.kill("SIGKILL");
        finish(new Error("Git cat-file produced more data than requested"));
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("close", (code) => {
      if (code !== 0) {
        finish(new Error(`Git cat-file failed (${code ?? "signal"}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
        return;
      }
      finish(undefined, Buffer.concat(stdout));
    });
    child.stdin.on("error", (error) => finish(new Error(`Git cat-file input failed: ${error.message}`)));
    child.stdin.end(`${[...unique.keys()].join("\n")}\n`);
  });

  const blobs = new Map<string, Buffer>();
  let offset = 0;
  for (const [requestedOid, expectedSize] of unique) {
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd < 0) throw new Error(`Git cat-file returned a truncated header for ${requestedOid}`);
    const header = output.subarray(offset, headerEnd).toString("ascii");
    const [oid, type, sizeText, ...extra] = header.split(" ");
    const size = Number.parseInt(sizeText ?? "", 10);
    if (extra.length > 0 || oid !== requestedOid || type !== "blob" || !Number.isSafeInteger(size) || size !== expectedSize) {
      throw new Error(`Git cat-file returned invalid metadata for ${requestedOid}`);
    }
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + size;
    if (contentEnd >= output.length || output[contentEnd] !== 0x0a) {
      throw new Error(`Git cat-file returned truncated content for ${requestedOid}`);
    }
    blobs.set(requestedOid, output.subarray(contentStart, contentEnd));
    offset = contentEnd + 1;
  }
  if (offset !== output.length) throw new Error("Git cat-file returned unexpected trailing data");
  return blobs;
}

async function gitContents(root: string, sha: string, rules: LearningRule[]): Promise<ContentMap> {
  const entries = (await git(root, ["ls-tree", "-r", "-l", "-z", sha, "--"]))
    .split("\0")
    .filter(Boolean)
    .flatMap((entry) => {
      const separator = entry.indexOf("\t");
      if (separator < 0) return [];
      const metadata = entry.slice(0, separator).trim().split(/\s+/);
      const mode = metadata[0];
      const type = metadata[1];
      const oid = metadata[2];
      const size = Number.parseInt(metadata[3] ?? "", 10);
      if (type !== "blob" || (mode !== "100644" && mode !== "100755")) return [];
      if (!oid || !/^[a-f0-9]{40,64}$/.test(oid) || !Number.isSafeInteger(size) || size < 0) {
        throw new Error(`Git ls-tree returned invalid blob metadata at ${sha}`);
      }
      const path = assertRelativeFile(entry.slice(separator + 1));
      if (!rules.some((rule) => matchesAny(path, rule.files))) return [];
      if (size > MAX_BLOB_BYTES) throw new Error(`Replay blob exceeds the ${MAX_BLOB_BYTES}-byte per-file limit: ${path}`);
      return [{ path, oid, size }];
    });
  if (entries.length > 10_000) throw new Error("Replay matched more than 10,000 files");
  if (entries.reduce((total, entry) => total + entry.size, 0) > MAX_AGGREGATE_BLOB_BYTES) {
    throw new Error(`Replay content exceeds the ${MAX_AGGREGATE_BLOB_BYTES}-byte aggregate limit across matched paths`);
  }

  const blobs = await gitBatchBlobs(root, entries);
  const decoded = new Map([...blobs].map(([oid, blob]) => [oid, blob.toString("utf8")]));
  const contents: ContentMap = new Map();
  for (const entry of entries) {
    const value = decoded.get(entry.oid);
    if (value === undefined) throw new Error(`Git cat-file omitted blob ${entry.oid}`);
    contents.set(entry.path, value);
  }
  return contents;
}

function isCurrentVerification(stored: StoredLearningCase, verification: ReplayVerification | null): verification is ReplayVerification {
  return Boolean(
    verification
      && verification.caseId === stored.case.id
      && verification.caseHash === stored.evidence.inputHash
      && verification.ruleDigest === ruleDigest(stored.case)
      && verification.ruleIds.length === stored.case.rules.length
      && verification.ruleIds.every((id, index) => id === stored.case.rules[index]?.id),
  );
}

async function verificationStillProves(root: string, stored: StoredLearningCase, verification: ReplayVerification): Promise<boolean> {
  try {
    const [brokenContents, fixedContents] = await Promise.all([
      gitContents(root, verification.brokenSha, stored.case.rules),
      gitContents(root, verification.fixedSha, stored.case.rules),
    ]);
    return stored.case.rules.every((rule) => {
      const before = evaluateRule(stored.case.id, rule, brokenContents);
      const after = evaluateRule(stored.case.id, rule, fixedContents);
      return before.reason !== "no-coverage"
        && after.reason !== "no-coverage"
        && !before.passed
        && after.passed
        && before.violatingFiles.length > 0
        && before.violatingFiles.every((path) => after.matchedFiles.includes(path));
    });
  } catch {
    return false;
  }
}

async function verifiedCases(root: string, caseId?: string, files?: string[]): Promise<{ cases: Array<{ stored: StoredLearningCase; verification: ReplayVerification }>; skipped: string[] }> {
  const caseFiles = await listStoredCaseFiles(root);
  const ids = caseFiles.map((file) => file.slice(0, -5)).filter((id) => !caseId || id === caseId);
  if (caseId && !ids.includes(caseId)) throw new Error(`Learning case not found: ${caseId}`);
  const cases: Array<{ stored: StoredLearningCase; verification: ReplayVerification }> = [];
  const skipped: string[] = [];
  for (const id of ids) {
    const stored = await loadStoredCase(root, id);
    if (!stored) {
      skipped.push(id);
      continue;
    }
    if (files && !stored.case.rules.some((rule) => files.some((path) => matchesAny(path, rule.files)))) continue;
    const verification = await loadVerification(root, id);
    if (!isCurrentVerification(stored, verification) || !await verificationStillProves(root, stored, verification)) {
      skipped.push(id);
      continue;
    }
    cases.push({ stored, verification });
  }
  return { cases, skipped };
}

export async function learnCase(repoRoot: string, caseFile: string): Promise<StoredLearningCase> {
  const root = await repositoryRoot(repoRoot);
  const { failureCase, sourceFile } = await parseCaseFile(caseFile, root);
  return storeCase(root, failureCase, sourceFile);
}

export async function replayCase(repoRoot: string, caseId: string): Promise<ReplayResult> {
  const root = await repositoryRoot(repoRoot);
  await assertGitRoot(root);
  const stored = await loadStoredCase(root, caseId);
  if (!stored) throw new Error(`Learning case is invalid or tampered: ${caseId}`);
  const [brokenSha, fixedSha] = await Promise.all([
    resolveCommit(root, stored.case.replay.brokenRef),
    resolveCommit(root, stored.case.replay.fixedRef),
  ]);
  if (brokenSha === fixedSha) throw new Error("Broken and fixed refs resolve to the same commit");

  const [brokenContents, fixedContents] = await Promise.all([
    gitContents(root, brokenSha, stored.case.rules),
    gitContents(root, fixedSha, stored.case.rules),
  ]);
  const broken = stored.case.rules.map((rule) => evaluateRule(caseId, rule, brokenContents));
  const fixed = stored.case.rules.map((rule) => evaluateRule(caseId, rule, fixedContents));

  for (const [index, rule] of stored.case.rules.entries()) {
    const before = broken[index]!;
    const after = fixed[index]!;
    if (before.reason === "no-coverage" || after.reason === "no-coverage") {
      throw new Error(`Replay cannot verify ${rule.id}: matching files must exist in both revisions`);
    }
    if (before.passed) throw new Error(`Replay cannot verify ${rule.id}: broken revision does not violate the rule`);
    if (!after.passed) throw new Error(`Replay cannot verify ${rule.id}: fixed revision still violates the rule`);
    if (!before.violatingFiles.every((path) => after.matchedFiles.includes(path))) {
      throw new Error(`Replay cannot verify ${rule.id}: fixed revision deletes a violating file instead of correcting it`);
    }
  }

  const verification: ReplayVerification = {
    schemaVersion: 1,
    caseId,
    caseHash: stored.evidence.inputHash,
    ruleDigest: ruleDigest(stored.case),
    brokenSha,
    fixedSha,
    verifiedAt: new Date().toISOString(),
    ruleIds: stored.case.rules.map((rule) => rule.id),
  };
  await storeVerification(root, verification);
  return { caseId, verified: true, brokenSha, fixedSha, broken, fixed, verification };
}

export async function guardRepo(repoRoot: string, options: { files?: string[]; caseId?: string } = {}): Promise<GuardReport> {
  const root = await repositoryRoot(repoRoot);
  const requested = options.files?.map(assertRelativeFile);
  const { cases, skipped } = await verifiedCases(root, options.caseId, requested);
  const rules = cases.flatMap(({ stored }) => stored.case.rules
    .filter((rule) => !requested || requested.some((path) => matchesAny(path, rule.files)))
    .map((rule) => ({ caseId: stored.case.id, rule })));
  const patterns = [...new Set(rules.flatMap(({ rule }) => rule.files))];
  const historicalFiles = requested ? [] : (await Promise.all(cases.map(async ({ stored, verification }) => {
    const relevantRules = stored.case.rules.filter((rule) => rules.some((item) => item.caseId === stored.case.id && item.rule.id === rule.id));
    return [...(await gitContents(root, verification.fixedSha, relevantRules)).keys()];
  }))).flat();
  const scanned = requested ? [] : await fg(patterns, {
    cwd: root,
    dot: true,
    onlyFiles: false,
    followSymbolicLinks: false,
    objectMode: true,
    ignore: [".git/**", ".project-spine/**", "node_modules/**", "dist/**", "coverage/**"],
  });
  const literalPatterns = patterns.filter((pattern) => !pattern.includes("*") && !pattern.includes("?"));
  const candidates = [...new Set(requested ?? [
    ...scanned.filter((entry) => !entry.dirent.isDirectory()).map((entry) => entry.path),
    ...literalPatterns,
    ...historicalFiles,
  ])].sort();
  if (candidates.length > 10_000) throw new Error("Guard matched more than 10,000 files");
  const contents: ContentMap = new Map();
  const unreadable = new Set<string>();
  let totalWorkingBytes = 0;
  for (const path of candidates) {
    const actual = await safeWorkingFile(root, path);
    if (!actual) {
      unreadable.add(path);
      continue;
    }
    const value = await readFile(actual, "utf8");
    totalWorkingBytes += Buffer.byteLength(value);
    if (totalWorkingBytes > MAX_AGGREGATE_BLOB_BYTES) throw new Error(`Guard content exceeds the ${MAX_AGGREGATE_BLOB_BYTES}-byte aggregate limit`);
    if (Buffer.byteLength(value) > 2 * 1024 * 1024) {
      unreadable.add(path);
      continue;
    }
    contents.set(path, value);
  }
  const evaluations = rules.map(({ caseId, rule }) => evaluateRule(caseId, rule, contents));
  const activeCaseCount = new Set(rules.map(({ caseId }) => caseId)).size;
  const uncoveredFiles = [...new Set([
    ...unreadable,
    ...(requested?.filter((path) => !contents.has(path)) ?? []),
  ])].sort();
  const hasCoverageGap = uncoveredFiles.length > 0 || evaluations.some((item) => item.reason === "no-coverage");
  const violations = evaluations.filter((item) => !item.passed && item.reason !== "no-coverage");
  const status: GuardReport["status"] = rules.length === 0
    ? "unprotected"
    : hasCoverageGap
      ? "uncovered"
      : violations.length > 0
        ? "failed"
        : "passed";
  return {
    checkedAt: new Date().toISOString(),
    status,
    protected: rules.length > 0,
    caseCount: activeCaseCount,
    ruleCount: rules.length,
    checkedRuleCount: evaluations.filter((item) => item.reason !== "no-coverage").length,
    skippedCaseIds: skipped,
    unverifiedCaseIds: skipped,
    checkedFiles: [...contents.keys()].sort(),
    uncoveredFiles,
    passed: status === "passed",
    evaluations,
    violations,
    evidence: cases.filter(({ stored }) => rules.some(({ caseId }) => caseId === stored.case.id)).map(({ stored, verification }) => ({
      caseId: stored.case.id,
      title: stored.case.title,
      source: stored.case.source,
      caseHash: verification.caseHash,
      ruleDigest: verification.ruleDigest,
      brokenSha: verification.brokenSha,
      fixedSha: verification.fixedSha,
    })),
  };
}

export async function contextForFiles(repoRoot: string, files: string[]): Promise<ContextResult> {
  const root = await repositoryRoot(repoRoot);
  const requested = [...new Set(files.map(assertRelativeFile))].sort();
  const { cases, skipped } = await verifiedCases(root, undefined, requested);
  const instructions = cases.flatMap(({ stored, verification }) => stored.case.rules.flatMap((rule) => {
    const matchingFiles = requested.filter((path) => matchesAny(path, rule.files));
    if (matchingFiles.length === 0) return [];
    return [{
      caseId: stored.case.id,
      ruleId: rule.id,
      description: rule.description,
      kind: rule.kind,
      text: rule.text,
      matchingFiles,
      provenance: { ...stored.case.source, title: stored.case.title, verification: { brokenSha: verification.brokenSha, fixedSha: verification.fixedSha } },
    }];
  }));
  return { files: requested, instructions, skippedCaseIds: skipped };
}

export async function listCases(repoRoot: string): Promise<LearningCaseSummary[]> {
  const root = await repositoryRoot(repoRoot);
  const summaries: LearningCaseSummary[] = [];
  for (const file of await listStoredCaseFiles(root)) {
    const id = file.slice(0, -5);
    const stored = await loadStoredCase(root, id);
    if (!stored) {
      summaries.push({ id, title: "Invalid learning case", source: { kind: "manual" }, ruleCount: 0, status: "invalid" });
      continue;
    }
    const verification = await loadVerification(root, id);
    const current = isCurrentVerification(stored, verification) && await verificationStillProves(root, stored, verification);
    summaries.push({
      id,
      title: stored.case.title,
      source: stored.case.source,
      ruleCount: stored.case.rules.length,
      status: verification ? (current ? "verified" : "stale") : "candidate",
    });
  }
  return summaries;
}

export async function explainCase(repoRoot: string, caseId: string): Promise<{ stored: StoredLearningCase; verification: ReplayVerification | null; enforceable: boolean; path: string }> {
  const root = await repositoryRoot(repoRoot);
  const stored = await loadStoredCase(root, caseId);
  if (!stored) throw new Error(`Learning case is invalid, tampered, or missing: ${caseId}`);
  const verification = await loadVerification(root, caseId);
  const enforceable = isCurrentVerification(stored, verification) && await verificationStillProves(root, stored, verification);
  return { stored, verification, enforceable, path: casePath(root, caseId) };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function renderGuardReportHtml(report: GuardReport): string {
  const rows = report.evaluations.map((item) => `<tr><td>${escapeHtml(item.caseId)}</td><td>${escapeHtml(item.ruleId)}</td><td>${escapeHtml(item.description)}</td><td><span class="badge ${item.passed ? "pass" : "fail"}">${item.passed ? "pass" : "fail"}</span></td><td>${escapeHtml(item.violatingFiles.join(", ") || item.reason || "—")}</td></tr>`).join("");
  const skipped = report.skippedCaseIds.length > 0
    ? `<section><h2>Unverified cases</h2><ul>${report.skippedCaseIds.map((id) => `<li>${escapeHtml(id)}</li>`).join("")}</ul></section>`
    : "";
  const uncovered = report.uncoveredFiles.length > 0
    ? `<section><h2>Uncovered files</h2><ul>${report.uncoveredFiles.map((path) => `<li><code>${escapeHtml(path)}</code></li>`).join("")}</ul></section>`
    : "";
  const ruleTable = report.evaluations.length > 0
    ? `<div class="table-wrap"><table><caption>Verified rule evaluations</caption><thead><tr><th>Case</th><th>Rule</th><th>Description</th><th>Result</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : `<p class="empty">No verified rule evaluations are available for this scope.</p>`;
  const provenance = report.evidence.map((item) => `<section><h2>${escapeHtml(item.title)}</h2><p>Case: ${escapeHtml(item.caseId)}</p><dl><dt>Original source</dt><dd>${escapeHtml(item.source.url ?? item.source.kind)}</dd><dt>Broken revision</dt><dd>${escapeHtml(item.brokenSha)}</dd><dt>Corrected revision</dt><dd>${escapeHtml(item.fixedSha)}</dd><dt>Case hash</dt><dd>${escapeHtml(item.caseHash)}</dd><dt>Rule digest</dt><dd>${escapeHtml(item.ruleDigest)}</dd></dl></section>`).join("");
  const ledger = `${ruleTable}<div style="overflow-wrap:anywhere">${provenance}</div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Project Spine guard report</title><style>:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f6f8fc}*{box-sizing:border-box}body{margin:0;padding:clamp(1rem,4vw,3rem);background:linear-gradient(145deg,#f6f8fc 0%,#eef4ff 58%,#fff1f7 100%);min-height:100vh}main{max-width:72rem;margin:auto;background:#fff;border:1px solid #dce5f5;border-radius:1.25rem;box-shadow:0 1.25rem 4rem rgba(28,55,104,.12);overflow:hidden}.hero{padding:clamp(1.5rem,4vw,3rem);background:linear-gradient(120deg,#e9f1ff,#fff1f7)}h1{margin:.35rem 0;font-size:clamp(2rem,5vw,3.5rem);letter-spacing:-.04em}.eyebrow{margin:0;color:#315ca8;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:.75rem}.meta{color:#58657a}.content{padding:clamp(1.5rem,4vw,3rem)}.summary{display:flex;flex-wrap:wrap;gap:.75rem;margin:0 0 2rem}.summary span,.badge{display:inline-block;border-radius:999px;padding:.35rem .7rem;font-weight:700;font-size:.8rem;background:#e9f1ff;color:#214f9b}.badge.fail{background:#ffe6f0;color:#9b2858}.badge.pass{background:#e6f7ef;color:#176643}.table-wrap{overflow-x:auto;border:1px solid #dce5f5;border-radius:.8rem}table{width:100%;border-collapse:collapse;min-width:48rem}caption{text-align:left;padding:1rem;font-weight:700;background:#f8faff}th,td{text-align:left;padding:.85rem 1rem;border-top:1px solid #e7ecf5;vertical-align:top}th{font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;color:#5b687c}section{margin-top:2rem}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f0f4fb;padding:.15rem .35rem;border-radius:.3rem}.empty{padding:1rem;border:1px dashed #b8c7df;border-radius:.8rem;color:#58657a}</style></head><body><main><header class="hero"><p class="eyebrow">Project Spine evidence report</p><h1>${escapeHtml(report.status)}</h1><p class="meta">Checked ${escapeHtml(report.checkedAt)}</p></header><div class="content"><div class="summary"><span>${report.checkedRuleCount} / ${report.ruleCount} rules checked</span><span>${report.caseCount} verified cases</span><span>${report.checkedFiles.length} files read</span></div>${ledger}${skipped}${uncovered}</div></main></body></html>`;
}
