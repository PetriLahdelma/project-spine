import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { saveTemplate } from "./save.js";
import { listTemplates } from "./registry.js";
import { parse as parseYaml } from "yaml";

const SAVED_HOME = process.env["HOME"];
const SAVED_CWD = process.cwd();

describe("saveTemplate — round trip", () => {
  let work: string;
  let fakeHome: string;

  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-save-"));
    fakeHome = await mkdtemp(join(tmpdir(), "spine-home-"));
    process.env["HOME"] = fakeHome;
    process.chdir(work);
  });

  afterEach(async () => {
    process.chdir(SAVED_CWD);
    if (SAVED_HOME) process.env["HOME"] = SAVED_HOME;
    else delete process.env["HOME"];
    await rm(work, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  });

  it("rejects invalid names", async () => {
    await writeFile(
      join(work, "brief.md"),
      `---\nname: "x"\nprojectType: "saas-marketing"\n---\n\n## Goals\n- Ship\n`,
      "utf8"
    );
    await expect(saveTemplate({ name: "Bad Name", from: work })).rejects.toThrow(/invalid template name/);
  });

  it("saves a user-local template with only a brief (no spine)", async () => {
    await writeFile(
      join(work, "brief.md"),
      `---\nname: "ClientCo site"\nprojectType: "saas-marketing"\n---\n\n# Brief\n\n## Goals\n- Ship the marketing site.\n`,
      "utf8"
    );
    const result = await saveTemplate({
      name: "acme-saas",
      title: "Acme SaaS starter",
      description: "Agency starter template",
      from: work,
      location: "user",
    });
    expect(result.wroteBrief).toBe(true);
    expect(result.wroteDesign).toBe(false);
    expect(result.contributionsDerived).toBe(false);
    expect(result.templateDir).toBe(join(fakeHome, ".project-spine", "templates", "acme-saas"));

    const manifest = parseYaml(await readFile(join(result.templateDir, "template.yaml"), "utf8"));
    expect(manifest.name).toBe("acme-saas");
    expect(manifest.projectType).toBe("saas-marketing");
    expect(manifest.contributes.routes).toEqual([]);

    const savedBrief = await readFile(join(result.templateDir, "brief.md"), "utf8");
    // project-specific name is cleared
    expect(savedBrief).toMatch(/name:\s*""/);
    // projectType preserved
    expect(savedBrief).toMatch(/projectType:\s*"saas-marketing"/);
  });

  it("derives contributes from an existing spine.json", async () => {
    await writeFile(
      join(work, "brief.md"),
      `---\nname: "x"\nprojectType: "app-dashboard"\n---\n\n## Goals\n- Ship\n`,
      "utf8"
    );
    await mkdir(join(work, ".project-spine"), { recursive: true });
    const fakeSpine = {
      metadata: { name: "x", version: "0.1.0", schemaVersion: 1, createdAt: "2026-04-18T00:00:00.000Z", hash: "abc123" },
      projectType: "app-dashboard",
      goals: [], nonGoals: [], audience: [], constraints: [], assumptions: [], risks: [],
      stack: { framework: "next", language: "typescript", packageManager: "npm", runtime: "node", styling: "tailwind", testing: ["vitest"], detected: {} },
      repoConventions: [],
      designRules: [],
      uxRules: [{ id: "a", text: "Loading states everywhere.", source: { kind: "inference", pointer: "inferred:ux/states" } }],
      a11yRules: [{ id: "b", text: "Keyboard traps in modals.", source: { kind: "inference", pointer: "inferred:a11y/modals" } }],
      componentGuidance: [{ id: "c", text: "DataTable pattern.", source: { kind: "inference", pointer: "inferred:cmp/table" } }],
      qaGuardrails: [{ id: "d", text: "No PII in logs.", source: { kind: "inference", pointer: "inferred:qa/pii" } }],
      agentInstructions: {
        dosAndDonts: [
          { id: "e", text: "Prefer server actions.", source: { kind: "inference", pointer: "inferred:do/srv" } },
          { id: "f", text: "Do not bypass permissions.", source: { kind: "inference", pointer: "inferred:dont/perm" } },
        ],
        unsafeActions: [{ id: "g", text: "Never log tokens.", source: { kind: "inference", pointer: "inferred:unsafe/tok" } }],
        filePlacement: [],
        responseExpectations: [],
      },
      scaffoldPlan: {
        routes: [{ id: "r1", text: "/login — Auth entry.", source: { kind: "inference", pointer: "inferred:route/login" } }],
        components: [],
        sprint1: [],
      },
      warnings: [],
    };
    await writeFile(join(work, ".project-spine", "spine.json"), JSON.stringify(fakeSpine), "utf8");

    const result = await saveTemplate({ name: "my-dash", from: work, location: "user" });
    expect(result.contributionsDerived).toBe(true);
    const manifest = parseYaml(await readFile(join(result.templateDir, "template.yaml"), "utf8"));
    expect(manifest.contributes.routes).toEqual(["/login — Auth entry."]);
    expect(manifest.contributes.agentDos).toContain("Prefer server actions.");
    expect(manifest.contributes.agentDonts).toContain("Do not bypass permissions.");
    expect(manifest.contributes.unsafeActions).toContain("Never log tokens.");
  });

  it("saved user template is discoverable via listTemplates (bundled still present)", async () => {
    await writeFile(join(work, "brief.md"), `---\nprojectType: "other"\n---\n\n## Goals\n- x\n`, "utf8");
    await saveTemplate({ name: "my-team", from: work, location: "user" });

    const all = await listTemplates();
    const names = all.map((t) => t.manifest.name);
    expect(names).toContain("my-team");
    const my = all.find((t) => t.manifest.name === "my-team")!;
    expect(my.source).toBe("user");
    // bundled still present
    expect(names).toContain("saas-marketing");
    expect(all.find((t) => t.manifest.name === "saas-marketing")!.source).toBe("bundled");
  });

  it("project-local template overrides user-local and bundled with the same name", async () => {
    await writeFile(join(work, "brief.md"), `---\nprojectType: "other"\n---\n\n## Goals\n- x\n`, "utf8");
    await saveTemplate({
      name: "saas-marketing",
      from: work,
      location: "project",
      force: true,
      description: "Team override",
    });

    const all = await listTemplates();
    const saas = all.find((t) => t.manifest.name === "saas-marketing")!;
    expect(saas.source).toBe("project");
    expect(saas.manifest.description).toBe("Team override");
  });

  it("refuses to overwrite without --force", async () => {
    await writeFile(join(work, "brief.md"), `---\nprojectType: "other"\n---\n\n## Goals\n- x\n`, "utf8");
    await saveTemplate({ name: "dup", from: work, location: "user" });
    await expect(saveTemplate({ name: "dup", from: work, location: "user" })).rejects.toThrow(/already exists/);
    // force works
    await expect(
      saveTemplate({ name: "dup", from: work, location: "user", force: true })
    ).resolves.toMatchObject({ wroteManifest: true });
  });
});
