import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

export default defineCommand({
  meta: {
    name: "explain",
    description: "Explain a warning id and show its suggested fix (if any).",
  },
  args: {
    id: {
      type: "positional",
      required: false,
      description: "Warning id (e.g. repo:framework-uncertain). Omit to list all open warnings.",
    },
    repo: { type: "string", description: "Path to repo root", default: "." },
    out: { type: "string", description: ".project-spine directory", default: ".project-spine" },
  },
  async run({ args }) {
    const root = resolve(process.cwd(), args.repo);
    const warningsPath = join(root, args.out, "warnings.json");
    const raw = await readFile(warningsPath, "utf8").catch(() => {
      throw new Error(`No warnings.json at ${warningsPath}. Run \`spine compile\` first.`);
    });
    const parsed = JSON.parse(raw) as { warnings: Array<{ id: string; severity: string; message: string; sources?: Array<{ kind: string; pointer: string }>; suggestion?: string }> };

    if (!args.id) {
      if (parsed.warnings.length === 0) {
        console.log("no open warnings");
        return;
      }
      const idWidth = Math.max(...parsed.warnings.map((w) => w.id.length));
      for (const w of parsed.warnings) {
        console.log(`  [${w.severity.padEnd(5)}] ${w.id.padEnd(idWidth)}  ${truncate(w.message, 80)}`);
      }
      console.log("");
      console.log(`${parsed.warnings.length} warning(s). Run \`spine explain <id>\` for detail.`);
      return;
    }

    const warning = parsed.warnings.find((w) => w.id === args.id);
    if (!warning) {
      console.error(`warning "${args.id}" not found in ${warningsPath}`);
      const available = parsed.warnings.map((w) => w.id).join(", ");
      console.error(`available: ${available || "(none)"}`);
      process.exitCode = 1;
      return;
    }

    console.log(`[${warning.severity}] ${warning.id}`);
    console.log("");
    console.log(`  ${warning.message}`);
    console.log("");
    if (warning.sources && warning.sources.length > 0) {
      console.log(`Sources:`);
      for (const s of warning.sources) console.log(`  - ${s.kind}: ${s.pointer}`);
      console.log("");
    }
    if (warning.suggestion) {
      console.log(`How to resolve:`);
      console.log(`  ${warning.suggestion}`);
      console.log("");
    } else {
      console.log(`(no suggestion recorded for this warning id — edit brief.md / repo state and recompile to see if it reappears.)`);
    }
  },
});

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
