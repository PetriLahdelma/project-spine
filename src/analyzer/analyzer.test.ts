import { describe, it, expect } from "vitest";
import { analyzeRepo } from "./index.js";
import { resolve } from "node:path";

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
});
