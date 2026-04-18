import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBrief, parseBriefFromFile } from "../brief/parse.js";
import { compileSpine } from "./compile.js";
import { renderSprint1Backlog } from "../exporters/sprint-1-backlog.js";

const FIXED_NOW = () => "2026-04-18T00:00:00.000Z";
const repoRoot = resolve(__dirname, "..", "..");

describe("sprint-1 setup + deliver split", () => {
  it("setup items have id prefix 'setup-' and deliver items don't", async () => {
    const brief = await parseBriefFromFile(resolve(repoRoot, "examples", "brief.md"));
    const repo = await analyzeRepo(repoRoot);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });

    const setup = spine.scaffoldPlan.sprint1.filter((i) => i.id.startsWith("setup-"));
    const deliver = spine.scaffoldPlan.sprint1.filter((i) => !i.id.startsWith("setup-"));
    expect(deliver.length).toBeGreaterThan(0);
    expect(deliver.every((d) => d.text.startsWith("Deliver:"))).toBe(true);
    // setup may be empty if the repo is already in good shape; just check the classification works
    for (const s of setup) {
      expect(s.source.kind).toBe("inference");
      expect(s.source.pointer.startsWith("inferred:setup/")).toBe(true);
    }
  });

  it("setup items appear for a repo missing agent files and tests", () => {
    const brief = parseBrief(
      `---\nname: "x"\nprojectType: "saas-marketing"\n---\n\n# Brief\n\n## Goals\n- Launch site.\n`,
      "brief.md"
    );
    const fakeRepo = {
      schemaVersion: 1 as const,
      root: "/fake",
      detectedAt: "2026-04-18T00:00:00.000Z",
      packageManager: { value: "npm" as const, confidence: 1, evidence: [] },
      framework: { value: "next" as const, confidence: 1, evidence: [] },
      routing: { value: "next-app-router" as const, confidence: 1, evidence: [] },
      styling: { value: "tailwind" as const, confidence: 1, evidence: [] },
      language: { typescript: true, strict: false, evidence: [] },
      testing: { runners: [], storybook: false, storybookVersion: null, evidence: [] },
      linting: { eslint: false, biome: false, prettier: false, oxlint: false, evidence: [] },
      ci: { githubActions: false, workflows: [], other: [], evidence: [] },
      agentFiles: { agentsMd: false, claudeMd: false, copilotInstructions: false, cursorRules: false, projectSpineDir: false },
      rawPackageJson: { name: "x" } as Record<string, unknown>,
      warnings: [],
    };
    const spine = compileSpine({ brief, repo: fakeRepo, design: null, now: FIXED_NOW });
    const setupIds = spine.scaffoldPlan.sprint1
      .filter((i) => i.id.startsWith("setup-"))
      .map((i) => i.source.pointer);
    expect(setupIds).toContain("inferred:setup/agent-files");
    expect(setupIds).toContain("inferred:setup/ts-strict");
    expect(setupIds).toContain("inferred:setup/lint");
    expect(setupIds).toContain("inferred:setup/tests");
    expect(setupIds).toContain("inferred:setup/ci");
  });

  it("sprint-1-backlog.md renders Setup and Deliver sections separately", async () => {
    const brief = await parseBriefFromFile(resolve(repoRoot, "examples", "brief.md"));
    const repo = await analyzeRepo(repoRoot);
    const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
    const rendered = renderSprint1Backlog(spine);
    // deliver section always present for the fixture brief
    expect(rendered).toContain("## Deliver — sprint goals");
    // setup section only present if there are setup items
    const hasSetup = spine.scaffoldPlan.sprint1.some((i) => i.id.startsWith("setup-"));
    if (hasSetup) {
      expect(rendered).toContain("## Setup — clear the runway");
    }
  });
});
