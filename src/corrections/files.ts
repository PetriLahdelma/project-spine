import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { chmod, link, lstat, mkdir, mkdtemp, open, realpath, rm, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { CorrectionCaseSchema, type CorrectionCase } from "./model.js";
import type { SnapshotManifest } from "./model.js";
import { stableStringify } from "../compiler/hash.js";
import { resolveTrustedExecutable, scrubbedGitEnvironment } from "./executable.js";

const execFileAsync = promisify(execFile);
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 32 * 1024 * 1024;

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function caseHash(value: CorrectionCase): string {
  return sha256(stableStringify(value));
}

export async function repoRoot(path: string): Promise<string> {
  const root = await realpath(resolve(path));
  if (!(await stat(root)).isDirectory()) throw new Error(`Repository root is not a directory: ${path}`);
  const git = await resolveTrustedExecutable("git", [root, process.cwd()]);
  const { stdout } = await execFileAsync(git, ["-C", root, "rev-parse", "--show-toplevel"], { encoding: "utf8", timeout: 15_000, env: scrubbedGitEnvironment() });
  if (await realpath(stdout.trim()) !== root) throw new Error("Correction commands require the Git repository root");
  return root;
}

export async function gitSha(root: string, ref: string): Promise<string> {
  if (!ref || ref.startsWith("-")) throw new Error(`Unsafe Git ref: ${ref}`);
  const git = await resolveTrustedExecutable("git", [root, process.cwd()]);
  const { stdout } = await execFileAsync(git, ["-C", root, "rev-parse", "--verify", `${ref}^{commit}`], { encoding: "utf8", timeout: 15_000, env: scrubbedGitEnvironment() });
  const sha = stdout.trim();
  if (!/^[a-f0-9]{40,64}$/.test(sha)) throw new Error(`Invalid Git commit: ${ref}`);
  return sha;
}

async function gitBlobInfo(root: string, sha: string, path: string): Promise<{ oid: string; size: number; mode: "100644" | "100755" }> {
  const git = await resolveTrustedExecutable("git", [root, process.cwd()]);
  const { stdout } = await execFileAsync(git, ["-C", root, "ls-tree", "-l", "-z", sha, "--", `:(literal)${path}`], { encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024, env: scrubbedGitEnvironment() });
  const entries = stdout.split("\0").filter(Boolean);
  if (entries.length !== 1) throw new Error(`Path is missing or ambiguous at ${sha}: ${path}`);
  const separator = entries[0]!.indexOf("\t");
  const metadata = entries[0]!.slice(0, separator).trim().split(/\s+/);
  const returnedPath = entries[0]!.slice(separator + 1);
  const size = Number.parseInt(metadata[3] ?? "", 10);
  if (returnedPath !== path || metadata[1] !== "blob" || !["100644", "100755"].includes(metadata[0] ?? "") || !/^[a-f0-9]{40,64}$/.test(metadata[2] ?? "") || !Number.isSafeInteger(size) || size < 0) {
    throw new Error(`Path is not a regular Git blob at ${sha}: ${path}`);
  }
  if (size > MAX_FILE_BYTES) throw new Error(`File exceeds ${MAX_FILE_BYTES} bytes: ${path}`);
  return { oid: metadata[2]!, size, mode: metadata[0] as "100644" | "100755" };
}

export async function gitBlobRecord(root: string, sha: string, path: string): Promise<{ value: Buffer; mode: "100644" | "100755" }> {
  const info = await gitBlobInfo(root, sha, path);
  const git = await resolveTrustedExecutable("git", [root, process.cwd()]);
  const { stdout } = await execFileAsync(git, ["-C", root, "cat-file", "blob", info.oid], { encoding: "buffer", timeout: 15_000, maxBuffer: MAX_FILE_BYTES + 1, env: scrubbedGitEnvironment() });
  const value = Buffer.from(stdout);
  if (value.length !== info.size) throw new Error(`Git blob size changed while reading: ${path}`);
  return { value, mode: info.mode };
}

export async function gitBlob(root: string, sha: string, path: string): Promise<Buffer> {
  return (await gitBlobRecord(root, sha, path)).value;
}

async function ensureSafeParent(root: string, path: string): Promise<void> {
  const target = resolve(path);
  if (!isAbsolute(target)) throw new Error(`Invalid path: ${path}`);
  const rel = relative(root, target);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`Path escapes repository: ${path}`);
  let current = root;
  for (const segment of rel.split(sep).slice(0, -1)) {
    if (!segment) continue;
    current = join(current, segment);
    const info = await lstat(current);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe path parent: ${current}`);
  }
}

export async function readCase(caseFile: string, root: string): Promise<CorrectionCase> {
  const target = resolve(caseFile);
  await ensureSafeParent(root, target);
  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > 512 * 1024) throw new Error("Correction case must be a regular file no larger than 512 KiB");
    const parsed = CorrectionCaseSchema.safeParse(JSON.parse(await handle.readFile("utf8")));
    if (!parsed.success) throw new Error(`Invalid correction case: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
    const test = Buffer.from(parsed.data.execution.testBase64, "base64");
    if (test.length === 0 || test.length > 256 * 1024 || sha256(test) !== parsed.data.execution.testSha256) throw new Error("Embedded correction test hash is invalid");
    const historicalTest = await gitBlob(root, parsed.data.revisions.fixedSha, parsed.data.execution.testPath);
    if (!historicalTest.equals(test)) throw new Error("Embedded correction test does not match the immutable fixed revision");
    return parsed.data;
  } finally {
    await handle.close();
  }
}

