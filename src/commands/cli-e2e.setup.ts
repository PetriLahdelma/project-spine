import { execa } from "execa";
import { access, stat } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Vitest globalSetup. Ensures dist/cli.js exists and is fresh relative to the
 * TypeScript sources before any e2e test spawns `node dist/cli.js`. Runs once
 * per test invocation, not per test file.
 */
export async function setup(): Promise<void> {
  const distCli = resolve(__dirname, "..", "..", "dist", "cli.js");
  if (await isUpToDate(distCli)) return;
  // tsc is fast enough for a pre-test build; under 1.5s cold on this repo.
  await execa("npm", ["run", "build"], { stdio: "inherit", cwd: resolve(__dirname, "..", "..") });
}

async function isUpToDate(distCli: string): Promise<boolean> {
  try {
    await access(distCli);
  } catch {
    return false;
  }
  const distMtime = (await stat(distCli)).mtimeMs;
  const srcMtime = await newestSrcMtime(resolve(__dirname, ".."));
  return distMtime >= srcMtime;
}

async function newestSrcMtime(dir: string): Promise<number> {
  const { readdir, stat: statFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  let newest = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
      if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".setup.ts")) continue;
      const s = await statFile(full);
      if (s.mtimeMs > newest) newest = s.mtimeMs;
    }
  }
  return newest;
}
