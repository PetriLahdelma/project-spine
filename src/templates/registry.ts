import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { homedir } from "node:os";
import { readdir, readFile, stat } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { TemplateManifest, type ResolvedTemplate } from "./model.js";

export type TemplateSource = "bundled" | "user" | "project";

/**
 * Template roots are searched in priority order. Project-local wins over
 * user-local which wins over bundled. Names collide by intent — a project
 * template with the same name as a user one is the project's override.
 */
export async function templateRoots(override?: string): Promise<{ dir: string; source: TemplateSource }[]> {
  const roots: { dir: string; source: TemplateSource }[] = [];

  const projectDir = resolve(process.cwd(), ".project-spine-templates");
  if (await isDir(projectDir)) roots.push({ dir: projectDir, source: "project" });

  const userDir = join(homedir(), ".project-spine", "templates");
  if (await isDir(userDir)) roots.push({ dir: userDir, source: "user" });

  const extraFromEnv = process.env["SPINE_TEMPLATES_DIR"];
  if (extraFromEnv && (await isDir(extraFromEnv))) {
    roots.push({ dir: resolve(extraFromEnv), source: "user" });
  }

  if (override) {
    if (await isDir(override)) roots.push({ dir: resolve(override), source: "bundled" });
  } else {
    roots.push({ dir: await bundledTemplatesRoot(), source: "bundled" });
  }
  return roots;
}

export async function userTemplatesDir(): Promise<string> {
  return join(homedir(), ".project-spine", "templates");
}

/**
 * Resolve the bundled templates/ directory. Anchors to the nearest package.json
 * so it works from src/ (tests) and dist/ (compiled), without colliding with
 * src/templates/ which is our own source code.
 */
export async function bundledTemplatesRoot(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  let cursor = here;
  for (let i = 0; i < 8; i++) {
    if (await isFile(join(cursor, "package.json"))) {
      const candidate = join(cursor, "templates");
      if (await isDir(candidate)) return candidate;
      throw new Error(`found package.json at ${cursor} but no templates/ directory alongside it`);
    }
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  throw new Error(`could not locate package.json above ${here} to anchor templates/`);
}

/** Back-compat single-root lookup used by callers that just want the built-in dir. */
export async function templatesRoot(override?: string): Promise<string> {
  if (override) return resolve(override);
  return bundledTemplatesRoot();
}

export type ResolvedTemplateWithSource = ResolvedTemplate & { source: TemplateSource };

export async function listTemplates(override?: string): Promise<ResolvedTemplateWithSource[]> {
  const roots = await templateRoots(override);
  const seen = new Map<string, ResolvedTemplateWithSource>();
  for (const { dir: root, source } of roots) {
    const entries = await readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = join(root, entry.name);
      const manifestPath = join(dir, "template.yaml");
      if (!(await isFile(manifestPath))) continue;
      const manifest = await readManifest(manifestPath);
      if (manifest.name !== entry.name) {
        throw new Error(
          `template directory ${entry.name} (in ${root}) has manifest name "${manifest.name}" — must match directory name`
        );
      }
      if (seen.has(manifest.name)) continue; // priority: first root wins
      const briefPath = join(dir, "brief.md");
      if (!(await isFile(briefPath))) {
        throw new Error(`template ${entry.name} (in ${root}) missing brief.md`);
      }
      const designCandidate = join(dir, "design-rules.md");
      const designPath = (await isFile(designCandidate)) ? designCandidate : null;
      seen.set(manifest.name, { manifest, dir, briefPath, designPath, source });
    }
  }
  return [...seen.values()].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

export async function getTemplate(name: string, override?: string): Promise<ResolvedTemplateWithSource> {
  const all = await listTemplates(override);
  const found = all.find((t) => t.manifest.name === name);
  if (!found) {
    const available = all.map((t) => t.manifest.name).join(", ");
    throw new Error(`template "${name}" not found. Available: ${available || "(none)"}`);
  }
  return found;
}

async function readManifest(path: string): Promise<TemplateManifest> {
  const raw = await readFile(path, "utf8");
  const parsed = parseYaml(raw);
  return TemplateManifest.parse(parsed);
}

async function isDir(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}
