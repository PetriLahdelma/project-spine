import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, mkdir, rm, cp, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { analyzeRepo } from "../analyzer/index.js";
import { parseBriefFromFile } from "../brief/parse.js";
import { compileSpine } from "../compiler/compile.js";
import { buildManifest } from "../compiler/manifest.js";
import { writeAllExports } from "../exporters/index.js";
import { checkDrift } from "./check.js";
import { buildDriftDiff, renderDriftDiffText } from "./diff.js";

const FIXED_NOW = () => "2026-04-18T00:00:00.000Z";
const FIXTURE_BRIEF = resolve(__dirname, "..", "..", "examples", "brief.md");

async function primeProject(work: string): Promise<void> {
  await cp(FIXTURE_BRIEF, join(work, "brief.md"));
  await writeFile(
    join(work, "package.json"),
    JSON.stringify({ name: "drift-fixture", dependencies: { next: "14.0.0" } }),
    "utf8",
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

describe("buildDriftDiff", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-diff-"));
    await primeProject(work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("clean report yields clean diff with no entries", async () => {
    await fullCompile(work);
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const diff = await buildDriftDiff({ repo: work, report });
    expect(diff.clean).toBe(true);
    expect(diff.entries).toHaveLength(0);
    expect(renderDriftDiffText(diff)).toMatch(/^clean/);
  });

  it("emits a unified patch for a hand-edited root export", async () => {
    await fullCompile(work);
    await appendFile(join(work, "AGENTS.md"), "\n\nHAND_EDITED_SENTINEL\n");
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const diff = await buildDriftDiff({ repo: work, report });
    expect(diff.clean).toBe(false);
    const handEdit = diff.entries.find((e) => e.kind === "export" && e.path === "AGENTS.md");
    expect(handEdit).toBeDefined();
    if (handEdit?.kind === "export") {
      expect(handEdit.patch).toMatch(/HAND_EDITED_SENTINEL/);
      expect(handEdit.patch).toMatch(/^--- AGENTS\.md/m);
      expect(handEdit.patch).toMatch(/\+\+\+ AGENTS\.md/);
    }
  });

  it("reports input hash change without attempting a content diff", async () => {
    await fullCompile(work);
    await appendFile(join(work, "brief.md"), "\n\n## Extra\n\nNew section.\n");
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const diff = await buildDriftDiff({ repo: work, report });
    const briefDrift = diff.entries.find(
      (e) => e.kind === "input" && e.driftKind === "input:brief",
    );
    expect(briefDrift).toBeDefined();
    if (briefDrift?.kind === "input") {
      expect(briefDrift.stored).not.toBeNull();
      expect(briefDrift.current).not.toBeNull();
      expect(briefDrift.stored).not.toEqual(briefDrift.current);
    }
    const rendered = renderDriftDiffText(diff);
    expect(rendered).toMatch(/inputs \(\d+\)/);
  });

  it("reports missing-export entry with no patch", async () => {
    await fullCompile(work);
    await rm(join(work, "AGENTS.md"));
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const diff = await buildDriftDiff({ repo: work, report });
    const missing = diff.entries.find(
      (e) => e.kind === "export" && e.driftKind === "export:missing" && e.path === "AGENTS.md",
    );
    expect(missing).toBeDefined();
    if (missing?.kind === "export") expect(missing.patch).toBeNull();
  });

  it("forwards manifest-missing signal", async () => {
    const report = await checkDrift({ repo: work, now: FIXED_NOW });
    const diff = await buildDriftDiff({ repo: work, report });
    expect(diff.entries[0]?.kind).toBe("manifest-missing");
    expect(renderDriftDiffText(diff)).toMatch(/manifest missing/);
  });
});
