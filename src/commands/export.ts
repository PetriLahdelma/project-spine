import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { SpineModel } from "../model/spine.js";
import { writeAllExports, parseTargets } from "../exporters/index.js";

export default defineCommand({
  meta: {
    name: "export",
    description: "Regenerate exports from an existing spine.json.",
  },
  args: {
    repo: { type: "string", description: "Path to repo root", default: "." },
    out: { type: "string", description: ".project-spine/ directory", default: ".project-spine" },
    targets: {
      type: "string",
      description:
        "Comma-separated targets: agents,claude,copilot,scaffold,routes,components,qa,backlog,rationale,all",
      default: "all",
    },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const outDir = resolve(root, args.out);
    const spinePath = join(outDir, "spine.json");
    const raw = await readFile(spinePath, "utf8").catch(() => {
      throw new Error(`No spine.json at ${spinePath}. Run \`spine compile\` first.`);
    });
    const spine = SpineModel.parse(JSON.parse(raw));
    const targets = parseTargets(args.targets);

    const written = await writeAllExports(spine, { repoRoot: root, outDir, targets });
    console.log(`regenerated ${written.length} export${written.length === 1 ? "" : "s"} from spine hash ${spine.metadata.hash}:`);
    for (const f of written) console.log(`  ${f}`);
  },
});
