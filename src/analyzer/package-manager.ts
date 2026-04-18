import { exists, rootPath } from "./fs.js";
import type { PackageManager } from "../model/repo-profile.js";

export async function detectPackageManager(root: string): Promise<{
  value: PackageManager;
  confidence: number;
  evidence: string[];
}> {
  const lockfiles: Array<[PackageManager, string]> = [
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
    ["bun", "bun.lockb"],
    ["bun", "bun.lock"],
    ["npm", "package-lock.json"],
  ];
  const evidence: string[] = [];
  const hits: PackageManager[] = [];
  for (const [pm, file] of lockfiles) {
    if (await exists(rootPath(root, file))) {
      evidence.push(`found ${file}`);
      hits.push(pm);
    }
  }
  if (hits.length === 1) return { value: hits[0]!, confidence: 1, evidence };
  if (hits.length > 1) {
    return {
      value: hits[0]!,
      confidence: 0.5,
      evidence: [...evidence, `multiple lockfiles present — picked first: ${hits[0]}`],
    };
  }
  return { value: "unknown", confidence: 0, evidence: ["no lockfile found"] };
}
