import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { listTemplates, getTemplate } from "./registry.js";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBrief } from "../brief/parse.js";
import { compileSpine } from "../compiler/compile.js";

const FIXED_NOW = () => "2026-04-18T00:00:00.000Z";
const repoRoot = resolve(__dirname, "..", "..");

describe("template registry", () => {
  it("lists all 4 bundled templates", async () => {
    const all = await listTemplates();
    const names = all.map((t) => t.manifest.name).sort();
    expect(names).toEqual(["app-dashboard", "design-system", "docs-portal", "saas-marketing"]);
  });

  it("each template manifest validates and has a brief", async () => {
    const all = await listTemplates();
    for (const t of all) {
      expect(t.manifest.schemaVersion).toBe(1);
      expect(t.manifest.projectType).toBe(t.manifest.projectType);
      expect(t.briefPath.endsWith("brief.md")).toBe(true);
    }
  });

  it("design-system template ships with design-rules.md", async () => {
    const t = await getTemplate("design-system");
    expect(t.designPath).not.toBeNull();
    expect(t.designPath!.endsWith("design-rules.md")).toBe(true);
  });

  it("saas-marketing does not ship design-rules.md", async () => {
    const t = await getTemplate("saas-marketing");
    expect(t.designPath).toBeNull();
  });

  it("throws with available list when template name is wrong", async () => {
    await expect(getTemplate("nope")).rejects.toThrow(/not found/);
  });
});

describe("template contributions in compiler", () => {
  it("saas-marketing template injects extra routes / qa / agent rules", async () => {
    const brief = parseBrief(
      `---\nname: "acme"\nprojectType: "saas-marketing"\n---\n\n# Brief\n\n## Goals\n- Launch it.\n`,
      "brief.md"
    );
    const repo = await analyzeRepo(repoRoot);
    const template = (await getTemplate("saas-marketing")).manifest;

    const without = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const withTpl = compileSpine({ brief, repo, design: null, template, now: FIXED_NOW });

    expect(withTpl.scaffoldPlan.routes.length).toBeGreaterThan(without.scaffoldPlan.routes.length);
    expect(withTpl.qaGuardrails.length).toBeGreaterThan(without.qaGuardrails.length);
    expect(withTpl.componentGuidance.length).toBeGreaterThanOrEqual(without.componentGuidance.length);
    expect(withTpl.agentInstructions.unsafeActions.some((r) => r.text.includes("pricing"))).toBe(true);
    expect(withTpl.metadata.hash).not.toBe(without.metadata.hash);
    // rules from template carry kind: template source
    expect(withTpl.scaffoldPlan.routes.some((r) => r.source.kind === "template")).toBe(true);
  });

  it("emits conflict warning if template projectType disagrees with brief", async () => {
    const brief = parseBrief(
      `---\nname: "x"\nprojectType: "app-dashboard"\n---\n\n# Brief\n\n## Goals\n- Ship it.\n`,
      "brief.md"
    );
    const repo = await analyzeRepo(repoRoot);
    const template = (await getTemplate("saas-marketing")).manifest;
    const spine = compileSpine({ brief, repo, design: null, template, now: FIXED_NOW });
    const ids = spine.warnings.map((w) => w.id);
    expect(ids).toContain("conflict:template-project-type");
    // but brief's projectType wins
    expect(spine.projectType).toBe("app-dashboard");
  });

  it("docs-portal template contributes routes specific to docs", async () => {
    const brief = parseBrief(
      `---\nname: "docs"\nprojectType: "docs-portal"\n---\n\n# Brief\n\n## Goals\n- Ship docs.\n`,
      "brief.md"
    );
    const repo = await analyzeRepo(repoRoot);
    const template = (await getTemplate("docs-portal")).manifest;
    const spine = compileSpine({ brief, repo, design: null, template, now: FIXED_NOW });
    expect(spine.scaffoldPlan.routes.some((r) => r.text.startsWith("/quickstart"))).toBe(true);
    expect(spine.scaffoldPlan.routes.some((r) => r.text.startsWith("/changelog"))).toBe(true);
  });

  it("design-system template does not emit routes (it's a library)", async () => {
    const brief = parseBrief(
      `---\nname: "ds"\nprojectType: "design-system"\n---\n\n# Brief\n\n## Goals\n- Ship v1.\n`,
      "brief.md"
    );
    const repo = await analyzeRepo(repoRoot);
    const template = (await getTemplate("design-system")).manifest;
    const spine = compileSpine({ brief, repo, design: null, template, now: FIXED_NOW });
    expect(spine.scaffoldPlan.routes).toHaveLength(0);
    expect(spine.componentGuidance.some((r) => r.text.includes("Primitive set"))).toBe(true);
  });
});
