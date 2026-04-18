import { mkdir, readFile, writeFile, stat, copyFile, access } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { stringify as stringifyYaml } from "yaml";
import { TemplateManifest } from "./model.js";
import type { SpineModel } from "../model/spine.js";
import { SpineModel as SpineSchema } from "../model/spine.js";
import type { ProjectType } from "../model/spine.js";

export type SaveLocation = "user" | "project";

export type SaveInput = {
  name: string;
  title?: string;
  description?: string;
  projectType?: ProjectType;
  from?: string; // source project root
  location?: SaveLocation;
  force?: boolean;
};

export type SaveResult = {
  templateDir: string;
  wroteBrief: boolean;
  wroteDesign: boolean;
  wroteManifest: boolean;
  contributionsDerived: boolean;
};

/**
 * Capture the current project's brief + design + spine contributions into a
 * reusable template. By default writes to the user-local library at
 * ~/.project-spine/templates/<name>/ so it's available across projects.
 */
export async function saveTemplate(input: SaveInput): Promise<SaveResult> {
  if (!/^[a-z][a-z0-9-]*$/.test(input.name)) {
    throw new Error(`invalid template name "${input.name}" — must match [a-z][a-z0-9-]*`);
  }
  const from = resolve(input.from ?? ".");
  const location = input.location ?? "user";

  const root =
    location === "user"
      ? join(homedir(), ".project-spine", "templates")
      : resolve(from, ".project-spine-templates");
  const templateDir = join(root, input.name);
  await mkdir(templateDir, { recursive: true });

  if (!input.force && (await exists(join(templateDir, "template.yaml")))) {
    throw new Error(`template "${input.name}" already exists at ${templateDir} — pass --force to overwrite`);
  }

  // 1. brief.md — require one at the source
  const sourceBrief = join(from, "brief.md");
  if (!(await exists(sourceBrief))) {
    throw new Error(`no brief.md found at ${from} — run \`spine init\` or point --from at a project with one`);
  }
  const briefContent = await readFile(sourceBrief, "utf8");
  await writeFile(join(templateDir, "brief.md"), stripProjectSpecificValues(briefContent), "utf8");

  // 2. design-rules.md — optional
  const sourceDesign = join(from, "design-rules.md");
  const wroteDesign = await exists(sourceDesign);
  if (wroteDesign) {
    await copyFile(sourceDesign, join(templateDir, "design-rules.md"));
  }

  // 3. derive a contributes block from the current spine.json if available
  const sourceSpine = join(from, ".project-spine", "spine.json");
  const spine = (await exists(sourceSpine))
    ? (SpineSchema.parse(JSON.parse(await readFile(sourceSpine, "utf8"))) as SpineModel)
    : null;

  const projectType =
    input.projectType ?? spine?.projectType ?? inferProjectTypeFromBrief(briefContent) ?? "other";

  const manifest: TemplateManifest = {
    schemaVersion: 1,
    name: input.name,
    title: input.title ?? toTitle(input.name),
    description:
      input.description ?? `Saved from ${truncate(from, 64)}${spine ? ` (spine ${spine.metadata.hash})` : ""}`,
    projectType,
    contributes: spine
      ? {
          routes: spine.scaffoldPlan.routes.map((r) => r.text),
          components: spine.componentGuidance.map((r) => r.text),
          qa: spine.qaGuardrails.map((r) => r.text),
          uxRules: spine.uxRules.map((r) => r.text),
          a11yRules: spine.a11yRules.map((r) => r.text),
          agentDos: spine.agentInstructions.dosAndDonts
            .filter((r) => !/do not/i.test(r.text))
            .map((r) => r.text),
          agentDonts: spine.agentInstructions.dosAndDonts
            .filter((r) => /do not/i.test(r.text))
            .map((r) => r.text),
          unsafeActions: spine.agentInstructions.unsafeActions.map((r) => r.text),
        }
      : {
          routes: [],
          components: [],
          qa: [],
          uxRules: [],
          a11yRules: [],
          agentDos: [],
          agentDonts: [],
          unsafeActions: [],
        },
  };

  const manifestPath = join(templateDir, "template.yaml");
  await writeFile(manifestPath, stringifyYaml(manifest), "utf8");

  return {
    templateDir,
    wroteBrief: true,
    wroteDesign,
    wroteManifest: true,
    contributionsDerived: spine !== null,
  };
}

function stripProjectSpecificValues(brief: string): string {
  // Clear name: "..." in frontmatter; leave projectType intact so the template
  // carries intent. Everything else is up to the author to review.
  return brief.replace(/^(name:\s*).*$/m, '$1""');
}

function inferProjectTypeFromBrief(raw: string): ProjectType | null {
  const m = /^projectType:\s*"?([a-z-]+)"?/m.exec(raw);
  if (!m) return null;
  const v = m[1] as ProjectType;
  const allowed: ProjectType[] = [
    "saas-marketing",
    "app-dashboard",
    "design-system",
    "docs-portal",
    "extension",
    "other",
  ];
  return allowed.includes(v) ? v : null;
}

function toTitle(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : "…" + s.slice(-(n - 1));
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// keep import order from flagging unused helpers
void stat;
void dirname;
