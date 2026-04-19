import { defineCommand } from "citty";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fetchFigmaVariables, figmaToDtcg, parseFigmaUrl } from "../design/figma.js";

const pull = defineCommand({
  meta: {
    name: "pull",
    description:
      "Pull design tokens from Figma Variables into .project-spine/tokens.json (DTCG format). Requires Figma Enterprise — Team / Pro / Starter plans don't expose `file_variables:read`; use the Tokens Studio plugin path instead (see docs/tokens.md).",
  },
  args: {
    file: {
      type: "string",
      required: false,
      description: "Figma file key (take from a figma.com/design/<KEY>/... URL).",
    },
    url: {
      type: "string",
      required: false,
      description: "Figma file URL. Alternative to --file.",
    },
    out: {
      type: "string",
      default: ".project-spine/tokens.json",
      description: "Path to write the DTCG JSON.",
    },
    repo: { type: "string", description: "Path to repo root", default: "." },
  },
  async run({ args }) {
    const fileKey = resolveFileKey(args.file, args.url);
    const token = process.env["FIGMA_TOKEN"];
    if (!token) {
      throw new Error(
        "FIGMA_TOKEN env var is not set. Create a Figma personal access token (Settings → Account → Personal access tokens) with file-read + variables-read scopes and export it: `export FIGMA_TOKEN=figd_...`",
      );
    }

    const resp = await fetchFigmaVariables({ fileKey, token });
    const dtcg = figmaToDtcg(resp);
    const variableCount = countLeaves(dtcg);

    const root = resolve(process.cwd(), args.repo);
    const outPath = resolve(root, args.out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(dtcg, null, 2) + "\n", "utf8");

    console.log(`pulled ${variableCount} variable(s) from Figma file ${fileKey}`);
    console.log(`wrote ${outPath}`);
    console.log("");
    console.log(`next: spine compile --brief ./brief.md --repo . --tokens ${args.out}`);
  },
});

export default defineCommand({
  meta: {
    name: "tokens",
    description: "Design tokens — pull from Figma Variables, inspect, reuse across exporters.",
  },
  subCommands: { pull },
});

function resolveFileKey(file?: string, url?: string): string {
  if (file && url) {
    throw new Error("pass --file OR --url, not both.");
  }
  if (file) return file;
  if (url) {
    const key = parseFigmaUrl(url);
    if (!key) {
      throw new Error(
        `could not extract a Figma file key from "${url}". Expected https://www.figma.com/design/<KEY>/...`,
      );
    }
    return key;
  }
  throw new Error("--file <key> or --url <figma-url> is required.");
}

function countLeaves(tree: Record<string, unknown>): number {
  let n = 0;
  for (const v of Object.values(tree)) {
    if (v && typeof v === "object") {
      if ("$value" in v) n += 1;
      else n += countLeaves(v as Record<string, unknown>);
    }
  }
  return n;
}
