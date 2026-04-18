import { exists, rootPath } from "./fs.js";

type Deps = Record<string, string>;
function allDeps(pkg: Record<string, unknown> | null): Deps {
  if (!pkg) return {};
  return {
    ...((pkg.dependencies as Deps) ?? {}),
    ...((pkg.devDependencies as Deps) ?? {}),
  };
}

export async function detectLinting(
  root: string,
  pkg: Record<string, unknown> | null
): Promise<{
  eslint: boolean;
  biome: boolean;
  prettier: boolean;
  oxlint: boolean;
  evidence: string[];
}> {
  const deps = allDeps(pkg);
  const evidence: string[] = [];
  const eslint =
    Boolean(deps["eslint"]) ||
    (await exists(rootPath(root, "eslint.config.js"))) ||
    (await exists(rootPath(root, "eslint.config.mjs"))) ||
    (await exists(rootPath(root, ".eslintrc.json"))) ||
    (await exists(rootPath(root, ".eslintrc.cjs")));
  if (eslint) evidence.push("eslint detected");

  const biome = Boolean(deps["@biomejs/biome"]) || (await exists(rootPath(root, "biome.json")));
  if (biome) evidence.push("biome detected");

  const prettier =
    Boolean(deps["prettier"]) ||
    (await exists(rootPath(root, ".prettierrc"))) ||
    (await exists(rootPath(root, "prettier.config.js"))) ||
    (await exists(rootPath(root, "prettier.config.mjs")));
  if (prettier) evidence.push("prettier detected");

  const oxlint = Boolean(deps["oxlint"]);
  if (oxlint) evidence.push("oxlint detected");

  return { eslint, biome, prettier, oxlint, evidence };
}
