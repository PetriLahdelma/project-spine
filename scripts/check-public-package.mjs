import { spawnSync } from "node:child_process";

const forbidden = [
  "dist/cli-client/",
  "dist/commands/cli-e2e.setup.",
  "dist/commands/login.",
  "dist/commands/logout.",
  "dist/commands/whoami.",
  "dist/commands/workspace.",
  "dist/commands/publish.",
  "dist/commands/rationale.",
  "dist/templates/workspace-sync.",
  "node_modules/@types/diff",
];

const required = [
  "README.md",
  "PRD.md",
  "dist/cli.js",
  "dist/commands/compile.js",
  "dist/commands/doctor.js",
  "dist/commands/drift.js",
  "dist/mcp/server.js",
  "skills/project-spine/SKILL.md",
  "templates/saas-marketing/template.yaml",
];

const result = spawnSync("npm", ["pack", "--json", "--dry-run"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stderr.write(result.stdout);
  process.exit(result.status ?? 1);
}

const packs = JSON.parse(result.stdout);
const files = packs.flatMap((pack) => pack.files.map((file) => file.path));
const leaked = files.filter((path) => forbidden.some((prefix) => path.startsWith(prefix)));
const missing = required.filter((path) => !files.includes(path));

if (leaked.length > 0) {
  process.stderr.write("public package check failed: dormant/private files would ship:\n");
  for (const path of leaked) process.stderr.write(`  - ${path}\n`);
  process.exit(1);
}

if (missing.length > 0) {
  process.stderr.write("public package check failed: required public files are missing:\n");
  for (const path of missing) process.stderr.write(`  - ${path}\n`);
  process.exit(1);
}

console.log(`public package check passed: ${files.length} files`);
