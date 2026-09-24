import { constants } from "node:fs";
import { access, lstat, realpath } from "node:fs/promises";
import { delimiter, isAbsolute, join, relative, resolve, sep } from "node:path";

function inside(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function containsNodeModules(path: string): boolean {
  return resolve(path).split(sep).includes("node_modules");
}

export async function resolveTrustedExecutable(name: "git" | "docker", forbiddenRoots: string[]): Promise<string> {
  const pathValue = process.env.PATH;
  if (!pathValue) throw new Error(`PATH is unavailable; cannot resolve trusted ${name}`);
  const roots = await Promise.all(forbiddenRoots.map(async (root) => {
    try { return await realpath(resolve(root)); } catch { return resolve(root); }
  }));

  for (const entry of pathValue.split(delimiter)) {
    if (!entry || !isAbsolute(entry)) throw new Error(`Refusing relative PATH entry while resolving trusted ${name}`);
    const candidate = join(entry, name);
    try {
      await access(candidate, constants.X_OK);
    } catch {
      continue;
    }
    const info = await lstat(candidate);
    if (!info.isFile() && !info.isSymbolicLink()) throw new Error(`Refusing non-file ${name} executable: ${candidate}`);
    const actual = await realpath(candidate);
    if (containsNodeModules(candidate) || containsNodeModules(actual) || roots.some((root) => inside(root, candidate) || inside(root, actual))) {
      throw new Error(`Refusing repository-local or node_modules ${name} executable: ${candidate}`);
    }
    return actual;
  }
  throw new Error(`Trusted ${name} executable was not found on PATH`);
}

export function scrubbedToolEnvironment(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    PATH: "/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin",
    LANG: "C",
    LC_ALL: "C",
    ...extra,
  };
}

export function scrubbedGitEnvironment(): NodeJS.ProcessEnv {
  return scrubbedToolEnvironment({
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_COUNT: "0",
    GIT_NO_LAZY_FETCH: "1",
    GIT_NO_REPLACE_OBJECTS: "1",
    GIT_TERMINAL_PROMPT: "0",
  });
}
