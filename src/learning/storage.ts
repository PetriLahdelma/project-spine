import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { link, lstat, mkdir, open, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { stableStringify } from "../compiler/hash.js";
import {
  FailureCaseSchema,
  ReplayVerificationSchema,
  StoredLearningCaseSchema,
  type FailureCase,
  type ReplayVerification,
  type StoredLearningCase,
} from "./model.js";

const MAX_CASE_BYTES = 256 * 1024;
const SAFE_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const CASES_DIR = [".project-spine", "learning", "cases"] as const;
const VERIFICATIONS_DIR = [".project-spine", "learning", "verifications"] as const;

export function contentHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function ruleDigest(failureCase: FailureCase): string {
  return contentHash(failureCase.rules);
}

export async function repositoryRoot(root: string): Promise<string> {
  const resolved = await realpath(resolve(root));
  const info = await stat(resolved);
  if (!info.isDirectory()) throw new Error(`Repository root is not a directory: ${root}`);
  return resolved;
}

export function assertCaseId(id: string): string {
  if (!SAFE_ID.test(id)) throw new Error(`Unsafe learning case id: ${id}`);
  return id;
}

export function casePath(root: string, id: string): string {
  return join(root, ...CASES_DIR, `${assertCaseId(id)}.json`);
}

export function verificationPath(root: string, id: string): string {
  return join(root, ...VERIFICATIONS_DIR, `${assertCaseId(id)}.json`);
}

async function boundedRead(path: string): Promise<string> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile()) throw new Error(`Learning case is not a regular file: ${path}`);
    if (info.size > MAX_CASE_BYTES) throw new Error(`Learning case exceeds ${MAX_CASE_BYTES} bytes`);
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

function staysWithin(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

async function evidenceDirectory(root: string, parts: readonly string[], create: boolean): Promise<string | null> {
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      if (!create) return null;
      try {
        await mkdir(current, { mode: 0o700 });
      } catch (mkdirError) {
        if ((mkdirError as NodeJS.ErrnoException).code !== "EEXIST") throw mkdirError;
      }
      info = await lstat(current);
    }
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new Error(`Unsafe learning evidence directory: ${current}`);
    }
    const actual = await realpath(current);
    if (!staysWithin(root, actual)) throw new Error(`Learning evidence directory escapes repository: ${current}`);
  }
  return current;
}

