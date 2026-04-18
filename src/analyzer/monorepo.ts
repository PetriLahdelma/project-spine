import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { exists, readText, rootPath } from "./fs.js";
import type { Monorepo } from "../model/repo-profile.js";

export async function detectMonorepo(
  root: string,
  pkg: Record<string, unknown> | null
): Promise<Monorepo> {
  const evidence: string[] = [];
  const workspacePatterns: string[] = [];
  let tool: Monorepo["tool"] = null;

  // npm/yarn/bun: workspaces field in package.json
  if (pkg && Array.isArray((pkg as { workspaces?: unknown }).workspaces)) {
    const ws = (pkg as { workspaces: string[] }).workspaces;
    workspacePatterns.push(...ws);
    evidence.push(`package.json "workspaces": ${ws.join(", ")}`);
    tool = "npm";
  } else if (pkg && typeof (pkg as { workspaces?: unknown }).workspaces === "object") {
    const ws = (pkg as { workspaces: { packages?: string[] } }).workspaces;
    if (Array.isArray(ws.packages)) {
      workspacePatterns.push(...ws.packages);
      evidence.push(`package.json "workspaces.packages": ${ws.packages.join(", ")}`);
      tool = "npm";
    }
  }

  // pnpm-workspace.yaml
  if (await exists(rootPath(root, "pnpm-workspace.yaml"))) {
    const raw = await readText(rootPath(root, "pnpm-workspace.yaml"));
    try {
      const parsed = raw ? (parseYaml(raw) as { packages?: string[] } | null) : null;
      if (parsed && Array.isArray(parsed.packages)) {
        workspacePatterns.push(...parsed.packages);
        evidence.push(`pnpm-workspace.yaml: ${parsed.packages.join(", ")}`);
        tool = "pnpm";
      }
    } catch {
      evidence.push("pnpm-workspace.yaml present but unparseable");
    }
  }

  // turbo.json / nx.json presence (doesn't itself imply workspaces but signals intent)
  if (await exists(rootPath(root, "turbo.json"))) {
    evidence.push("turbo.json present");
    tool = tool ?? "turbo";
  }
  if (await exists(rootPath(root, "nx.json"))) {
    evidence.push("nx.json present");
    tool = tool ?? "nx";
  }

  // resolve glob patterns to actual workspace directories
  const workspaces: string[] = [];
  if (workspacePatterns.length > 0) {
    const matches = await fg(
      workspacePatterns.map((p) => (p.endsWith("/*") || p.endsWith("/**") ? p : p + "/")),
      { cwd: root, onlyDirectories: true, deep: 3 }
    );
    workspaces.push(...matches.sort());
  }

  if (workspacePatterns.length === 0 && tool === null) {
    return { isMonorepo: false, tool: null, workspaces: [], evidence: [] };
  }

  return { isMonorepo: true, tool: tool ?? "unknown", workspaces, evidence };
}
