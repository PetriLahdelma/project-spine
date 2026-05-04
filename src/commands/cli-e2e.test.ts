import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execa } from "execa";
import { mkdtemp, writeFile, mkdir, readFile, rm, cp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..", "..");
const CLI = resolve(ROOT, "dist", "cli.js");
const FIXTURE_BRIEF = resolve(ROOT, "examples", "brief.md");

async function spawn(args: string[], cwd?: string) {
  return execa("node", [CLI, ...args], {
    cwd,
    reject: false,
    timeout: 30_000,
    // consola (used by citty for help output) silences `log` level when it
    // detects a non-TTY environment such as a vitest worker. Force the level
    // up so the child's help text lands in captured stdout. Colour is kept
    // off so the assertions don't have to strip ANSI.
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CONSOLA_LEVEL: "5" },
  });
}

async function primeProject(work: string): Promise<void> {
  await cp(FIXTURE_BRIEF, join(work, "brief.md"));
  await writeFile(
    join(work, "package.json"),
    JSON.stringify({ name: "e2e-fixture", dependencies: { next: "14.0.0" } }),
    "utf8",
  );
  await mkdir(join(work, "app"), { recursive: true });
  await writeFile(
    join(work, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { strict: true } }),
    "utf8",
  );
}

const EXPECTED_EXPORT_FILES = [
  "architecture-summary.md",
  "brief-summary.md",
  "AGENTS.md",
  "CLAUDE.md",
  "copilot-instructions.md",
  "cursor-project-rule.mdc",
  "component-plan.md",
  "qa-guardrails.md",
  "rationale.md",
  "route-inventory.md",
  "scaffold-plan.md",
  "sprint-1-backlog.md",
].sort();

const BUNDLED_TEMPLATE_NAMES = [
  "saas-marketing",
  "app-dashboard",
  "design-system",
  "docs-portal",
  "api-service",
  "monorepo",
];

const DORMANT_HOSTED_COMMAND_MODULES = [
  "login",
  "logout",
  "whoami",
  "workspace",
  "publish",
  "rationale",
];

describe("spine --help", () => {
  it("lists exactly the eight routed commands", async () => {
    const { stdout, exitCode } = await spawn(["--help"]);
    expect(exitCode).toBe(0);
    for (const cmd of [
      "init",
      "compile",
      "inspect",
      "export",
      "template",
      "explain",
      "drift",
      "tokens",
    ]) {
      expect(stdout).toContain(cmd);
    }
    for (const cmd of ["login", "logout", "whoami", "workspace", "publish", "rationale"]) {
      expect(stdout).not.toContain(cmd);
    }
  });

  it("--version matches package.json exactly", async () => {
    const { stdout, exitCode } = await spawn(["--version"]);
    expect(exitCode).toBe(0);
    const pkg = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf8")) as {
      version: string;
    };
    expect(stdout.trim()).toBe(pkg.version);
  });

  it("bare invocation prints help without erroring", async () => {
    const { stdout, exitCode } = await spawn([]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("USAGE");
  });
});

describe("spine init", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-init-"));
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("scaffolds brief.md and .project-spine/ with a valid template", async () => {
    const { exitCode, stderr } = await spawn(["init", "--template", "saas-marketing"], work);
    expect(exitCode, stderr).toBe(0);
    const entries = await readdir(work);
    expect(entries).toContain("brief.md");
    expect(entries).toContain(".project-spine");
    const brief = await readFile(join(work, "brief.md"), "utf8");
    expect(brief.length).toBeGreaterThan(50);
  });

  it("rejects an unknown template with a non-zero exit", async () => {
    const { exitCode, stderr, stdout } = await spawn(
      ["init", "--template", "not-a-real-template"],
      work,
    );
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/not-a-real-template|unknown|not found/);
  });

  it("documents every bundled template accepted by template list", async () => {
    const { stdout, exitCode } = await spawn(["init", "--help"]);
    expect(exitCode).toBe(0);
    for (const name of BUNDLED_TEMPLATE_NAMES) {
      expect(stdout).toContain(name);
    }
  });
});

describe("spine compile", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-compile-"));
    await primeProject(work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("writes the expected export set on a primed project", async () => {
    const { exitCode, stderr, stdout } = await spawn(
      ["compile", "--brief", "./brief.md", "--repo", "."],
      work,
    );
    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("agent files:");
    expect(stdout).toContain("32 KB/file budget");

    const rootEntries = await readdir(work);
    expect(rootEntries).toContain("AGENTS.md");
    expect(rootEntries).toContain("CLAUDE.md");
    const gh = await readdir(join(work, ".github"));
    expect(gh).toContain("copilot-instructions.md");
    const cursorRules = await readdir(join(work, ".cursor", "rules"));
    expect(cursorRules).toContain("project-spine.mdc");

    const spineFiles = await readdir(join(work, ".project-spine"));
    for (const f of ["spine.json", "brief.normalized.json", "repo-profile.json", "warnings.json", "export-manifest.json"]) {
      expect(spineFiles).toContain(f);
    }

    const exportFiles = (await readdir(join(work, ".project-spine", "exports"))).sort();
    expect(exportFiles).toEqual(EXPECTED_EXPORT_FILES);
  });

  it("fails loudly when --brief points at nothing", async () => {
    const { exitCode, stderr, stdout } = await spawn(
      ["compile", "--brief", "./nope.md", "--repo", "."],
      work,
    );
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/nope\.md|brief|not found|no such/);
  });
});