export async function parseCaseFile(path: string, root: string): Promise<{ failureCase: FailureCase; sourceFile: string }> {
  const actual = await realpath(resolve(path));
  const rel = relative(root, actual);
  if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) throw new Error("Learning case file must stay inside the repository");
  let raw: unknown;
  try {
    raw = JSON.parse(await boundedRead(actual));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Invalid learning case JSON: ${error.message}`);
    throw error;
  }
  const parsed = FailureCaseSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Invalid learning case: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  return { failureCase: parsed.data, sourceFile: basename(actual) };
}

async function writeImmutableJson(root: string, directoryParts: readonly string[], filename: string, value: unknown): Promise<"created" | "identical"> {
  const directory = await evidenceDirectory(root, directoryParts, true);
  if (!directory) throw new Error("Unable to create learning evidence directory");
  const path = join(directory, filename);
  const body = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const existing = await boundedRead(path);
    return existing === body ? "identical" : Promise.reject(new Error(`Refusing to overwrite different learning evidence: ${path}`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const temp = join(directory, `.${basename(path)}.${randomUUID()}.tmp`);
  await writeFile(temp, body, { encoding: "utf8", flag: "wx", mode: 0o600 });
  try {
    await link(temp, path);
    return "created";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      const existing = await boundedRead(path);
      if (existing === body) return "identical";
      throw new Error(`Refusing to overwrite different learning evidence: ${path}`);
    }
    throw error;
  } finally {
    await unlink(temp).catch(() => undefined);
  }
}

export async function storeCase(root: string, failureCase: FailureCase, sourceFile: string): Promise<StoredLearningCase> {
  const stored: StoredLearningCase = {
    schemaVersion: 1,
    case: failureCase,
    evidence: {
      inputHash: contentHash(failureCase),
      ingestedAt: new Date().toISOString(),
      sourceFile,
    },
  };
  try {
    const existing = await loadStoredCase(root, failureCase.id);
    if (!existing) throw new Error(`Existing learning case is invalid: ${failureCase.id}`);
    if (contentHash(existing.case) !== contentHash(failureCase)) {
      throw new Error(`Refusing to overwrite different learning case: ${failureCase.id}`);
    }
    return existing;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT" && !String((error as Error).message).startsWith("Learning case not found:")) throw error;
  }

  await writeImmutableJson(root, CASES_DIR, `${failureCase.id}.json`, stored);
  return stored;
}

export async function loadStoredCase(root: string, id: string): Promise<StoredLearningCase | null> {
  const directory = await evidenceDirectory(root, CASES_DIR, false);
  if (!directory) throw new Error(`Learning case not found: ${id}`);
  let raw: unknown;
  try {
    raw = JSON.parse(await boundedRead(join(directory, `${assertCaseId(id)}.json`)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error(`Learning case not found: ${id}`);
    return null;
  }
  const parsed = StoredLearningCaseSchema.safeParse(raw);
  if (!parsed.success || parsed.data.evidence.inputHash !== contentHash(parsed.data.case)) return null;
  return parsed.data;
}

export async function loadVerification(root: string, id: string): Promise<ReplayVerification | null> {
  const directory = await evidenceDirectory(root, VERIFICATIONS_DIR, false);
  if (!directory) return null;
  try {
    const raw: unknown = JSON.parse(await boundedRead(join(directory, `${assertCaseId(id)}.json`)));
    const parsed = ReplayVerificationSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function storeVerification(root: string, verification: ReplayVerification): Promise<void> {
  const directory = await evidenceDirectory(root, VERIFICATIONS_DIR, true);
  if (!directory) throw new Error("Unable to create verification directory");
  const target = join(directory, `${assertCaseId(verification.caseId)}.json`);
  try {
    const targetInfo = await lstat(target);
    if (targetInfo.isSymbolicLink() || !targetInfo.isFile()) throw new Error(`Unsafe learning verification file: ${target}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temp = join(directory, `.${verification.caseId}.${randomUUID()}.tmp`);
  await writeFile(temp, `${JSON.stringify(verification, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  try {
    await rename(temp, target);
  } finally {
    await unlink(temp).catch(() => undefined);
  }
}

export async function listStoredCaseFiles(root: string): Promise<string[]> {
  const dir = await evidenceDirectory(root, CASES_DIR, false);
  if (!dir) return [];
  const { readdir } = await import("node:fs/promises");
  try {
    return (await readdir(dir)).filter((name) => SAFE_ID.test(name.slice(0, -5)) && name.endsWith(".json") && !name.startsWith(".")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export function assertRelativeFile(path: string): string {
  if (!path || isAbsolute(path) || path.includes("\0") || path.includes("\\")) throw new Error(`Unsafe repository path: ${path}`);
  const normalized = path.replace(/^\.\//, "");
  if (normalized.split("/").some((part) => part === ".." || part === "")) throw new Error(`Unsafe repository path: ${path}`);
  return normalized;
}

export async function safeWorkingFile(root: string, relativePath: string): Promise<string | null> {
  const safe = assertRelativeFile(relativePath);
  const candidate = resolve(root, safe);
  const rel = relative(root, candidate);
  if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) throw new Error(`Path escapes repository: ${relativePath}`);
  try {
    let current = root;
    const segments = safe.split("/");
    for (const [index, segment] of segments.entries()) {
      current = join(current, segment);
      const componentInfo = await lstat(current);
      if (componentInfo.isSymbolicLink()) return null;
      if (index < segments.length - 1 && !componentInfo.isDirectory()) return null;
    }
    const directInfo = await lstat(candidate);
    if (directInfo.isSymbolicLink() || !directInfo.isFile() || directInfo.size > 2 * 1024 * 1024) return null;
    const actual = await realpath(candidate);
    const actualRel = relative(root, actual);
    if (actualRel.startsWith(`..${sep}`) || actualRel === ".." || isAbsolute(actualRel)) return null;
    return actual;
  } catch {
    return null;
  }
}
