import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { getTemplate, listTemplates, userTemplatesDir } from "../templates/registry.js";
import { saveTemplate } from "../templates/save.js";
import type { ProjectType } from "../model/spine.js";

const list = defineCommand({
  meta: { name: "list", description: "List available templates (bundled + user + project)." },
  async run() {
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
    // Hosted-tier workspace templates (list --workspace, push, pull) live in
    // src/templates/workspace-sync.ts but are unrouted while the hosted tier
    // is dormant. Revive those paths here if the tier wakes back up.
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
    console.log("");
    console.log(`next: 'spine init --template ${t.manifest.name}' scaffolds this brief into a new project.`);
  },
});

const save = defineCommand({
  meta: {
    name: "save",
    description: "Save the current project as a reusable template (user or project scope).",
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
      description: "Where to save: user | project",
    },
    force: { type: "boolean", required: false, description: "Overwrite existing template", default: false },
  },
  async run({ args }) {
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

export default defineCommand({
  meta: { name: "template", description: "List, show, and save templates." },
  subCommands: { list, show, save },
});
