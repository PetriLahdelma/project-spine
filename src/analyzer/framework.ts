import { exists, isDir, rootPath } from "./fs.js";
import type { Framework, Routing } from "../model/repo-profile.js";

type Deps = Record<string, string>;

function allDeps(pkg: Record<string, unknown> | null): Deps {
  if (!pkg) return {};
  return {
    ...((pkg.dependencies as Deps) ?? {}),
    ...((pkg.devDependencies as Deps) ?? {}),
    ...((pkg.peerDependencies as Deps) ?? {}),
  };
}

export async function detectFramework(
  root: string,
  pkg: Record<string, unknown> | null
): Promise<{ value: Framework; confidence: number; evidence: string[] }> {
  const deps = allDeps(pkg);
  const evidence: string[] = [];

  if (deps["next"]) {
    evidence.push(`next@${deps["next"]} in dependencies`);
    return { value: "next", confidence: 1, evidence };
  }
  if (deps["@remix-run/react"] || deps["@remix-run/node"]) {
    evidence.push(`remix packages in dependencies`);
    return { value: "remix", confidence: 1, evidence };
  }
  if (deps["astro"]) {
    evidence.push(`astro@${deps["astro"]}`);
    return { value: "astro", confidence: 1, evidence };
  }
  if (deps["@sveltejs/kit"]) {
    evidence.push(`@sveltejs/kit in dependencies`);
    return { value: "sveltekit", confidence: 1, evidence };
  }
  if (deps["nuxt"] || deps["nuxt3"]) {
    evidence.push(`nuxt in dependencies`);
    return { value: "nuxt", confidence: 1, evidence };
  }
  if (deps["expo"]) {
    evidence.push(`expo in dependencies`);
    return { value: "expo", confidence: 1, evidence };
  }
  if (deps["vite"]) {
    if (deps["react"]) {
      evidence.push("vite + react");
      return { value: "vite-react", confidence: 0.9, evidence };
    }
    if (deps["vue"]) {
      evidence.push("vite + vue");
      return { value: "vite-vue", confidence: 0.9, evidence };
    }
    if (deps["svelte"]) {
      evidence.push("vite + svelte");
      return { value: "vite-svelte", confidence: 0.9, evidence };
    }
  }
  if (pkg) {
    const isLibrary = Boolean((pkg as { main?: string; module?: string; exports?: unknown }).exports ||
      (pkg as { main?: string }).main);
    evidence.push(isLibrary ? "no framework dep; looks like a node library" : "no framework dep detected");
    return { value: isLibrary ? "node-library" : "node-app", confidence: 0.4, evidence };
  }

  // no package.json at all
  if (await exists(rootPath(root, "package.json"))) {
    evidence.push("package.json unreadable");
  } else {
    evidence.push("no package.json");
  }
  return { value: "unknown", confidence: 0, evidence };
}

export async function detectRouting(
  root: string,
  framework: Framework
): Promise<{ value: Routing; confidence: number; evidence: string[] }> {
  const evidence: string[] = [];
  if (framework === "next") {
    const appDir = await isDir(rootPath(root, "app"));
    const srcAppDir = await isDir(rootPath(root, "src", "app"));
    const pagesDir = await isDir(rootPath(root, "pages"));
    const srcPagesDir = await isDir(rootPath(root, "src", "pages"));
    const hasApp = appDir || srcAppDir;
    const hasPages = pagesDir || srcPagesDir;
    if (hasApp && hasPages) {
      evidence.push("both app/ and pages/ directories present");
      return { value: "next-hybrid", confidence: 1, evidence };
    }
    if (hasApp) {
      evidence.push(appDir ? "app/ directory" : "src/app/ directory");
      return { value: "next-app-router", confidence: 1, evidence };
    }
    if (hasPages) {
      evidence.push(pagesDir ? "pages/ directory" : "src/pages/ directory");
      return { value: "next-pages-router", confidence: 1, evidence };
    }
    evidence.push("Next detected but neither app/ nor pages/ found");
    return { value: "unknown", confidence: 0.2, evidence };
  }
  if (framework === "remix") return { value: "remix", confidence: 1, evidence: ["remix"] };
  if (framework === "astro") return { value: "astro", confidence: 1, evidence: ["astro"] };
  if (framework === "sveltekit") return { value: "sveltekit", confidence: 1, evidence: ["sveltekit"] };
  if (framework === "nuxt") return { value: "nuxt", confidence: 1, evidence: ["nuxt"] };
  if (framework === "vite-react") {
    // react-router?
    evidence.push("vite+react — routing inspection deferred");
    return { value: "unknown", confidence: 0.3, evidence };
  }
  if (framework === "node-library" || framework === "node-app") {
    return { value: "none", confidence: 0.8, evidence: ["non-routed framework"] };
  }
  return { value: "unknown", confidence: 0, evidence: ["framework unknown"] };
}
