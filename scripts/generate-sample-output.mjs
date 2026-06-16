#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "dist", "cli.js");
const sampleTimestamp = "2000-01-01T00:00:00.000Z";

const samples = [
  {
    name: "project-spine",
    title: "Project Spine",
    briefInFixture: "docs/sample-output/project-spine/brief.md",
    fixture: writeProjectSpineFixture,
  },
  {
    name: "saas-marketing",
    title: "Acme Payroll Marketing Site",
    template: "saas-marketing",
    brief: join(root, "examples", "brief.md"),
    fixture: writeNextFixture,
  },
  {
    name: "app-dashboard",
    title: "Northstar Ops Dashboard",
    template: "app-dashboard",
    briefText: `---
name: "Northstar Ops Dashboard"
projectType: "app-dashboard"
---

# Project brief

## Goals
- Ship a role-aware operations dashboard for support leads within 8 weeks.
- Reduce manual queue triage by surfacing priority accounts and stale cases.
- Give managers exportable weekly metrics without ad-hoc SQL requests.

## Audience
- Support leads who rebalance queues several times per day.
- Operations managers who review response times and escalation quality weekly.
- Workspace admins who invite agents and assign roles.

## Constraints
- Stack is Next.js app router with server actions for mutations.
- Auth comes from the existing SSO provider; no new identity system in v1.
- Tables may include customer names and emails, so analytics and logs must not contain PII.

## Assumptions
- Workspaces stay under 200 active agents during the beta.
- The existing API can provide queue and user data with p95 under 300ms.

## Risks
- Large exports could block the UI unless moved to a background job.
- Permission mistakes are more damaging than missing convenience features.

## Success criteria
- New support lead reaches the default queue view in under 2 minutes.
- Role-gated routes deny access with a clear recovery path.
- Queue table handles 10,000 rows through server-side pagination.
`,
    fixture: writeDashboardFixture,
  },
  {
    name: "api-service",
    title: "Ledger API",
    template: "api-service",
    brief: join(root, "docs", "sample-output", "api-service", "brief.md"),
    fixture: writeApiFixture,
  },
  {
    name: "design-system",
    title: "Aster Design System",
    template: "design-system",
    briefText: `---
name: "Aster Design System"
projectType: "design-system"
---

# Project brief

## Goals
- Standardize product UI primitives across three web apps.
- Move all color, spacing, radius, and typography decisions into semantic tokens.
- Publish a stable React package with Storybook docs and migration examples.

## Audience
- Product designers defining tokens and component states.
- Platform engineers maintaining the package.
- App teams consuming primitives in production surfaces.

## Constraints
- React-only v1, TypeScript strict, ESM package output.
- Tokens are exported from Figma as JSON and transformed before publish.
- Downstream apps need light, dark, and high-contrast themes.

## Assumptions
- Designers own token naming; engineers own package boundaries.
- Breaking changes can ship monthly with deprecation notes.

## Risks
- Teams may fork primitives if migration docs are thin.
- Token aliases could drift from Figma unless exports are checked in CI.

## Success criteria
- Button, Input, Field, Dialog, Tooltip, and Toast ship with docs and tests.
- Axe checks pass for every primitive story.
- First downstream app replaces 80% of raw form controls with primitives.
`,
    design: join(root, "templates", "design-system", "design-rules.md"),
    fixture: writeDesignSystemFixture,
  },
  {
    name: "docs-portal",
    title: "Atlas Docs",
    template: "docs-portal",
    briefText: `---
name: "Atlas Docs"
projectType: "docs-portal"
---

# Project brief

## Goals
- Launch a technical docs portal that gets new users to hello world in under 5 minutes.
- Keep guides, reference pages, and changelog entries versioned with the repo.
- Make stale docs fail CI through broken-link and copyable-code checks.

## Audience
- New developers installing Atlas for the first time.
- Integrators who need stable API reference pages.
- Support engineers linking users to canonical troubleshooting guides.

## Constraints
- Docs are Markdown/MDX in the repo; no CMS for v1.
- API reference is generated from source metadata during build.
- Search index must rebuild on every deploy.

## Assumptions
- The first release has one supported major version.
- Guides can be reviewed by DevRel before launch.

## Risks
- Reference generation may lag behind source changes.
- Search quality can hide good docs if headings are inconsistent.

## Success criteria
- Quickstart command sequence runs from a clean machine without edits.
- Broken-link count is zero in CI.
- Every generated reference page links back to its source.
`,
    fixture: writeDocsFixture,
  },
  {
    name: "monorepo",
    title: "Atlas Workspace",
    template: "monorepo",
    briefText: `---
name: "Atlas Workspace"
projectType: "monorepo"
---

# Project brief

## Goals
- Consolidate the web app and shared UI package into one workspace.
- Cut CI time with affected-only builds and cached task outputs.
- Share a typed UI package without allowing apps to become package dependencies.

## Audience
- Product engineers working in apps/web daily.
- Platform maintainers who own packages/ui and build tooling.
- Release managers who need predictable package versioning.

## Constraints
- pnpm workspaces with Turborepo task orchestration.
- Node 20 baseline across every package.
- One lockfile, one root tsconfig, one root CI workflow.

## Assumptions
- Packages can build in isolation once dependencies are declared correctly.
- Remote cache access is available in CI but not required locally.

## Risks
- Cross-package relative imports could bypass the declared graph.
- Circular dependencies may appear during migration.

## Success criteria
- Every workspace builds and tests in isolation.
- A no-op PR finishes affected-only CI in under 60 seconds.
- Release flow uses changesets; no manual package version bumps.
`,
    fixture: writeMonorepoFixture,
  },
];

