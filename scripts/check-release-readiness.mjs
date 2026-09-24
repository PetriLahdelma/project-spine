#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [];

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function hasFile(path) {
  return existsSync(join(root, path));
}

function check(name, passed, detail) {
  checks.push({ name, passed, detail });
}

const pkg = readJson("package.json");
const scripts = pkg.scripts ?? {};
const files = new Set(pkg.files ?? []);
const bin = pkg.bin ?? {};
const exportsMap = pkg.exports ?? {};

check("package name", pkg.name === "project-spine", `name=${pkg.name ?? "(missing)"}`);
check("package type", pkg.type === "module", `type=${pkg.type ?? "(missing)"}`);
check("license", pkg.license === "MIT", `license=${pkg.license ?? "(missing)"}`);
check("homepage", pkg.homepage === "https://projectspine.dev", `homepage=${pkg.homepage ?? "(missing)"}`);
check("node engine", typeof pkg.engines?.node === "string" && pkg.engines.node.includes(">=22"), `node=${pkg.engines?.node ?? "(missing)"}`);
check("cli bin", bin.spine === "./dist/cli.js", `spine=${bin.spine ?? "(missing)"}`);
check("mcp bin", bin["spine-mcp"] === "./dist/mcp/server.js", `spine-mcp=${bin["spine-mcp"] ?? "(missing)"}`);
check("root export import", exportsMap["."]?.import === "./dist/index.js", `import=${exportsMap["."]?.import ?? "(missing)"}`);
check("root export types", exportsMap["."]?.types === "./dist/index.d.ts", `types=${exportsMap["."]?.types ?? "(missing)"}`);

for (const path of ["dist", "templates", "skills", "scripts/postinstall-hint.mjs", "README.md", "PRD.md"]) {
  check(`package files include ${path}`, files.has(path), "package.json files allowlist");
}

for (const name of ["typecheck", "test", "build", "pack:check", "release:readiness", "stable:check", "prepublishOnly"]) {
  check(`script ${name}`, typeof scripts[name] === "string", scripts[name] ?? "(missing)");
}

check(
  "prepublish readiness gate",
  typeof scripts.prepublishOnly === "string" && scripts.prepublishOnly.includes("npm run release:readiness"),
  scripts.prepublishOnly ?? "(missing)",
);
check(
  "prepublish stable gate",
  typeof scripts.prepublishOnly === "string" && scripts.prepublishOnly.includes("npm run stable:check"),
  scripts.prepublishOnly ?? "(missing)",
);
check("publish access", pkg.publishConfig?.access === "public", `access=${pkg.publishConfig?.access ?? "(missing)"}`);
check("publish tag", pkg.publishConfig?.tag === "beta", `tag=${pkg.publishConfig?.tag ?? "(missing)"}`);

const requiredDocs = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "PRD.md",
  "CHANGELOG.md",
  "docs/production-readiness.md",
];
for (const path of requiredDocs) {
  check(`doc exists ${path}`, hasFile(path), path);
}

// CI steps may live in ci.yml or in the shared composite action it calls, so scan both.
const ci = [".github/workflows/ci.yml", ".github/actions/spine-ci/action.yml"]
  .filter((p) => existsSync(join(root, p)))
  .map(readText)
  .join("\n");
check("ci node matrix", ci.includes("node: [22, 24]"), "CI must cover active Node LTS releases 22 and 24");
check("ci pack check", ci.includes("npm run pack:check"), "CI must validate npm package surface");
check("ci release readiness", ci.includes("npm run release:readiness"), "CI must run release readiness gate");
check("ci stable readiness", ci.includes("npm run stable:check"), "CI must run stable readiness gate");
check("ci release verifier tests", ci.includes("release-registry-state.test.mjs"), "CI must test immutable release verification");
check("ci site build", ci.includes("npm run build") && ci.includes("working-directory: site"), "CI must build marketing site");
check("ci desktop verify", ci.includes("npm run verify") && ci.includes("working-directory: apps/desktop"), "CI must verify desktop wrapper");

const drift = readText(".github/workflows/drift.yml");
check("drift workflow", drift.includes("drift check --repo . --fail-on any"), "drift check must fail on any drift");

const release = readText(".github/workflows/release.yml");
const releaseVerifier = readText(".github/scripts/release-registry-state.mjs");
check("release package tag guard", release.includes("Verify tag matches package.json"), "release tag must match package version");
check("release readiness gate", release.includes("npm run release:readiness"), "release workflow must run readiness check");
check("release stable gate", release.includes("npm run stable:check"), "release workflow must run stable readiness check");
check("release verifier tests", release.includes("release-registry-state.test.mjs"), "release must test its registry integrity verifier");
check("release hosted Node 24", release.includes("node-version: 24"), "trusted publishing must run on hosted Node 24");
check("release npm 11", release.includes("npm install --global npm@11.20.0"), "trusted publishing needs npm >=11.5.1");
check("release cache disabled", release.includes("package-manager-cache: false"), "release dependency caches must be disabled");
check("release provenance permission", release.includes("id-token: write"), "trusted publishing needs OIDC token permission");
check(
  "release provenance publish",
  release.includes("npm publish") && release.includes("--provenance --tag beta --access public"),
  "npm publish must use provenance and assign beta atomically",
);
check("release has no token requirement", !release.includes("NPM_TOKEN"), "trusted publishing must not require a stored npm token");
check("release exact tarball", release.includes("npm pack --json") && release.includes("release-registry-state.mjs"), "release must publish and verify one packed tarball");
check("release retry integrity", release.includes("--require-published"), "retries must verify the registry tarball integrity");
check(
  "release local integrity",
  releaseVerifier.includes('createHash("sha512")') && releaseVerifier.includes("basename(packed.filename)"),
  "release verifier must hash local bytes and reject filename traversal",
);
check("release bundle artifact", release.includes("CHANGELOG.generated.md") && release.includes("actions/upload-artifact@"), "release must preserve generated changelog and tarball artifacts");
check("release protected main", !release.includes("git push origin main"), "release must not push directly to protected main");

const security = readText(".github/workflows/security.yml");
check("security audit", security.includes("npm audit --audit-level=high"), "security workflow must run high-severity npm audit");
check("secret scan", security.toLowerCase().includes("gitleaks"), "security workflow must run secret scanning");

const smoke = readText(".github/workflows/post-publish-smoke.yml");
check("post publish smoke package", smoke.includes("project-spine"), "post-publish smoke must target project-spine");
check("post publish smoke compile", smoke.includes("spine compile"), "post-publish smoke must compile through installed package");
check("post publish requires registry", smoke.includes("after bounded retries") && !smoke.includes("Skip smoke"), "post-publish smoke must fail when npm visibility is missing");
check("post publish exact version", smoke.includes("installed package/CLI version mismatch"), "post-publish smoke must verify the installed package and CLI version");
check("post publish correction help", smoke.includes("Capture and prove reviewer-approved executable regression evidence"), "post-publish smoke must verify the installed correction command");
check("post publish correction consent", smoke.includes("Correction demo requires explicit --allow-execution"), "post-publish smoke must prove correction execution requires consent");

const failures = checks.filter((item) => !item.passed);
if (failures.length > 0) {
  process.stderr.write("release readiness check failed:\n");
  for (const item of failures) {
    process.stderr.write(`  - ${item.name}: ${item.detail}\n`);
  }
  process.exit(1);
}

console.log(`release readiness check passed: ${checks.length} checks`);
