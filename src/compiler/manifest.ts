import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { relative, isAbsolute } from "node:path";
import type { NormalizedBrief } from "../model/brief.js";
import type { RepoProfile } from "../model/repo-profile.js";
import type { DesignRules } from "../model/design-rules.js";
import type { SpineModel } from "../model/spine.js";
import type { TemplateManifest } from "../templates/model.js";
import type { ExportManifest, FileFingerprint } from "../model/export-manifest.js";
import { stableStringify, canonicalizeForHash, canonicalizeRepoForHash } from "./hash.js";

export function sha256OfString(content: string): string {
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}

export function sha256OfObject(value: unknown): string {
  return sha256OfString(stableStringify(value));
}

export async function sha256OfFile(path: string): Promise<string> {
  const content = await readFile(path, "utf8");
  return sha256OfString(content);
}

export async function fingerprintFile(absolutePath: string, repoRoot: string): Promise<FileFingerprint> {
  const s = await stat(absolutePath);
  const sha256 = await sha256OfFile(absolutePath);
  const rel = toRepoRelative(absolutePath, repoRoot);
  return { path: rel, sha256, bytes: s.size };
}

export function toRepoRelative(p: string, root: string): string {
  if (!isAbsolute(p)) return p;
  const r = relative(root, p);
  return r.length > 0 ? r : p;
}

export function buildManifest(params: {
  spine: SpineModel;
  brief: NormalizedBrief;
  briefPath: string;
  repo: RepoProfile;
  design: DesignRules | null;
  designPath: string | null;
  template: TemplateManifest | null;
  exports: FileFingerprint[];
  repoRoot: string;
  now?: () => string;
}): ExportManifest {
  const now = params.now ?? (() => new Date().toISOString());
  // Hash payloads are canonicalized to drop timestamps and any fields Spine
  // itself writes (so compile is idempotent — a second run with no user change
  // must produce the same manifest).
  const briefPayload = canonicalizeForHash(params.brief);
  const repoPayload = canonicalizeRepoForHash(params.repo);
  const designPayload = params.design ? canonicalizeForHash(params.design) : null;
  const templatePayload = params.template
    ? { name: params.template.name, contributes: params.template.contributes, schemaVersion: params.template.schemaVersion }
    : null;

  return {
    schemaVersion: 1,
    compiledAt: now(),
    spineHash: params.spine.metadata.hash,
    inputs: {
      briefPath: toRepoRelative(params.briefPath, params.repoRoot),
      briefSha256: sha256OfObject(briefPayload),
      designPath: params.designPath ? toRepoRelative(params.designPath, params.repoRoot) : null,
      designSha256: designPayload ? sha256OfObject(designPayload) : null,
      templateName: templatePayload ? templatePayload.name : null,
      templateSha256: templatePayload ? sha256OfObject(templatePayload) : null,
      repoProfileSha256: sha256OfObject(repoPayload),
    },
    exports: params.exports.slice().sort((a, b) => a.path.localeCompare(b.path)),
  };
}