if (!existsSync(cli)) {
  throw new Error("dist/cli.js is missing. Run `npm run build` before `npm run samples:generate`.");
}

const tempRoot = mkdtempSync(join(tmpdir(), "spine-samples-"));
try {
  for (const sample of samples) {
    const work = join(tempRoot, sample.name);
    mkdirSync(work, { recursive: true });
    sample.fixture(work);
    const briefPath = materializeBrief(sample, work);

    const args = [
      cli,
      "compile",
      "--brief",
      briefPath,
      "--repo",
      work,
      "--name",
      sample.title,
    ];
    if (sample.template) args.push("--template", sample.template);
    if (sample.design) args.push("--design", sample.design);

    const result = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CONSOLA_LEVEL: "5" },
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(
        `sample ${sample.name} compile failed with ${result.status}\n${result.stderr}\n${result.stdout}`.trim(),
      );
    }

    copySample(sample, work, briefPath);
    process.stdout.write(`generated docs/sample-output/${sample.name}\n`);
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

function materializeBrief(sample, work) {
  if (typeof sample.briefText === "string") {
    const path = join(work, "brief.md");
    writeFileSync(path, sample.briefText);
    return path;
  }
  if (typeof sample.briefInFixture === "string") {
    return join(work, sample.briefInFixture);
  }
  return sample.brief;
}

function copySample(sample, work, briefPath) {
  const briefContent = readFileSync(briefPath, "utf8");
  const designContent = sample.design ? readFileSync(sample.design, "utf8") : null;
  const target = join(root, "docs", "sample-output", sample.name);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  writeFileSync(join(target, "brief.md"), briefContent);
  if (designContent !== null) writeFileSync(join(target, "design-rules.md"), designContent);

  for (const name of [
    "spine.json",
    "brief.normalized.json",
    "repo-profile.json",
    "warnings.json",
    "export-manifest.json",
  ]) {
    cpSync(join(work, ".project-spine", name), join(target, name));
  }
  normalizeSampleRepoProfile(join(target, "repo-profile.json"), sample.name);
  normalizeSampleBrief(join(target, "brief.normalized.json"));

  for (const name of readdirSync(join(work, ".project-spine", "exports"))) {
    const source = join(work, ".project-spine", "exports", name);
    const dest = join(target, name);
    if (name === "cursor-rules") {
      cpSync(source, join(target, "cursor-rules"), { recursive: true });
    } else {
      cpSync(source, dest);
    }
  }

  cpSync(join(work, "AGENTS.md"), join(target, "AGENTS.md"));
  cpSync(join(work, "CLAUDE.md"), join(target, "CLAUDE.md"));
  cpSync(join(work, ".github", "copilot-instructions.md"), join(target, "copilot-instructions.md"));
  cpSync(join(work, ".cursor", "rules", "project-spine.mdc"), join(target, "cursor-project-rule.mdc"));
  normalizeSampleMarkdown(target);
}

