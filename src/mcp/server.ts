#!/usr/bin/env node
/**
 * Project Spine — MCP server (stdio transport).
 *
 * Exposes the Spine CLI surface to any MCP-speaking client (Claude Code,
 * Cursor, Continue, etc.) as a set of structured tools. The server is a thin
 * wrapper: each tool shells out to the sibling `spine` binary and returns
 * both a human-readable text block and, where the CLI supports `--json`, a
 * parsed `structuredContent` payload.
 *
 * Entry point for the `spine-mcp` bin. See docs/mcp.md for client setup.
 */
import { readFileSync } from "node:fs";
import { join, resolve as resolvePath, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runSpine, parseJsonLoose } from "./spawn.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_PATH = resolvePath(HERE, "..", "..", "package.json");
const { version: VERSION } = JSON.parse(readFileSync(PKG_PATH, "utf8")) as { version: string };

interface ToolResultBlock {
  [x: string]: unknown;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

/**
 * Shapes a uniform result block from a CLI run. If `--json` stdout parses, it
 * is attached as `structuredContent`. Non-zero exit codes set `isError`.
 */
function shapeResult(
  cmd: string,
  run: { exitCode: number; stdout: string; stderr: string },
  opts: { jsonStdout?: boolean } = {},
): ToolResultBlock {
  const parsed = opts.jsonStdout ? parseJsonLoose(run.stdout) : undefined;
  const lines: string[] = [];
  if (run.stdout.trim()) lines.push(run.stdout.trimEnd());
  if (run.stderr.trim()) lines.push(`[stderr]\n${run.stderr.trimEnd()}`);
  if (!lines.length) lines.push(`spine ${cmd} exited ${run.exitCode} with no output.`);

  const block: ToolResultBlock = {
    content: [{ type: "text", text: lines.join("\n\n") }],
  };
  if (parsed && typeof parsed === "object" && parsed !== null) {
    block.structuredContent = parsed as Record<string, unknown>;
  }
  if (run.exitCode !== 0) {
    block.isError = true;
  }
  return block;
}

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "project-spine", version: VERSION },
    {
      capabilities: { tools: {}, resources: {} },
      instructions:
        "Project Spine compiles a client brief, a repo, and optional design tokens into repo-native agent instructions (AGENTS.md, CLAUDE.md, .github/copilot-instructions.md, Cursor rules) plus a full .project-spine/ operating layer. Use spine_doctor to verify the local beta CLI surface, spine_drift_check before modifying generated files, and spine_compile to refresh them after input changes.",
    },
  );

  // ---------- Tools ----------

  server.registerTool(
    "spine_compile",
    {
      title: "Compile brief + repo → agent instructions",
      description:
        "Compile a client brief, repo, and optional design tokens into the 21-file Spine operating layer (AGENTS.md, CLAUDE.md, copilot-instructions, Cursor rules, plus .project-spine/). Writes to the filesystem. Re-run whenever brief, repo, or tokens change.",
      inputSchema: {
        brief: z
          .string()
          .default("./brief.md")
          .describe("Path to brief.md, relative to repoPath."),
        repoPath: z
          .string()
          .default(".")
          .describe("Repo root to scan and write into."),
        template: z
          .string()
          .optional()
          .describe(
            "Optional template name (saas-marketing, saas-dashboard, saas-auth, agency-site, ecommerce, b2b-marketing, api-service, monorepo).",
          ),
        tokens: z
          .string()
          .optional()
          .describe("Optional path to a design tokens JSON file (DTCG or Tokens Studio)."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ brief, repoPath, template, tokens }) => {
      const args = ["compile", "--brief", brief, "--repo", repoPath];
      if (template) args.push("--template", template);
      if (tokens) args.push("--tokens", tokens);
      const run = await runSpine(args, { cwd: resolvePath(repoPath) });
      return shapeResult("compile", run);
    },
  );

  server.registerTool(
    "spine_doctor",
    {
      title: "Verify local Project Spine readiness",
      description:
        "Runs the public beta readiness checks: package version, npm channel, Node runtime, routed CLI surface, hosted command guardrails, network posture, and local drift state.",
      inputSchema: {
        repoPath: z.string().default(".").describe("Repo root to check."),
        strict: z
          .boolean()
          .default(false)
          .describe("Exit non-zero when warnings are present, not only failures."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ repoPath, strict }) => {
      const args = ["doctor", "--repo", repoPath, "--json"];
      if (strict) args.push("--strict");
      const run = await runSpine(args, { cwd: resolvePath(repoPath) });
      return shapeResult("doctor", run, { jsonStdout: true });
    },
  );

  server.registerTool(
    "spine_drift_check",
    {
      title: "Check drift between last compile and current state",
      description:
        "Checks whether any input (brief, tokens) or output (AGENTS.md, CLAUDE.md, etc.) has changed since the last compile. Returns a structured report. Exit code is non-zero when drift is found.",
      inputSchema: {
        repoPath: z.string().default(".").describe("Repo root to check."),
        failOn: z
          .enum(["none", "any", "inputs", "exports"])
          .default("any")
          .describe("Which drift kinds should cause a non-zero exit."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ repoPath, failOn }) => {
      const run = await runSpine(
        ["drift", "check", "--repo", repoPath, "--json", "--fail-on", failOn],
        { cwd: resolvePath(repoPath) },
      );
      return shapeResult("drift check", run, { jsonStdout: true });
    },
  );

  server.registerTool(
    "spine_drift_diff",
    {
      title: "Unified diff of drifted exports",
      description:
        "Returns a structured payload of unified diffs for each generated file that has been hand-edited since the last compile. Use after spine_drift_check reports drift and you want to see the exact changes.",
      inputSchema: {
        repoPath: z.string().default(".").describe("Repo root to diff."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ repoPath }) => {
      const run = await runSpine(
        ["drift", "diff", "--repo", repoPath, "--json"],
        { cwd: resolvePath(repoPath) },
      );
      return shapeResult("drift diff", run, { jsonStdout: true });
    },
  );

  server.registerTool(
    "spine_init",
    {
      title: "Scaffold a brief.md from a template",
      description:
        "Writes a starter brief.md at repoPath (default cwd) using one of the built-in templates. Safe to run in an empty directory.",
      inputSchema: {
        repoPath: z.string().default(".").describe("Where to write brief.md."),
        template: z
          .string()
          .default("saas-marketing")
          .describe("Template name — see spine_compile for the full list."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ repoPath, template }) => {
      const run = await runSpine(["init", "--template", template], {
        cwd: resolvePath(repoPath),
      });
      return shapeResult("init", run);
    },
  );

  server.registerTool(
    "spine_tokens_pull",
    {
      title: "Pull design tokens from Figma's Variables API",
      description:
        "Pulls design tokens from a Figma file via the Variables REST API and writes them to tokens.json. Requires a FIGMA_TOKEN environment variable with `file_variables:read` scope. Note: Figma's Variables API is Enterprise-only as of 2026; Starter / Professional / Organization tiers will hit a 403 with a clear error.",
      inputSchema: {
        repoPath: z.string().default(".").describe("Where to write tokens.json."),
        fileKey: z
          .string()
          .describe("Figma file key — the alphanumeric segment in the Figma URL."),
        output: z
          .string()
          .default("./tokens.json")
          .describe("Output path for the tokens JSON file."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ repoPath, fileKey, output }) => {
      const run = await runSpine(
        ["tokens", "pull", "--file", fileKey, "--out", output],
        { cwd: resolvePath(repoPath) },
      );
      return shapeResult("tokens pull", run);
    },
  );

  // ---------- Resources ----------

  // Fixed URI: the current repo's export manifest.
  server.registerResource(
    "spine-manifest",
    "spine://manifest",
    {
      title: "Export manifest",
      description:
        "The .project-spine/export-manifest.json for the cwd. Contains a SHA-256 hash of every generated file and its last-compile timestamp.",
      mimeType: "application/json",
    },
    async (uri) => {
      try {
        const path = join(process.cwd(), ".project-spine", "export-manifest.json");
        const body = readFileSync(path, "utf8");
        return {
          contents: [
            { uri: uri.href, mimeType: "application/json", text: body },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `No export manifest at ${process.cwd()}/.project-spine/export-manifest.json. Run spine_compile first. (${msg})`,
            },
          ],
        };
      }
    },
  );

  return server;
}

async function main(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Note: no stdout log — stdio transport owns stdout. stderr is free for
  // diagnostics if we ever need them.
}

// Only run when invoked as a binary. Allows importing buildServer() from tests.
const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main().catch((err) => {
    process.stderr.write(`[spine-mcp] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exit(1);
  });
}
