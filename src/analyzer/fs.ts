import { readFile, access, stat } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T = unknown>(path: string): Promise<T | null> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function readText(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function isDir(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function findFiles(root: string, patterns: string[], extraIgnore: string[] = []): Promise<string[]> {
  return fg(patterns, {
    cwd: root,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: ["node_modules/**", "dist/**", ".git/**", "coverage/**", ...extraIgnore],
  });
}

export function rootPath(root: string, ...parts: string[]): string {
  return join(root, ...parts);
}
