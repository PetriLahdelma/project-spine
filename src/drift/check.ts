import { readFile, access, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile } from "../brief/parse.js";
import { parseDesignFromFile } from "../design/parse.js";
import { compileSpine } from "../compiler/compile.js";
import { getTemplate } from "../templates/registry.js";
import { buildManifest, sha256OfFile } from "../compiler/manifest.js";
import { ExportManifest, type FileFingerprint } from "../model/export-manifest.js";
import type { SpineModel } from "../model/spine.js";

export type DriftKind =
  | "input:brief"
  | "input:design"
  | "input:template"
  | "input:repo-profile"
  | "spine:hash"
  | "export:hand-edited"
  | "export:missing"
  | "manifest:missing";

export type DriftItem = {
  kind: DriftKind;
  path: string | null;
  stored: string | null;
  current: string | null;
  detail: string;
};

export type DriftReport = {
  schemaVersion: 1;
  checkedAt: string;
  clean: boolean;
  storedSpineHash: string | null;
  currentSpineHash: string | null;
  counts: {
    inputDrift: number;
    exportHandEdits: number;
    missingExports: number;
    total: number;
  };
  items: DriftItem[];
};

export type CheckOptions = {
  repo: string;
  out?: string;
  now?: () => string;
};

/**
 * Read the stored manifest, recompute current state from inputs on disk, and
 * return a structured drift report. Never throws on drift itself — throws only
 * when inputs are unreadable.
 */
export async function checkDrift(opts: CheckOptions): Promise<DriftReport> {
  const root = resolve(opts.repo);
  const outDir = resolve(root, opts.out ?? ".project-spine");
  const manifestPath = join(outDir, "export-manifest.json");
  const now = opts.now ?? (() => new Date().toISOString());

  if (!(await exists(manifestPath))) {
    return {
      schemaVersion: 1,
      checkedAt: now(),
      clean: false,
      storedSpineHash: null,
      currentSpineHash: null,
      counts: { inputDrift: 0, exportHandEdits: 0, missingExports: 0, total: 1 },
      items: [
        {
          kind: "manifest:missing",
          path: manifestPath,
          stored: null,
          current: null,
          detail:
            "No export-manifest.json. Run `spine compile` to create one — drift detection requires a prior compile.",
        },
      ],
    };
  }

  const stored = ExportManifest.parse(JSON.parse(await readFile(manifestPath, "utf8")));

  const briefPath = resolve(root, stored.inputs.briefPath);
  if (!(await exists(briefPath))) {
    throw new Error(`brief referenced by manifest is missing: ${briefPath}`);
  }
  const designPath = stored.inputs.designPath ? resolve(root, stored.inputs.designPath) : null;
  if (designPath && !(await exists(designPath))) {
    throw new Error(`design-rules referenced by manifest is missing: ${designPath}`);
  }

  const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(root)]);
  const design = designPath ? await parseDesignFromFile(designPath) : null;
  const template = stored.inputs.templateName
    ? (await getTemplate(stored.inputs.templateName)).manifest
    : null;

  const currentSpine: SpineModel = compileSpine({
    brief,
    repo,
    design,
    template,
    now,
  });

  const currentManifest = buildManifest({
    spine: currentSpine,
    brief,
    briefPath,
    repo,
    design,
    designPath,
    template,
    // exports will be re-fingerprinted below; pass empty for now, we populate
    // the per-file comparison against disk separately
    exports: [],
    repoRoot: root,
    now,
  });

  const items: DriftItem[] = [];

  // Input drift
  if (currentManifest.inputs.briefSha256 !== stored.inputs.briefSha256) {
    items.push({
      kind: "input:brief",
      path: stored.inputs.briefPath,
      stored: stored.inputs.briefSha256,
      current: currentManifest.inputs.briefSha256,
      detail: "brief.md changed since last compile.",
    });
  }
  if (currentManifest.inputs.designSha256 !== stored.inputs.designSha256) {
    items.push({
      kind: "input:design",
      path: stored.inputs.designPath,
      stored: stored.inputs.designSha256,
      current: currentManifest.inputs.designSha256,
      detail: stored.inputs.designPath
        ? "design-rules.md changed since last compile."
        : currentManifest.inputs.designSha256
          ? "design-rules.md was added since last compile."
          : "design-rules.md was removed since last compile.",
    });
  }
  if (currentManifest.inputs.templateSha256 !== stored.inputs.templateSha256) {
    items.push({
      kind: "input:template",
      path: stored.inputs.templateName,
      stored: stored.inputs.templateSha256,
      current: currentManifest.inputs.templateSha256,
      detail: stored.inputs.templateName
        ? `template "${stored.inputs.templateName}" contributions changed since last compile.`
        : currentManifest.inputs.templateSha256
          ? "a template was applied that wasn't present at last compile."
          : "the template applied at last compile is no longer configured.",
    });
  }
  if (currentManifest.inputs.repoProfileSha256 !== stored.inputs.repoProfileSha256) {
    items.push({
      kind: "input:repo-profile",
      path: null,
      stored: stored.inputs.repoProfileSha256,
      current: currentManifest.inputs.repoProfileSha256,
      detail: "Repo profile changed — stack, conventions, or agent-file presence differs from last compile.",
    });
  }
  if (currentSpine.metadata.hash !== stored.spineHash) {
    items.push({
      kind: "spine:hash",
      path: null,
      stored: stored.spineHash,
      current: currentSpine.metadata.hash,
      detail: `spine hash changed (${stored.spineHash} → ${currentSpine.metadata.hash}). Run \`spine compile\` to refresh exports.`,
    });
  }

  // Export drift (hand-edits or missing)
  for (const f of stored.exports) {
    const abs = resolve(root, f.path);
    if (!(await exists(abs))) {
      items.push({
        kind: "export:missing",
        path: f.path,
        stored: f.sha256,
        current: null,
        detail: `${f.path} was present at last compile but is now missing.`,
      });
      continue;
    }
    const currentSha = await sha256OfFile(abs);
    if (currentSha !== f.sha256) {
      items.push({
        kind: "export:hand-edited",
        path: f.path,
        stored: f.sha256,
        current: currentSha,
        detail: `${f.path} has been edited since the last compile.`,
      });
    }
  }

  const counts = {
    inputDrift: items.filter((i) => i.kind.startsWith("input:") || i.kind === "spine:hash").length,
    exportHandEdits: items.filter((i) => i.kind === "export:hand-edited").length,
    missingExports: items.filter((i) => i.kind === "export:missing").length,
    total: items.length,
  };

  return {
    schemaVersion: 1,
    checkedAt: now(),
    clean: items.length === 0,
    storedSpineHash: stored.spineHash,
    currentSpineHash: currentSpine.metadata.hash,
    counts,
    items,
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

void stat;
