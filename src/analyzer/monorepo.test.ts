import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeRepo } from "./index.js";

describe("monorepo detection", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-mono-"));
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("detects a pnpm workspace and emits the monorepo-detected warning", async () => {
    await writeFile(join(work, "package.json"), JSON.stringify({ name: "mono" }), "utf8");
    await writeFile(join(work, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n", "utf8");
    await mkdir(join(work, "apps", "web"), { recursive: true });
    await mkdir(join(work, "packages", "ui"), { recursive: true });
    await writeFile(join(work, "apps", "web", "package.json"), JSON.stringify({ name: "@mono/web", dependencies: { next: "14.0.0" } }), "utf8");

    const profile = await analyzeRepo(work);
    expect(profile.monorepo.isMonorepo).toBe(true);
    expect(profile.monorepo.tool).toBe("pnpm");
    expect(profile.monorepo.workspaces).toEqual(expect.arrayContaining(["apps/web", "packages/ui"]));

    const ids = profile.warnings.map((w) => w.id);
    expect(ids).toContain("monorepo-detected");
    // framework-uncertain should NOT fire when monorepo is detected
    expect(ids).not.toContain("framework-uncertain");
  });

  it("detects an npm workspaces monorepo", async () => {
    await writeFile(
      join(work, "package.json"),
      JSON.stringify({ name: "mono", workspaces: ["apps/*"] }),
      "utf8"
    );
    await mkdir(join(work, "apps", "web"), { recursive: true });
    await writeFile(join(work, "apps", "web", "package.json"), JSON.stringify({ name: "w" }), "utf8");

    const profile = await analyzeRepo(work);
    expect(profile.monorepo.isMonorepo).toBe(true);
    expect(profile.monorepo.tool).toBe("npm");
    expect(profile.warnings.some((w) => w.id === "monorepo-detected")).toBe(true);
  });

  it("reports isMonorepo=false for a regular repo", async () => {
    await writeFile(
      join(work, "package.json"),
      JSON.stringify({ name: "solo", dependencies: { next: "14.0.0" } }),
      "utf8"
    );
    await mkdir(join(work, "app"), { recursive: true });

    const profile = await analyzeRepo(work);
    expect(profile.monorepo.isMonorepo).toBe(false);
    expect(profile.warnings.some((w) => w.id === "monorepo-detected")).toBe(false);
  });
});
