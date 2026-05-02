import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolves the built `spine` CLI entry point.
 *
 *   - Production (installed from npm): this module lives at
 *     `dist/mcp/spawn.js` and the CLI is its sibling at `dist/cli.js`.
 *   - Local source (vitest, ts-node): this module is at `src/mcp/spawn.ts`
 *     and the CLI is two levels up at `dist/cli.js`.
 *   - Override via `SPINE_MCP_CLI` env var (tests, experimental setups).
 *
 * The first candidate that exists on disk wins.
 */
function resolveSpineCliPath(): string {
  const override = process.env.SPINE_MCP_CLI;
  if (override && existsSync(override)) return override;
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolvePath(here, "..", "cli.js"), // dist/mcp/ -> dist/cli.js
    resolvePath(here, "..", "..", "dist", "cli.js"), // src/mcp/ -> dist/cli.js
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // Fall back to the first candidate so the error message points somewhere
  // predictable rather than silently throwing here.
  return candidates[0]!;
}
const SPINE_CLI = resolveSpineCliPath();

export interface SpineRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface SpineRunOptions {
  /** Working directory for the child. Defaults to the MCP server's cwd. */
  cwd?: string;
  /** Hard cap on runtime; the process is killed if it exceeds this. */
  timeoutMs?: number;
  /** Extra env to layer on top of process.env. */
  env?: Record<string, string | undefined>;
}

const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Runs the `spine` CLI as a child process with the given args and collects
 * stdout / stderr / exit code. Never throws on non-zero exit — callers decide
 * how to surface CLI failures to the MCP client.
 */
export async function runSpine(
  args: readonly string[],
  opts: SpineRunOptions = {},
): Promise<SpineRunResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SPINE_CLI, ...args], {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`spine ${args.join(" ")} timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({ exitCode: code ?? -1, stdout, stderr });
    });
  });
}

/**
 * Tries to parse stdout as JSON. Returns undefined on failure (many Spine
 * commands emit plain text unless given `--json`, so parse errors are normal).
 */
export function parseJsonLoose(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}
