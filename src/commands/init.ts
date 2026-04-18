import { defineCommand } from "citty";
import { mkdir, writeFile, access, readFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { getTemplate } from "../templates/registry.js";

const defaultBrief = `---
name: ""
projectType: "" # saas-marketing | app-dashboard | design-system | docs-portal | other
---

# Project brief

## Goals
-

## Audience
-

## Constraints
-

## Assumptions
-

## Risks
-

## Success criteria
-
`;

export default defineCommand({
  meta: {
    name: "init",
    description: "Scaffold .project-spine/ and a brief template (optionally from a preset).",
  },
  args: {
    cwd: { type: "string", description: "Directory to initialize", default: "." },
    template: {
      type: "string",
      description: "Preset: saas-marketing | app-dashboard | design-system | docs-portal",
      required: false,
    },
    force: { type: "boolean", description: "Overwrite existing brief.md", default: false },
  },
  async run({ args }) {
    const root = join(process.cwd(), args.cwd);
    const spineDir = join(root, ".project-spine");
    const briefPath = join(root, "brief.md");
    const designPath = join(root, "design-rules.md");

    await mkdir(spineDir, { recursive: true });
    await mkdir(join(spineDir, "exports"), { recursive: true });

    const hasBrief = await exists(briefPath);
    const shouldWriteBrief = !hasBrief || args.force;

    if (args.template) {
      const template = await getTemplate(args.template);
      if (shouldWriteBrief) {
        const content = await readFile(template.briefPath, "utf8");
        await writeFile(briefPath, content, "utf8");
        console.log(`wrote ${briefPath} (from template "${template.manifest.name}")`);
      } else {
        console.log(`brief.md already exists — skipped (pass --force to overwrite)`);
      }
      if (template.designPath) {
        const hasDesign = await exists(designPath);
        if (!hasDesign || args.force) {
          await copyFile(template.designPath, designPath);
          console.log(`wrote ${designPath} (from template "${template.manifest.name}")`);
        } else {
          console.log(`design-rules.md already exists — skipped (pass --force to overwrite)`);
        }
      }
      console.log("");
      console.log(`template: ${template.manifest.title}`);
      console.log(`  ${template.manifest.description}`);
      console.log("");
      console.log(
        `next: edit brief.md, then run 'spine compile --brief ./brief.md --repo . --template ${template.manifest.name}'`
      );
    } else {
      if (shouldWriteBrief) {
        await writeFile(briefPath, defaultBrief, "utf8");
        console.log(`wrote ${briefPath}`);
      } else {
        console.log(`brief.md already exists — skipped (pass --force to overwrite)`);
      }
      console.log(`initialized .project-spine/ at ${spineDir}`);
      console.log(`next: edit brief.md, then run 'spine compile --brief ./brief.md --repo ./'`);
      console.log(`tip: 'spine init --template saas-marketing' gives you a richer starting point.`);
    }
  },
});

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
