import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile, parseBrief } from "../brief/parse.js";
import { parseDesign } from "../design/parse.js";
import { compileSpine } from "../compiler/compile.js";
import { renderAllExports, parseTargets, ALL_TARGETS, exportFilename } from "./index.js";

const FIXED_NOW = () => "2026-04-18T00:00:00.000Z";
const repoRoot = resolve(__dirname, "..", "..");
const briefPath = resolve(repoRoot, "examples", "brief.md");

describe("exporters — render all", () => {
  it("produces non-empty content for every target", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const rendered = renderAllExports(spine);
    for (const target of ALL_TARGETS) {
      const content = rendered[target];
      expect(content.length).toBeGreaterThan(80);
      expect(content).toContain("spine.json"); // every export references the source of truth
    }
  });

  it("AGENTS.md includes stack line and do/don't", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const { agents } = renderAllExports(spine);
    expect(agents).toContain("# AGENTS.md");
    expect(agents).toContain("**Stack:**");
    expect(agents).toContain("Do / Don't");
    expect(agents).toContain("Never do this");
    expect(agents).toContain(spine.metadata.hash);
  });

  it("CLAUDE.md uses @import for deeper docs", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const { claude } = renderAllExports(spine);
    expect(claude).toContain("@.project-spine/exports/architecture-summary.md");
    expect(claude).toContain("@.project-spine/exports/qa-guardrails.md");
    expect(claude).toContain("@AGENTS.md");
  });

  it("copilot-instructions.md is self-contained (no @import)", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const { copilot } = renderAllExports(spine);
    expect(copilot).not.toContain("@.project-spine/");
    expect(copilot).toContain("Repo conventions");
    expect(copilot).toContain("Accessibility");
  });

  it("sprint-1-backlog.md has acceptance checkboxes and source traces", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const { backlog } = renderAllExports(spine);
    expect(backlog).toContain("- [ ]");
    expect(backlog).toMatch(/\*\*Source:\*\* `brief:/);
  });

  it("rationale.md is client-safe (no rule traces in bullets)", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const { rationale } = renderAllExports(spine);
    // no raw pointer traces leaking into client-facing doc
    expect(rationale).not.toMatch(/`brief:/);
    expect(rationale).not.toMatch(/`repo:/);
    expect(rationale).not.toMatch(/`inference:/);
    expect(rationale).toContain("What we are building");
  });

  it("is deterministic — identical spine produces identical exports", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const a = renderAllExports(spine);
    const b = renderAllExports(spine);
    for (const target of ALL_TARGETS) {
      expect(a[target]).toBe(b[target]);
    }
  });

  it("design rules flow into componentGuidance inside component-plan.md", async () => {
    const brief = await parseBriefFromFile(briefPath);
    const repo = await analyzeRepo(repoRoot);
    const design = parseDesign(
      `# Design

## Components
- Only use the shared Button primitive for all CTAs.

## Tokens
- Reference acme-tokens.json; never hardcode color.
`,
      "design.md"
    );
    const spine = compileSpine({ brief, repo, design, now: FIXED_NOW });
    const { components } = renderAllExports(spine);
    expect(components).toContain("Only use the shared Button primitive");
  });

  it("parseTargets resolves 'all' and comma lists", () => {
    expect(parseTargets("all").length).toBe(ALL_TARGETS.length);
    expect(parseTargets("agents,claude")).toEqual(["agents", "claude"]);
    expect(() => parseTargets("nope")).toThrow();
  });

  it("parseTargets error names the bad value and lists valid options", () => {
    try {
      parseTargets("typo,agents");
      expect.fail("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('"typo"');
      expect(msg).toContain("agents");
      expect(msg).toContain("claude");
      expect(msg).toContain("--targets=all");
    }
  });

  it("filenames match conventional tool locations", () => {
    expect(exportFilename("agents")).toBe("AGENTS.md");
    expect(exportFilename("claude")).toBe("CLAUDE.md");
    expect(exportFilename("copilot")).toBe("copilot-instructions.md");
  });

  it("warnings surface in AGENTS.md and scaffold-plan", () => {
    const brief = parseBrief(`# Brief\n\n## Goals\n- Ship vaguely.\n`, "vague.md");
    const fakeRepo = {
      schemaVersion: 1 as const,
      root: "/fake",
      detectedAt: "2026-04-18T00:00:00.000Z",
      packageManager: { value: "npm" as const, confidence: 1, evidence: [] },
      framework: { value: "unknown" as const, confidence: 0, evidence: [] },
      routing: { value: "unknown" as const, confidence: 0, evidence: [] },
      styling: { value: "unknown" as const, confidence: 0, evidence: [] },
      language: { typescript: false, strict: null, evidence: [] },
      testing: { runners: [], storybook: false, storybookVersion: null, evidence: [] },
      linting: { eslint: false, biome: false, prettier: false, oxlint: false, evidence: [] },
      ci: { githubActions: false, workflows: [], other: [], evidence: [] },
      agentFiles: { agentsMd: false, claudeMd: false, copilotInstructions: false, cursorRules: false, projectSpineDir: false },
      rawPackageJson: null,
      warnings: [
        { id: "no-package-json", severity: "warn" as const, message: "No package.json found." },
      ],
    };
    const spine = compileSpine({ brief, repo: fakeRepo, design: null, now: FIXED_NOW });
    const { agents, scaffold } = renderAllExports(spine);
    expect(agents).toContain("Open warnings");
    expect(scaffold).toContain("Warnings worth resolving");
  });
});
