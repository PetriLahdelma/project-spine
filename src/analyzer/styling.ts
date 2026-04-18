import { exists, rootPath } from "./fs.js";
import type { Styling } from "../model/repo-profile.js";

type Deps = Record<string, string>;
function allDeps(pkg: Record<string, unknown> | null): Deps {
  if (!pkg) return {};
  return {
    ...((pkg.dependencies as Deps) ?? {}),
    ...((pkg.devDependencies as Deps) ?? {}),
  };
}

export async function detectStyling(
  root: string,
  pkg: Record<string, unknown> | null
): Promise<{ value: Styling; confidence: number; evidence: string[] }> {
  const deps = allDeps(pkg);
  const hits: { kind: Styling; note: string }[] = [];

  if (deps["tailwindcss"] || (await hasAnyConfig(root, ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]))) {
    hits.push({ kind: "tailwind", note: "tailwind config or dependency" });
  }
  if (deps["@vanilla-extract/css"]) hits.push({ kind: "vanilla-extract", note: "@vanilla-extract/css" });
  if (deps["@pandacss/dev"]) hits.push({ kind: "panda", note: "@pandacss/dev" });
  if (deps["@stitches/react"]) hits.push({ kind: "stitches", note: "@stitches/react" });
  if (deps["styled-components"]) hits.push({ kind: "styled-components", note: "styled-components" });
  if (deps["@emotion/react"] || deps["@emotion/styled"]) hits.push({ kind: "emotion", note: "emotion" });

  const evidence = hits.map((h) => h.note);
  if (hits.length === 0) return { value: "unknown", confidence: 0, evidence: ["no styling library detected"] };
  if (hits.length === 1) return { value: hits[0]!.kind, confidence: 1, evidence };
  return { value: "mixed", confidence: 0.6, evidence: [...evidence, `multiple styling approaches: ${hits.map((h) => h.kind).join(", ")}`] };
}

async function hasAnyConfig(root: string, files: string[]): Promise<boolean> {
  for (const f of files) if (await exists(rootPath(root, f))) return true;
  return false;
}
