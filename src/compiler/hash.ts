import { createHash } from "node:crypto";
import type { NormalizedBrief } from "../model/brief.js";
import type { RepoProfile } from "../model/repo-profile.js";
import type { DesignRules } from "../model/design-rules.js";
import type { TemplateManifest } from "../templates/model.js";

export function computeInputHash(
  brief: NormalizedBrief,
  repo: RepoProfile,
  design: DesignRules | null,
  template: TemplateManifest | null = null
): string {
  const payload = {
    brief: stripTimestamps(brief),
    repo: stripTimestamps(repo),
    design: design ? stripTimestamps(design) : null,
    template: template ? { name: template.name, schemaVersion: template.schemaVersion, contributes: template.contributes } : null,
  };
  const json = stableStringify(payload);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
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