export async function writeCase(root: string, path: string, value: CorrectionCase): Promise<void> {
  const target = resolve(path);
  await ensureSafeParent(root, target);
  const body = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const existing = await handle.readFile("utf8");
      if (existing === body) return;
      throw new Error(`Refusing to overwrite different correction case: ${target}`);
    } finally {
      await handle.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temp = join(dirname(target), `.${value.id}.${randomUUID()}.tmp`);
  await writeFile(temp, body, { flag: "wx", mode: 0o600 });
  try {
    await link(temp, target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`Refusing to overwrite existing correction case: ${target}`);
    throw error;
  } finally {
    await unlink(temp).catch(() => undefined);
  }
}

async function safeWorkingBlob(root: string, path: string): Promise<{ value: Buffer; mode: "100644" | "100755" }> {
  const target = resolve(root, path);
  await ensureSafeParent(root, target);
  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_FILE_BYTES) throw new Error(`Unsafe or oversized working file: ${path}`);
    return { value: await handle.readFile(), mode: (info.mode & 0o111) === 0 ? "100644" : "100755" };
  } finally {
    await handle.close();
  }
}

export async function materializeSnapshot(root: string, correction: CorrectionCase, revision: string | "current"): Promise<{ directory: string; manifest: SnapshotManifest; cleanup(): Promise<void> }> {
  const directory = await mkdtemp(join(tmpdir(), "spine-correction-"));
  await chmod(directory, 0o700);
  let total = 0;
  const files: SnapshotManifest["files"] = [];
  try {
    for (const path of correction.sourceFiles) {
      const record = revision === "current" ? await safeWorkingBlob(root, path) : await gitBlobRecord(root, revision, path);
      total += record.value.length;
      if (total > MAX_TOTAL_BYTES) throw new Error(`Snapshot exceeds ${MAX_TOTAL_BYTES} bytes`);
      const target = join(directory, path);
      await mkdir(dirname(target), { recursive: true, mode: 0o700 });
      await writeFile(target, record.value, { flag: "wx", mode: record.mode === "100755" ? 0o700 : 0o600 });
      files.push({ path, sha256: sha256(record.value), bytes: record.value.length, mode: record.mode, role: "subject" });
    }
    const test = Buffer.from(correction.execution.testBase64, "base64");
    const testMode = (await gitBlobRecord(root, correction.revisions.fixedSha, correction.execution.testPath)).mode;
    total += test.length;
    if (total > MAX_TOTAL_BYTES) throw new Error(`Snapshot exceeds ${MAX_TOTAL_BYTES} bytes`);
    const testTarget = join(directory, correction.execution.testPath);
    await mkdir(dirname(testTarget), { recursive: true, mode: 0o700 });
    await writeFile(testTarget, test, { flag: "wx", mode: testMode === "100755" ? 0o700 : 0o600 });
    files.push({ path: correction.execution.testPath, sha256: sha256(test), bytes: test.length, mode: testMode, role: "test" });
    files.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
    const manifestRevision = revision === "current" ? "current" : revision === correction.revisions.brokenSha ? "broken" : "fixed";
    const manifest: SnapshotManifest = { revision: manifestRevision, files, snapshotHash: sha256(stableStringify(files)) };
    return { directory, manifest, cleanup: () => rm(directory, { recursive: true, force: true }) };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
