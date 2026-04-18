import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { getTemplate, listTemplates } from "../templates/registry.js";

const list = defineCommand({
  meta: { name: "list", description: "List available templates." },
  async run() {
    const all = await listTemplates();
    if (all.length === 0) {
      console.log("no templates available");
      return;
    }
    const nameWidth = Math.max(...all.map((t) => t.manifest.name.length));
    for (const t of all) {
      console.log(`  ${t.manifest.name.padEnd(nameWidth)}  ${t.manifest.title}`);
      console.log(`  ${"".padEnd(nameWidth)}  ${t.manifest.description}`);
      console.log("");
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
    console.log(`(${t.manifest.name}, projectType: ${t.manifest.projectType})`);
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

export default defineCommand({
  meta: { name: "template", description: "List, show, and inspect templates." },
  subCommands: { list, show },
});
