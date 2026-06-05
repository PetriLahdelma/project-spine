#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "dist", "cli.js");
const checks = [];

const routedCommands = ["init", "compile", "inspect", "export", "template", "explain", "drift", "tokens", "doctor"];
const dormantCommands = ["login", "logout", "whoami", "workspace", "publish", "rationale"];
const dormantDistPrefixes = dormantCommands.map((command) => `dist/commands/${command}.`);

function record(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function assertCheck(name, condition, detail) {
  record(name, Boolean(condition), detail);
}

function run(command, args, cwd, timeout = 60_000) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      CONSOLA_LEVEL: "5",
    },
  });
  return {
    command: `${command} ${args.join(" ")}`,
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
}

function mustRun(command, args, cwd, timeout) {
  const result = run(command, args, cwd, timeout);
  if (result.status !== 0) {
    throw new Error(
      `${result.command} failed with ${result.status}\n${result.stderr}\n${result.stdout}`.trim(),
    );
  }
  return result;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function installedSpineBin(projectRoot) {
  return join(projectRoot, "node_modules", ".bin", process.platform === "win32" ? "spine.cmd" : "spine");
}

function exportHashes(projectRoot) {
  const manifest = readJson(join(projectRoot, ".project-spine", "export-manifest.json"));
  return Object.fromEntries(manifest.exports.map((file) => [file.path, file.sha256]));
}

function allRules(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) allRules(item, found);
    return found;
  }
  if (!value || typeof value !== "object") return found;
  if (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    value.source &&
    typeof value.source === "object"
  ) {
    found.push(value);
  }
  for (const child of Object.values(value)) allRules(child, found);
  return found;
}

try {
  assertCheck("built CLI exists", existsSync(cli), "run npm run build before stable:check");

  const help = mustRun("node", [cli, "--help"], root);
  const usageLine = `USAGE spine ${routedCommands.join("|")}`;
  assertCheck("help usage lists exactly routed commands", help.stdout.includes(usageLine), usageLine);
  for (const command of routedCommands) {
    assertCheck(`help includes ${command}`, help.stdout.includes(command), "routed OSS command");
  }
  for (const command of dormantCommands) {
    assertCheck(`help excludes dormant ${command}`, !help.stdout.includes(command), "hosted-tier command must stay unrouted");
  }

  const packDir = mkdtempSync(join(tmpdir(), "spine-stable-pack-"));
  const packed = mustRun("npm", ["pack", "--json", "--pack-destination", packDir], root, 120_000);
  const packInfo = JSON.parse(packed.stdout)[0];
  const packFiles = packInfo.files.map((file) => file.path);
  assertCheck("npm pack has files", packFiles.length > 0, `${packFiles.length} files`);
  assertCheck("npm pack excludes site", !packFiles.some((path) => path.startsWith("site/")), "site must not ship in CLI tarball");
  assertCheck(
    "npm pack excludes dormant hosted commands",
    !packFiles.some((path) => dormantDistPrefixes.some((prefix) => path.startsWith(prefix))),
    "hosted command modules must not ship",
  );

  const work = mkdtempSync(join(tmpdir(), "spine-stable-project-"));
  writeFileSync(join(work, "package.json"), JSON.stringify({ name: "spine-stable-smoke", private: true }, null, 2) + "\n");
  writeFileSync(join(work, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }, null, 2) + "\n");
  mkdirSync(join(work, "app"), { recursive: true });
  writeFileSync(join(work, "app", "page.tsx"), "export default function Page() { return <main>Hello</main>; }\n");

  const started = performance.now();
  const tarball = join(packDir, packInfo.filename);
  mustRun("npm", ["install", tarball], work, 120_000);
  const spine = installedSpineBin(work);
  mustRun(spine, ["init", "--template", "saas-marketing"], work);
  mustRun(
    spine,
    [
      "compile",
      "--brief",
      "./brief.md",
      "--repo",
      ".",
      "--template",
      "saas-marketing",
      "--name",
      "stable-readiness",
      "--version",
      "0.0.0-stable-check",
    ],
    work,
  );
  const firstRunMs = Math.round(performance.now() - started);
  assertCheck("first package install/init/compile under 30s", firstRunMs < 30_000, `${firstRunMs}ms`);

  const spineJsonPath = join(work, ".project-spine", "spine.json");
  const firstSpineJson = readFileSync(spineJsonPath, "utf8");
  const firstHashes = exportHashes(work);
  const sourceRules = allRules(readJson(spineJsonPath));
  const missingPointers = sourceRules.filter((rule) => typeof rule.source.pointer !== "string" || rule.source.pointer.length === 0);
  assertCheck("spine rules have source pointers", missingPointers.length === 0, `${sourceRules.length} rules checked`);

  mustRun(
    spine,
    [
      "compile",
      "--brief",
      "./brief.md",
      "--repo",
      ".",
      "--template",
      "saas-marketing",
      "--name",
      "stable-readiness",
      "--version",
      "0.0.0-stable-check",
    ],
    work,
  );
  const secondSpineJson = readFileSync(spineJsonPath, "utf8");
  const secondHashes = exportHashes(work);
  assertCheck("recompile keeps spine.json byte-identical", firstSpineJson === secondSpineJson, "identical inputs");
  assertCheck(
    "recompile keeps export hashes identical",
    JSON.stringify(firstHashes) === JSON.stringify(secondHashes),
    `${Object.keys(firstHashes).length} export hashes`,
  );

  appendFileSync(join(work, "brief.md"), "\n\n## Added after compile\n- Trigger stable drift check.\n");
  const driftCheck = run(spine, ["drift", "check", "--fail-on", "any"], work);
  assertCheck("drift check fails after input edit", driftCheck.status !== 0, `exit=${driftCheck.status}`);

  mustRun(
    spine,
    [
      "compile",
      "--brief",
      "./brief.md",
      "--repo",
      ".",
      "--template",
      "saas-marketing",
      "--name",
      "stable-readiness",
      "--version",
      "0.0.0-stable-check",
    ],
    work,
  );
  appendFileSync(join(work, "AGENTS.md"), "\nSTABLE_READINESS_HAND_EDIT\n");
  const driftDiff = run(spine, ["drift", "diff"], work);
  assertCheck("drift diff fails after hand-edited export", driftDiff.status !== 0, `exit=${driftDiff.status}`);
  assertCheck("drift diff prints unified patch", /@@ -?\d/.test(driftDiff.stdout), "expected @@ hunk");
  assertCheck(
    "drift diff includes hand edit",
    driftDiff.stdout.includes("STABLE_READINESS_HAND_EDIT"),
    "expected hand edit sentinel",
  );

  rmSync(work, { recursive: true, force: true });
  rmSync(packDir, { recursive: true, force: true });
} catch (error) {
  record("stable readiness execution", false, error instanceof Error ? error.message : String(error));
}

const failures = checks.filter((check) => !check.passed);
if (failures.length > 0) {
  process.stderr.write("stable readiness check failed:\n");
  for (const failure of failures) {
    process.stderr.write(`  - ${failure.name}: ${failure.detail}\n`);
  }
  process.exit(1);
}

console.log(`stable readiness check passed: ${checks.length} checks`);
