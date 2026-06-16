import { describe, it, expect } from "vitest";
import { analyzeRepo } from "./index.js";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

describe("analyzeRepo — self test", () => {
  it("analyzes its own repo root", async () => {
    const root = resolve(__dirname, "..", "..");
    const profile = await analyzeRepo(root);

    expect(profile.schemaVersion).toBe(1);
    expect(profile.language.typescript).toBe(true);
    expect(profile.language.strict).toBe(true);
    expect(profile.framework.value).toBe("node-library");
    expect(profile.routing.value).toBe("none");
    expect(profile.testing.runners).toContain("vitest");
    // agent-file detection is observational — the repo may or may not have generated them already
    expect(typeof profile.agentFiles.agentsMd).toBe("boolean");
    expect(typeof profile.agentFiles.claudeMd).toBe("boolean");
  });

  it("is deterministic modulo the detectedAt timestamp", async () => {
    const root = resolve(__dirname, "..", "..");
    const a = await analyzeRepo(root);
    const b = await analyzeRepo(root);
    const { detectedAt: _a, ...aRest } = a;
    const { detectedAt: _b, ...bRest } = b;
    expect(aRest).toEqual(bRest);
  });

  it("does not warn when a package is clearly a Node library", async () => {
    const work = await mkdtemp(join(tmpdir(), "spine-node-library-"));
    try {
      await writeFile(
        join(work, "package.json"),
        JSON.stringify({ name: "library", type: "module", exports: { ".": "./dist/index.js" } }),
        "utf8",
      );
      const profile = await analyzeRepo(work);
      expect(profile.framework.value).toBe("node-library");
      expect(profile.framework.confidence).toBeGreaterThanOrEqual(0.5);
      expect(profile.warnings.some((warning) => warning.id === "framework-uncertain")).toBe(false);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });

  it("does not warn when a package uses a common Node API framework", async () => {
    const work = await mkdtemp(join(tmpdir(), "spine-node-api-"));
    try {
      await writeFile(
        join(work, "package.json"),
        JSON.stringify({ name: "api", type: "module", dependencies: { fastify: "5.0.0" } }),
        "utf8",
      );
      const profile = await analyzeRepo(work);
      expect(profile.framework.value).toBe("node-app");
      expect(profile.framework.confidence).toBeGreaterThanOrEqual(0.5);
      expect(profile.warnings.some((warning) => warning.id === "framework-uncertain")).toBe(false);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });
});
