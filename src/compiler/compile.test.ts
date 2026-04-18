import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile, parseBrief } from "../brief/parse.js";
import { parseDesign } from "../design/parse.js";
import { compileSpine } from "./compile.js";
import { stableStringify } from "./hash.js";

const FIXED_NOW = () => "2026-04-18T00:00:00.000Z";

const repoRoot = resolve(__dirname, "..", "..");
const briefPath = resolve(repoRoot, "examples", "brief.md");

describe("compileSpine — examples + self repo", () => {
  it("produces a valid SpineModel from the sample brief against this repo", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });

    expect(spine.metadata.schemaVersion).toBe(1);
    expect(spine.metadata.name).toBe("Acme Payroll Marketing Site");
    expect(spine.projectType).toBe("saas-marketing");
    expect(spine.goals.length).toBeGreaterThanOrEqual(4);
    expect(spine.constraints.length).toBeGreaterThanOrEqual(3);

    // stack mirrors repo profile
    expect(spine.stack.language).toBe("typescript");
    expect(spine.stack.testing).toContain("vitest");

    // baseline rule sets fire
    expect(spine.a11yRules.length).toBeGreaterThan(0);
    expect(spine.qaGuardrails.length).toBeGreaterThan(0);
    expect(spine.agentInstructions.dosAndDonts.length).toBeGreaterThan(0);
    expect(spine.agentInstructions.unsafeActions.length).toBeGreaterThan(0);

    // every rule has a source pointer
    for (const rule of [...spine.goals, ...spine.qaGuardrails, ...spine.a11yRules]) {
      expect(rule.source.kind).toBeDefined();
      expect(rule.source.pointer).toBeTruthy();
    }
  });

  it("is deterministic — identical inputs produce identical spine (modulo createdAt)", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const a = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const b = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    expect(stableStringify(a)).toBe(stableStringify(b));
    expect(a.metadata.hash).toBe(b.metadata.hash);
  });

  it("hash changes when any input changes", async () => {
    const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(repoRoot)]);
    const base = compileSpine({ brief, repo, design: null, now: FIXED_NOW });

    const modifiedBrief = {
      ...brief,
      sections: {
        ...brief.sections,
        goals: [
          ...brief.sections.goals,
          {
            text: "New surprise goal.",
            source: { kind: "brief" as const, pointer: "brief.md#extra" },
          },
        ],
      },
    };
    const shifted = compileSpine({ brief: modifiedBrief, repo, design: null, now: FIXED_NOW });
    expect(shifted.metadata.hash).not.toBe(base.metadata.hash);
  });

  it("propagates warnings from brief, repo, and design with prefixed ids", async () => {
    const brief = parseBrief(
      `# Brief

## Goals
- Do something vague.
`,
      "tiny.md"
    );
    const [repo] = await Promise.all([analyzeRepo(repoRoot)]);
    const design = parseDesign(`# Design\n`, "empty-design.md");
    const spine = compileSpine({ brief, repo, design, now: FIXED_NOW });
    const ids = spine.warnings.map((w) => w.id);
    expect(ids.some((id) => id.startsWith("brief:"))).toBe(true);
    expect(ids.some((id) => id.startsWith("repo:"))).toBe(true);
    expect(ids.some((id) => id.startsWith("design:"))).toBe(true);
  });

  it("merges design rules into designRules + uxRules + componentGuidance", async () => {
    const brief = await parseBriefFromFile(briefPath);
    const repo = await analyzeRepo(repoRoot);
    const design = parseDesign(
      `# Design

## Tokens
- Use tokens from acme-tokens.json; never hardcode color.

## Components
- All buttons must use the shared Button primitive.

## UX
- Motion under 200ms unless it conveys progress.

## Accessibility
- Every modal must trap focus.
`,
      "design.md"
    );
    const spine = compileSpine({ brief, repo, design, now: FIXED_NOW });
    expect(spine.designRules.length).toBe(4);
    expect(spine.uxRules.some((r) => r.text.includes("Motion under 200ms"))).toBe(true);
    expect(spine.componentGuidance.some((r) => r.text.includes("Button primitive"))).toBe(true);
  });

  it("populates scaffoldPlan.sprint1 from brief goals", async () => {
    const brief = await parseBriefFromFile(briefPath);
    const repo = await analyzeRepo(repoRoot);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    expect(spine.scaffoldPlan.sprint1.length).toBeGreaterThan(0);
    expect(spine.scaffoldPlan.sprint1[0]!.text).toContain("Deliver:");
  });
});
