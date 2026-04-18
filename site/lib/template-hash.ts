import { createHash } from "node:crypto";

/** Stable JSON stringify (sorted keys) — mirrors the CLI's canonicalization. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify((value as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

export function templateContentHash(params: {
  name: string;
  title: string;
  description: string;
  projectType: string;
  manifestJson: unknown;
  briefMd: string;
  designRulesMd: string | null;
}): string {
  const payload = {
    name: params.name,
    title: params.title,
    description: params.description,
    projectType: params.projectType,
    manifest: params.manifestJson,
    briefMd: params.briefMd,
    designRulesMd: params.designRulesMd,
  };
  return "sha256:" + createHash("sha256").update(stableStringify(payload)).digest("hex");
}
