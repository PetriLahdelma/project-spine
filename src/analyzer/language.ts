import { exists, readJson, rootPath } from "./fs.js";

export async function detectLanguage(root: string): Promise<{
  typescript: boolean;
  strict: boolean | null;
  evidence: string[];
}> {
  const evidence: string[] = [];
  const tsconfigPath = rootPath(root, "tsconfig.json");
  const tsconfigExists = await exists(tsconfigPath);
  if (!tsconfigExists) {
    return { typescript: false, strict: null, evidence: ["no tsconfig.json"] };
  }
  evidence.push("tsconfig.json present");
  const tsconfig = await readJson<{ compilerOptions?: { strict?: boolean } }>(tsconfigPath);
  const strict = tsconfig?.compilerOptions?.strict ?? null;
  if (strict === true) evidence.push("compilerOptions.strict = true");
  else if (strict === false) evidence.push("compilerOptions.strict = false");
  else evidence.push("compilerOptions.strict not set (inherits)");
  return { typescript: true, strict, evidence };
}
