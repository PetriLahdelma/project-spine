import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { getTemplate, listTemplates, userTemplatesDir } from "../templates/registry.js";
import { saveTemplate } from "../templates/save.js";
import {
  listWorkspaceTemplates,
  pullWorkspaceTemplate,
  pushWorkspaceTemplate,
} from "../templates/workspace-sync.js";
import { readConfig } from "../cli-client/config.js";
import { ApiError } from "../cli-client/api.js";
import type { ProjectType } from "../model/spine.js";

const list = defineCommand({
  meta: { name: "list", description: "List available templates (bundled + user + project + workspace)." },
  args: {
    workspace: {
      type: "boolean",
      description: "List templates in the active workspace instead of local sources",
      default: false,
    },
  },
  async run({ args }) {
    if (args.workspace) {
      try {
        const res = await listWorkspaceTemplates();
        if (res.items.length === 0) {
          console.log(`workspace "${res.workspace}" has no templates yet.`);
          return;
        }
        const nameWidth = Math.max(...res.items.map((t) => t.name.length));
        console.log(`workspace: ${res.workspace}`);
        for (const t of res.items) {
          console.log(`  ${t.name.padEnd(nameWidth)}  ${t.title}`);
          console.log(`  ${"".padEnd(nameWidth)}  ${t.description}`);
          console.log("");
        }
      } catch (err) {
        handleError(err);
      }
      return;
    }

    const all = await listTemplates();
    if (all.length === 0) {
      console.log("no templates available");
      return;
    }
    const nameWidth = Math.max(...all.map((t) => t.manifest.name.length));
    const srcWidth = Math.max(...all.map((t) => t.source.length));
    for (const t of all) {
      console.log(`  ${t.manifest.name.padEnd(nameWidth)}  [${t.source.padEnd(srcWidth)}]  ${t.manifest.title}`);
      console.log(`  ${"".padEnd(nameWidth)}   ${"".padEnd(srcWidth + 2)}  ${t.manifest.description}`);
      console.log("");
    }
    console.log(`user templates dir: ${await userTemplatesDir()}`);
    console.log(`project templates dir: ./.project-spine-templates (if present)`);
    const cfg = await readConfig();
    if (cfg.activeWorkspace) {
      console.log(`workspace templates: run \`spine template list --workspace\` (active: ${cfg.activeWorkspace})`);
    }
  },
});

const show = defineCommand({
  meta: { name: "show", description: "Show a template's brief scaffold and contributions." },
  args: { name: { type: "positional", required: true, description: "Template name" } },
  async run({ args }) {
    const t = await getTemplate(args.name);
    const brief = await readFile(t.briefPath, "utf8");
    console.log(`# ${t.manifest.title}`);
    console.log(`(${t.manifest.name}, projectType: ${t.manifest.projectType}, source: ${t.source})`);
    console.log("");
    console.log(t.manifest.description);
    console.log("");
    console.log(`## Contributes to compiler`);
    for (const [key, items] of Object.entries(t.manifest.contributes)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      console.log(`  ${key}: ${items.length}`);
    }
    console.log("");
    console.log(`## Brief scaffold (${t.briefPath})`);
    console.log("");
    console.log(brief);
    if (t.designPath) console.log(`(ships with design-rules.md at ${t.designPath})`);
  },
});

const save = defineCommand({
  meta: {
    name: "save",
    description: "Save the current project as a reusable template.",
  },
  args: {
    name: { type: "string", required: true, description: "Template name (lowercase-kebab)" },
    title: { type: "string", required: false, description: "Human-readable title" },
    description: { type: "string", required: false, description: "One-line description" },
    projectType: { type: "string", required: false, description: "Override detected project type" },
    from: { type: "string", required: false, description: "Source project root", default: "." },
    location: {
      type: "string",
      required: false,
      default: "user",
      description: "Where to save: user | project | workspace",
    },
    force: { type: "boolean", required: false, description: "Overwrite existing template", default: false },
  },
  async run({ args }) {
    if (args.location === "workspace") {
      try {
        const res = await pushWorkspaceTemplate({
          name: args.name,
          ...(args.title !== undefined && { title: args.title }),
          ...(args.description !== undefined && { description: args.description }),
          ...(args.from !== undefined && { from: args.from }),
          force: args.force,
        });
        console.log(`${res.status} template "${res.name}" in workspace "${res.workspace}"`);
        console.log(`  content hash: ${res.contentHash}`);
        console.log(`  members can now: spine template pull ${res.name}`);
      } catch (err) {
        handleError(err);
      }
      return;
    }

    const location = args.location === "project" ? "project" : "user";
    const result = await saveTemplate({
      name: args.name,
      ...(args.title !== undefined && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.projectType !== undefined && { projectType: args.projectType as ProjectType }),
      ...(args.from !== undefined && { from: args.from }),
      location,
      force: args.force,
    });
    console.log(`saved template "${args.name}" at ${result.templateDir}`);
    console.log(`  brief.md:        ${result.wroteBrief ? "written" : "skipped"}`);
    console.log(`  design-rules.md: ${result.wroteDesign ? "written" : "skipped"}`);
    console.log(`  template.yaml:   ${result.wroteManifest ? "written" : "skipped"}`);
    console.log(`  contributions:   ${result.contributionsDerived ? "derived from spine.json" : "empty — edit template.yaml to add"}`);
    console.log("");
    console.log(`next: 'spine init --template ${args.name}' in any project to apply`);
  },
});

const pull = defineCommand({
  meta: { name: "pull", description: "Download a workspace template into your user template library." },
  args: {
    name: { type: "positional", required: true, description: "Template name" },
    force: { type: "boolean", required: false, description: "Overwrite existing local template", default: false },
  },
  async run({ args }) {
    try {
      const res = await pullWorkspaceTemplate({ name: args.name, force: args.force });
      console.log(`pulled "${args.name}" to ${res.templateDir}`);
      console.log(`  content hash: ${res.contentHash}`);
      console.log(`  apply with: spine init --template ${args.name}`);
    } catch (err) {
      handleError(err);
    }
  },
});

export default defineCommand({
  meta: { name: "template", description: "List, show, save, pull, and inspect templates." },
  subCommands: { list, show, save, pull },
});

function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 401) console.error("token rejected. run `spine login` again.");
    else if (err.status === 404) console.error("not found (template or workspace).");
    else if (err.status === 409) console.error(err.message);
    else console.error(`api error ${err.status}: ${err.message}`);
  } else {
    console.error(`${(err as Error).message}`);
  }
  process.exit(1);
}
