import { exists, rootPath } from "./fs.js";

type Deps = Record<string, string>;
function allDeps(pkg: Record<string, unknown> | null): Deps {
  if (!pkg) return {};
  return {
    ...((pkg.dependencies as Deps) ?? {}),
    ...((pkg.devDependencies as Deps) ?? {}),
  };
}

type Runner = "vitest" | "jest" | "playwright" | "cypress" | "testing-library";

export async function detectTesting(
  root: string,
  pkg: Record<string, unknown> | null
): Promise<{
  runners: Runner[];
  storybook: boolean;
  storybookVersion: string | null;
  evidence: string[];
}> {
  const deps = allDeps(pkg);
  const runners: Runner[] = [];
  const evidence: string[] = [];
  if (deps["vitest"]) {
    runners.push("vitest");
    evidence.push(`vitest@${deps["vitest"]}`);
  }
  if (deps["jest"]) {
    runners.push("jest");
    evidence.push(`jest@${deps["jest"]}`);
  }
  if (deps["@playwright/test"]) {
    runners.push("playwright");
    evidence.push(`@playwright/test@${deps["@playwright/test"]}`);
  }
  if (deps["cypress"]) {
    runners.push("cypress");
    evidence.push(`cypress@${deps["cypress"]}`);
  }
  if (deps["@testing-library/react"] || deps["@testing-library/vue"] || deps["@testing-library/svelte"]) {
    runners.push("testing-library");
    evidence.push("@testing-library present");
  }

  const sbKey = Object.keys(deps).find((d) => d === "@storybook/react" || d === "@storybook/nextjs" || d === "storybook");
  const sbVersion = sbKey ? (deps[sbKey] ?? null) : null;
  const storybookConfigPresent = await exists(rootPath(root, ".storybook"));
  const storybook = Boolean(sbKey) || storybookConfigPresent;
  if (storybook) evidence.push(storybookConfigPresent ? ".storybook/ directory" : `${sbKey}@${sbVersion}`);

  return { runners, storybook, storybookVersion: sbVersion, evidence };
}
