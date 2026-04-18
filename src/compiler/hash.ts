import { createHash } from "node:crypto";
import type { NormalizedBrief } from "../model/brief.js";
import type { RepoProfile } from "../model/repo-profile.js";
import type { DesignRules } from "../model/design-rules.js";
import type { TemplateManifest } from "../templates/model.js";

/**
 * Compute a content-addressable hash of the compile inputs.
 *
 * The payload is first canonicalized to remove anything Spine itself writes
 * (agent files, the .project-spine/ directory, the "no-agent-files" warning)
 * so compile is idempotent — running it twice in a row must produce the same
 * hash even though the first run creates files the analyzer would otherwise
 * pick up on the second run.
 */
export function computeInputHash(
  brief: NormalizedBrief,
  repo: RepoProfile,
  design: DesignRules | null,
  template: TemplateManifest | null = null
): string {
  const payload = {
    brief: canonicalizeForHash(brief),
    repo: canonicalizeRepoForHash(repo),
    design: design ? canonicalizeForHash(design) : null,
    template: template ? { name: template.name, schemaVersion: template.schemaVersion, contributes: template.contributes } : null,
  };
  const json = stableStringify(payload);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

export function canonicalizeForHash<T extends Record<string, unknown>>(obj: T): Omit<T, "parsedAt" | "detectedAt"> {
  const { parsedAt: _p, detectedAt: _d, ...rest } = obj as Record<string, unknown>;
  return rest as Omit<T, "parsedAt" | "detectedAt">;
}

/**
 * Repo-specific canonicalization: strip agent-files Spine itself writes, the
 * .project-spine/ directory it maintains, and the self-referential
 * `no-agent-files` warning. These fields would otherwise cause the hash to
 * flip between the first and second compile of an otherwise identical repo.
 */
export function canonicalizeRepoForHash(repo: RepoProfile): Record<string, unknown> {
  const base = canonicalizeForHash(repo) as Record<string, unknown>;
  const filteredWarnings = (repo.warnings ?? []).filter((w) => w.id !== "no-agent-files");
  return {
    ...base,
    agentFiles: undefined,
    warnings: filteredWarnings,
  };
}

function stripTimestamps<T extends Record<string, unknown>>(obj: T): Omit<T, "parsedAt" | "detectedAt"> {
  const { parsedAt: _p, detectedAt: _d, ...rest } = obj as Record<string, unknown>;
  return rest as Omit<T, "parsedAt" | "detectedAt">;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify((value as Record<string, unknown>)[k])).join(",") + "}";
}

export function shortId(prefix: string, parts: string[]): string {
  const base = createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 8);
  return `${prefix}-${base}`;
}
