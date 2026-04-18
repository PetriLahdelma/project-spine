import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { TemplateManifest, type ResolvedTemplate } from "./model.js";

/**
 * Resolve the bundled templates/ directory. Anchors to the nearest package.json
 * so it works from src/ (tests) and dist/ (compiled), without colliding with
 * src/templates/ which is our own source code.
 */
export async function templatesRoot(override?: string): Promise<string> {
  if (override) return resolve(override);
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

export async function listTemplates(override?: string): Promise<ResolvedTemplate[]> {
  const root = await templatesRoot(override);
  const entries = await readdir(root, { withFileTypes: true });
  const results: ResolvedTemplate[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    const manifestPath = join(dir, "template.yaml");
    if (!(await isFile(manifestPath))) continue;
    const manifest = await readManifest(manifestPath);
    if (manifest.name !== entry.name) {
      throw new Error(
        `template directory ${entry.name} has manifest name "${manifest.name}" — must match directory name`
      );
    }
    const briefPath = join(dir, "brief.md");
    if (!(await isFile(briefPath))) {
      throw new Error(`template ${entry.name} missing brief.md`);
    }
    const designCandidate = join(dir, "design-rules.md");
    const designPath = (await isFile(designCandidate)) ? designCandidate : null;
    results.push({ manifest, dir, briefPath, designPath });
  }
  results.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  return results;
}

export async function getTemplate(name: string, override?: string): Promise<ResolvedTemplate> {
  const all = await listTemplates(override);
  const found = all.find((t) => t.manifest.name === name);
  if (!found) {
    const available = all.map((t) => t.manifest.name).join(", ");
    throw new Error(`template "${name}" not found. Available: ${available}`);
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
