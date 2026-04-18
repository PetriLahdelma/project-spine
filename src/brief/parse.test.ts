import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { parseBrief, parseBriefFromFile } from "./parse.js";

describe("parseBrief — examples/brief.md", () => {
  it("parses the sample brief into all canonical sections", async () => {
    const path = resolve(__dirname, "..", "..", "examples", "brief.md");
    const brief = await parseBriefFromFile(path);

    expect(brief.name).toBe("Acme Payroll Marketing Site");
    expect(brief.projectType).toBe("saas-marketing");
    expect(brief.projectTypeConfidence).toBe(1);

    expect(brief.sections.goals.length).toBeGreaterThanOrEqual(4);
    expect(brief.sections.audience.length).toBeGreaterThanOrEqual(2);
    expect(brief.sections.constraints.length).toBeGreaterThanOrEqual(3);
    expect(brief.sections.assumptions.length).toBeGreaterThanOrEqual(2);
    expect(brief.sections.risks.length).toBeGreaterThanOrEqual(2);
    expect(brief.sections.successCriteria.length).toBeGreaterThanOrEqual(3);

    // source pointers must be populated
    for (const item of brief.sections.goals) {
      expect(item.source.kind).toBe("brief");
      expect(item.source.pointer).toMatch(/brief\.md#section\d+\/item\d+/);
    }

    expect(brief.warnings).toEqual([]);
  });
});

describe("parseBrief — edge cases", () => {
  it("fires warnings for missing sections", () => {
    const brief = parseBrief(
      `---
name: "Tiny brief"
projectType: "saas-marketing"
---

# Project brief

## Goals
- Launch something.
`,
      "tiny.md"
    );
    const ids = brief.warnings.map((w) => w.id);
    expect(ids).toContain("missing-sections");
    expect(brief.sections.goals).toHaveLength(1);
    expect(brief.sections.audience).toHaveLength(0);
  });

  it("classifies by keywords when frontmatter is missing", () => {
    const brief = parseBrief(
      `# Brief

## Goals
- Ship a documentation site with an API reference for our SDK.
- Include a developer docs portal.
`,
      "docs.md"
    );
    expect(brief.projectType).toBe("docs-portal");
    expect(brief.projectTypeConfidence).toBeGreaterThan(0.5);
  });

  it("fires warning when project type cannot be inferred", () => {
    const brief = parseBrief(
      `# Brief

## Goals
- Do something vaguely.
`,
      "vague.md"
    );
    expect(brief.projectType).toBe("other");
    expect(brief.warnings.map((w) => w.id)).toContain("project-type-uncertain");
  });

  it("captures unknown sections without losing them silently", () => {
    const brief = parseBrief(
      `# Brief

## Goals
- Goal one.

## Random thing
- Something weird.
`,
      "weird.md"
    );
    expect(brief.unknownSections).toHaveLength(1);
    expect(brief.unknownSections[0]!.heading).toBe("Random thing");
    expect(brief.warnings.map((w) => w.id)).toContain("unknown-sections");
  });

  it("handles alias headings ('Out of scope' → nonGoals)", () => {
    const brief = parseBrief(
      `# Brief

## Goals
- Goal one.

## Out of scope
- Not building auth.
`,
      "aliases.md"
    );
    expect(brief.sections.nonGoals).toHaveLength(1);
    expect(brief.sections.nonGoals[0]!.text).toBe("Not building auth.");
  });

  it("is deterministic modulo parsedAt", () => {
    const content = `---
name: "Deterministic"
projectType: "saas-marketing"
---

# Brief

## Goals
- a
- b

## Audience
- devs
`;
    const a = parseBrief(content, "a.md");
    const b = parseBrief(content, "a.md");
    const { parsedAt: _a, ...ar } = a;
    const { parsedAt: _b, ...br } = b;
    expect(ar).toEqual(br);
  });
});