function writePackage(work, pkg) {
  writeFileSync(join(work, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}

function normalizeSampleRepoProfile(path, sampleName) {
  const profile = JSON.parse(readFileSync(path, "utf8"));
  profile.root = `<sample:${sampleName}>`;
  profile.detectedAt = sampleTimestamp;
  writeFileSync(path, JSON.stringify(profile, null, 2) + "\n");
}

function normalizeSampleBrief(path) {
  const brief = JSON.parse(readFileSync(path, "utf8"));
  brief.parsedAt = sampleTimestamp;
  writeFileSync(path, JSON.stringify(brief, null, 2) + "\n");
}

function normalizeSampleMarkdown(target) {
  for (const name of readdirSync(target)) {
    if (!name.endsWith(".md")) continue;
    const path = join(target, name);
    const normalized = readFileSync(path, "utf8")
      .replace(/(Generated by Project Spine on )\d{4}-\d{2}-\d{2}T[^.]+\.\d{3}Z/g, `$1${sampleTimestamp}`)
      .replace(/(Normalized by Project Spine on )\d{4}-\d{2}-\d{2}T[^.]+\.\d{3}Z/g, `$1${sampleTimestamp}`);
    writeFileSync(path, normalized);
  }
}

function writeTsconfig(work) {
  writeFileSync(join(work, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }, null, 2) + "\n");
}

function writeWorkflow(work) {
  mkdirSync(join(work, ".github", "workflows"), { recursive: true });
  writeFileSync(join(work, ".github", "workflows", "ci.yml"), "name: ci\non: [push, pull_request]\njobs: {}\n");
}

function writeNextFixture(work) {
  writePackage(work, {
    name: "acme-payroll-web",
    private: true,
    dependencies: { next: "16.2.4", react: "19.2.4", "react-dom": "19.2.4" },
    devDependencies: { tailwindcss: "4.1.0", vitest: "4.1.8", typescript: "6.0.3" },
  });
  writeTsconfig(work);
  writeWorkflow(work);
  writeFileSync(join(work, "tailwind.config.ts"), "export default {};\n");
  mkdirSync(join(work, "app"), { recursive: true });
  writeFileSync(join(work, "app", "page.tsx"), "export default function Page() { return <main>Acme</main>; }\n");
}

function writeDashboardFixture(work) {
  writeNextFixture(work);
  overwritePackageName(work, "northstar-dashboard");
  mkdirSync(join(work, "app", "app"), { recursive: true });
  writeFileSync(join(work, "app", "app", "page.tsx"), "export default function Dashboard() { return <main>Dashboard</main>; }\n");
}

function writeApiFixture(work) {
  writePackage(work, {
    name: "ledger-api",
    private: true,
    type: "module",
    dependencies: { fastify: "5.0.0", zod: "4.3.6" },
    devDependencies: { vitest: "4.1.8", typescript: "6.0.3" },
  });
  writeTsconfig(work);
  writeWorkflow(work);
  mkdirSync(join(work, "src"), { recursive: true });
  writeFileSync(join(work, "src", "server.ts"), "export const health = () => ({ status: 'ok' });\n");
}

function writeDesignSystemFixture(work) {
  writePackage(work, {
    name: "@aster/design-system",
    private: true,
    type: "module",
    exports: { ".": "./src/index.ts" },
    dependencies: { react: "19.2.4" },
    devDependencies: {
      "@storybook/react": "8.6.0",
      "@testing-library/react": "16.0.0",
      vitest: "4.1.8",
      typescript: "6.0.3",
    },
  });
  writeTsconfig(work);
  writeWorkflow(work);
  mkdirSync(join(work, ".storybook"), { recursive: true });
  mkdirSync(join(work, "src"), { recursive: true });
  writeFileSync(join(work, "src", "index.ts"), "export const Button = 'Button';\n");
}

function writeDocsFixture(work) {
  writeNextFixture(work);
  overwritePackageName(work, "atlas-docs");
  mkdirSync(join(work, "app", "docs"), { recursive: true });
  writeFileSync(join(work, "app", "docs", "page.tsx"), "export default function Docs() { return <main>Docs</main>; }\n");
}

function writeMonorepoFixture(work) {
  writePackage(work, {
    name: "atlas-workspace",
    private: true,
    workspaces: ["apps/*", "packages/*"],
    devDependencies: { turbo: "2.0.0", vitest: "4.1.8", typescript: "6.0.3" },
  });
  writeTsconfig(work);
  writeWorkflow(work);
  writeFileSync(join(work, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n");
  writeFileSync(join(work, "turbo.json"), JSON.stringify({ tasks: { build: { dependsOn: ["^build"] } } }, null, 2) + "\n");
  mkdirSync(join(work, "apps", "web"), { recursive: true });
  writePackage(join(work, "apps", "web"), {
    name: "@atlas/web",
    private: true,
    dependencies: { next: "16.2.4", react: "19.2.4", "react-dom": "19.2.4" },
  });
  mkdirSync(join(work, "packages", "ui"), { recursive: true });
  writePackage(join(work, "packages", "ui"), {
    name: "@atlas/ui",
    private: true,
    type: "module",
    exports: { ".": "./src/index.ts" },
  });
}

function writeProjectSpineFixture(work) {
  const result = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "buffer" });
  if (result.status !== 0) {
    throw new Error(`git ls-files failed while creating project-spine sample fixture\n${result.stderr}`);
  }
  for (const raw of result.stdout.toString("utf8").split("\0")) {
    if (!raw) continue;
    const source = join(root, raw);
    const dest = join(work, raw);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(source, dest);
  }
}

function overwritePackageName(work, name) {
  const pkg = JSON.parse(readFileSync(join(work, "package.json"), "utf8"));
  pkg.name = name;
  writeFileSync(join(work, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}
