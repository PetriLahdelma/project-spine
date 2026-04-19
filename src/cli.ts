#!/usr/bin/env node
import {
  defineCommand,
  runCommand,
  showUsage,
  type CommandDef,
} from "citty";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { printBanner, TAGLINE } from "./ui/banner.js";

// Read the version from package.json at runtime so the release flow has a
// single source of truth (`npm version` updates package.json and we pick it
// up here automatically — no duplicate bump in source).
const PKG_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
const { version: VERSION } = JSON.parse(readFileSync(PKG_PATH, "utf8")) as { version: string };

const main = defineCommand({
  meta: {
    name: "spine",
    version: VERSION,
    description: `Project Spine — ${TAGLINE}.`,
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    compile: () => import("./commands/compile.js").then((m) => m.default),
    inspect: () => import("./commands/inspect.js").then((m) => m.default),
    export: () => import("./commands/export.js").then((m) => m.default),
    template: () => import("./commands/template.js").then((m) => m.default),
    explain: () => import("./commands/explain.js").then((m) => m.default),
    drift: () => import("./commands/drift.js").then((m) => m.default),
    // Hosted-tier subcommands (login / logout / whoami / workspace / publish /
    // rationale) live in src/commands/ but are intentionally unrouted while
    // the hosted tier is dormant. The OSS CLI should not advertise them.
  },
});

/**
 * Walk rawArgs and resolve the deepest matching (sub)command for subcommand-level
 * --help routing. Non-flag tokens advance the cursor into nested subCommands.
 * Returns [cmd, parent] so showUsage can render the full ancestry prefix.
 */
async function resolveDeepest(
  cmd: CommandDef,
  rawArgs: readonly string[],
): Promise<[CommandDef, CommandDef | undefined]> {
  let current: CommandDef = cmd;
  let parent: CommandDef | undefined;
  for (const arg of rawArgs) {
    if (arg.startsWith("-")) continue;
    const subs = (typeof current.subCommands === "function"
      ? await (current.subCommands as () => Promise<Record<string, unknown>>)()
      : current.subCommands) as Record<string, unknown> | undefined;
    const loader = subs?.[arg];
    if (!loader) break;
    const resolved =
      typeof loader === "function"
        ? await (loader as () => Promise<CommandDef>)()
        : (loader as CommandDef);
    parent = current;
    current = resolved;
  }
  return [current, parent];
}

function printError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`\n  error  ${msg}\n\n`);
}

async function dispatch(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  // Bare `spine`, or `spine h|help` → banner + top-level help.
  if (rawArgs.length === 0 || rawArgs[0] === "h" || rawArgs[0] === "help") {
    printBanner();
    await showUsage(main);
    return;
  }

  // `spine --version` / `spine -v`
  if (rawArgs.length === 1 && (rawArgs[0] === "--version" || rawArgs[0] === "-v")) {
    process.stdout.write(VERSION + "\n");
    return;
  }

  // `spine [any] --help|-h` → help for the deepest resolved subcommand.
  if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
    const [cmd, parent] = await resolveDeepest(main, rawArgs);
    await showUsage(cmd, parent);
    return;
  }

  try {
    await runCommand(main, { rawArgs });
  } catch (err) {
    printError(err);
    process.exit(1);
  }
}

dispatch().catch((err) => {
  printError(err);
  process.exit(1);
});
