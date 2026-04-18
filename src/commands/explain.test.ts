import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBrief } from "../brief/parse.js";
import { compileSpine } from "../compiler/compile.js";

describe("warning suggestions", () => {
  it("brief warnings carry resolution suggestions", () => {
    const brief = parseBrief(`# Brief\n\n## Goals\n- Ship vaguely.\n`, "vague.md");
    const missing = brief.warnings.find((w) => w.id === "missing-sections");
    expect(missing?.suggestion).toMatch(/Open `brief\.md`/);
    const uncertain = brief.warnings.find((w) => w.id === "project-type-uncertain");
    expect(uncertain?.suggestion).toMatch(/projectType/);
  });

  it("compile propagates suggestion into SpineWarning", async () => {
    const brief = parseBrief(`# Brief\n\n## Goals\n- ship\n`, "vague.md");
    const repoRoot = resolve(__dirname, "..", "..");
    const repo = await analyzeRepo(repoRoot);
    const spine = compileSpine({ brief, repo, design: null, now: () => "2026-04-18T00:00:00.000Z" });

    const withSuggestions = spine.warnings.filter((w) => typeof w.suggestion === "string");
    expect(withSuggestions.length).toBeGreaterThan(0);
    // propagated ids keep the brief:/repo: prefix
    expect(withSuggestions.every((w) => /^(brief|repo|design|conflict):/.test(w.id))).toBe(true);
  });

  it("conflict warnings include suggestions", async () => {
    const brief = parseBrief(
      `---\nname: "x"\nprojectType: "app-dashboard"\n---\n\n# Brief\n\n## Goals\n- Ship.\n`,
      "brief.md"
    );
    const repoRoot = resolve(__dirname, "..", "..");
    const repo = await analyzeRepo(repoRoot);
    const { getTemplate } = await import("../templates/registry.js");
    const template = (await getTemplate("saas-marketing")).manifest;
    const spine = compileSpine({ brief, repo, design: null, template, now: () => "2026-04-18T00:00:00.000Z" });
    const conflict = spine.warnings.find((w) => w.id === "conflict:template-project-type");
    expect(conflict?.suggestion).toMatch(/Either change the brief/);
  });
});