describe("spine inspect", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-inspect-"));
    await primeProject(work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("writes architecture-summary.md and repo-profile.json without a brief", async () => {
    const { exitCode, stderr } = await spawn(["inspect", "--repo", "."], work);
    expect(exitCode, stderr).toBe(0);
    const spineDir = join(work, ".project-spine");
    const entries = await readdir(spineDir);
    expect(entries).toContain("repo-profile.json");
    const exportsDir = join(spineDir, "exports");
    const exports = await readdir(exportsDir);
    expect(exports).toContain("architecture-summary.md");
  });

  // inspect is deliberately lenient — an empty or missing dir analyses to
  // "everything unknown" rather than erroring, so there's no natural error
  // path to cover here.
});

describe("spine export", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-export-"));
    await primeProject(work);
    await spawn(["compile", "--brief", "./brief.md", "--repo", "."], work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("regenerates a subset of exports from the stored spine", async () => {
    await rm(join(work, "AGENTS.md"));
    const { exitCode, stderr } = await spawn(["export", "--targets", "agents,claude"], work);
    expect(exitCode, stderr).toBe(0);
    const rootEntries = await readdir(work);
    expect(rootEntries).toContain("AGENTS.md");
  });

  it("rejects an unknown --targets value", async () => {
    const { exitCode, stderr, stdout } = await spawn(["export", "--targets", "not-a-target"], work);
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/not-a-target|unknown|invalid/);
  });
});

describe("spine template", () => {
  it("template list shows all six starter presets", async () => {
    const { stdout, exitCode } = await spawn(["template", "list"]);
    expect(exitCode).toBe(0);
    for (const name of BUNDLED_TEMPLATE_NAMES) {
      expect(stdout).toContain(name);
    }
  });

  it("template show prints a manifest summary", async () => {
    const { stdout, exitCode } = await spawn(["template", "show", "saas-marketing"]);
    expect(exitCode).toBe(0);
    expect(stdout.toLowerCase()).toContain("saas-marketing");
  });

  it("template show rejects an unknown template", async () => {
    const { exitCode, stderr, stdout } = await spawn(["template", "show", "ghost-template"]);
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/ghost-template|not found|unknown/);
  });
});

describe("public dist surface", () => {
  it("does not emit dormant hosted command modules into the npm build output", async () => {
    const files = await readdir(resolve(ROOT, "dist", "commands"));
    for (const command of DORMANT_HOSTED_COMMAND_MODULES) {
      expect(files).not.toContain(`${command}.js`);
      expect(files).not.toContain(`${command}.d.ts`);
    }
  });
});

describe("spine explain", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-explain-"));
    await primeProject(work);
    await spawn(["compile", "--brief", "./brief.md", "--repo", "."], work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("explain with no id prints usage or listing", async () => {
    const { exitCode, stdout, stderr } = await spawn(["explain"], work);
    const combined = stdout + stderr;
    expect(combined.length).toBeGreaterThan(0);
    expect(exitCode === 0 || exitCode === 1).toBe(true);
  });

  it("explain rejects an unknown warning id against a compiled project", async () => {
    const { exitCode, stderr, stdout } = await spawn(["explain", "W9999-not-real"], work);
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/w9999|unknown|not found|no such/);
  });
});

describe("spine tokens", () => {
  it("tokens pull --help lists the file/url/out flags", async () => {
    const { stdout, exitCode } = await spawn(["tokens", "pull", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("--file");
    expect(stdout).toContain("--url");
    expect(stdout).toContain("--out");
  });

  it("tokens pull errors when FIGMA_TOKEN is missing", async () => {
    const env = { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CONSOLA_LEVEL: "5" };
    delete env.FIGMA_TOKEN;
    const { execa } = await import("execa");
    const { exitCode, stderr, stdout } = await execa("node", [CLI, "tokens", "pull", "--file", "abc"], {
      reject: false,
      env,
    });
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/figma_token/);
  });

  it("tokens pull errors when both --file and --url are given", async () => {
    const env = { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CONSOLA_LEVEL: "5", FIGMA_TOKEN: "fake" };
    const { execa } = await import("execa");
    const { exitCode, stderr, stdout } = await execa(
      "node",
      [CLI, "tokens", "pull", "--file", "abc", "--url", "https://figma.com/design/abc/x"],
      { reject: false, env },
    );
    expect(exitCode).not.toBe(0);
    const combined = (stderr + "\n" + stdout).toLowerCase();
    expect(combined).toMatch(/file.*url|url.*file/);
  });
});

describe("spine drift", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-drift-e2e-"));
    await primeProject(work);
    await spawn(["compile", "--brief", "./brief.md", "--repo", "."], work);
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("drift check returns zero on a clean repo", async () => {
    const { exitCode, stdout } = await spawn(["drift", "check"], work);
    expect(exitCode).toBe(0);
    expect(stdout.toLowerCase()).toContain("clean");
  });

  it("drift check returns non-zero after an input edit with --fail-on any", async () => {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(join(work, "brief.md"), "\n\n## Edit\nextra section.\n");
    const { exitCode, stdout } = await spawn(["drift", "check", "--fail-on", "any"], work);
    expect(exitCode).not.toBe(0);
    expect(stdout.toLowerCase()).toContain("drift");
  });

  it("drift diff emits a unified patch for a hand-edited export", async () => {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(join(work, "AGENTS.md"), "\nHAND_EDIT_E2E_SENTINEL\n");
    const { exitCode, stdout } = await spawn(["drift", "diff"], work);
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain("HAND_EDIT_E2E_SENTINEL");
    expect(stdout).toMatch(/@@ -?\d/);
  });

  it("drift diff --json emits a parseable payload", async () => {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(join(work, "AGENTS.md"), "\nedit\n");
    const { exitCode, stdout } = await spawn(["drift", "diff", "--json"], work);
    expect(exitCode).not.toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.clean).toBe(false);
    expect(Array.isArray(parsed.entries)).toBe(true);
  });
});
