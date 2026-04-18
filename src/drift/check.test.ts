import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, mkdir, readFile, rm, cp, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile } from "../brief/parse.js";
import { compileSpine } from "../compiler/compile.js";
import { buildManifest } from "../compiler/manifest.js";
import { writeAllExports } from "../exporters/index.js";
import { checkDrift } from "./check.js";

const FIXED_NOW = () => "2026-04-18T00:00:00.000Z";
const FIXTURE_BRIEF = resolve(__dirname, "..", "..", "examples", "brief.md");

async function primeProject(work: string): Promise<void> {
  await cp(FIXTURE_BRIEF, join(work, "brief.md"));
  await writeFile(
    join(work, "package.json"),
    JSON.stringify({ name: "drift-fixture", dependencies: { next: "14.0.0" } }),
    "utf8"
  );
  await mkdir(join(work, "app"), { recursive: true });
  await writeFile(join(work, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }), "utf8");
}

async function fullCompile(work: string): Promise<void> {
  const briefPath = join(work, "brief.md");
  const outDir = join(work, ".project-spine");
  await mkdir(join(outDir, "exports"), { recursive: true });
  const [brief, repo] = await Promise.all([parseBriefFromFile(briefPath), analyzeRepo(work)]);
  const spine = compileSpine({ brief, repo, design: null, now: FIXED_NOW });
  await writeFile(join(outDir, "spine.json"), JSON.stringify(spine, null, 2), "utf8");
  const { fingerprints } = await writeAllExports(spine, { repoRoot: work, outDir });
  const manifest = buildManifest({
    spine,
    brief,
    briefPath,
    repo,
    design: null,
    designPath: null,
    template: null,
    exports: fingerprints,
    repoRoot: work,
    now: FIXED_NOW,
  });
  await writeFile(join(outDir, "export-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
}

describe("checkDrift", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-drift-"));
    await primeProject(work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("reports manifest:missing before any compile", async () => {
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    expect(report.clean).toBe(false);
    expect(report.items[0]!.kind).toBe("manifest:missing");
  });

  it("reports clean immediately after a compile", async () => {
    await fullCompile(work);
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    expect(report.clean).toBe(true);
    expect(report.counts.total).toBe(0);
    expect(report.storedSpineHash).toBe(report.currentSpineHash);
  });

  it("reports input drift when brief.md is edited", async () => {
    await fullCompile(work);
    await appendFile(join(work, "brief.md"), "\n\nNew goal added by stakeholder: sign up a pilot customer.\n", "utf8");

    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    expect(report.clean).toBe(false);
    const kinds = report.items.map((i) => i.kind);
    expect(kinds).toContain("input:brief");
    expect(kinds).toContain("spine:hash");
  });

  it("reports hand-edit when AGENTS.md is modified after compile", async () => {
    await fullCompile(work);
    const agentsPath = join(work, "AGENTS.md");
    const original = await readFile(agentsPath, "utf8");
    await writeFile(agentsPath, original + "\n<!-- hand-edited -->\n", "utf8");

    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    expect(report.clean).toBe(false);
    const handEdits = report.items.filter((i) => i.kind === "export:hand-edited");
    expect(handEdits.length).toBeGreaterThan(0);
    expect(handEdits.some((i) => i.path?.endsWith("AGENTS.md"))).toBe(true);
  });

  it("reports missing export when a file is deleted", async () => {
    await fullCompile(work);
    await rm(join(work, "CLAUDE.md"));

    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const missing = report.items.filter((i) => i.kind === "export:missing");
    expect(missing.some((i) => i.path?.endsWith("CLAUDE.md"))).toBe(true);
  });

  it("recompile after a change produces a clean drift check", async () => {
    await fullCompile(work);
    await appendFile(join(work, "brief.md"), "\n\n## Non-goals\n- Avoid scope creep.\n", "utf8");
    // recompile
    await fullCompile(work);
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    expect(report.clean).toBe(true);
  });

  it("reports input drift when repo profile changes (e.g., switching framework)", async () => {
    await fullCompile(work);
    // Add Tailwind to package.json so the detected stack changes
    const pkg = JSON.parse(await readFile(join(work, "package.json"), "utf8"));
    pkg.devDependencies = { tailwindcss: "3.0.0" };
    await writeFile(join(work, "package.json"), JSON.stringify(pkg), "utf8");

    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const kinds = report.items.map((i) => i.kind);
    expect(kinds).toContain("input:repo-profile");
    expect(kinds).toContain("spine:hash");
  });
});
