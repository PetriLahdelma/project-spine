import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { isDirectEntrypoint } from "./server.js";

const SERVER = resolve(__dirname, "..", "..", "dist", "mcp", "server.js");

describe("spine-mcp executable entrypoint", () => {
  const cleanup: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
  });

  it("keeps imports inert when argv has no canonical file", () => {
    expect(isDirectEntrypoint(import.meta.url, undefined)).toBe(false);
    expect(isDirectEntrypoint(import.meta.url, join(tmpdir(), "missing-spine-mcp-entrypoint"))).toBe(false);
  });

  it("starts through a symlink in a path with spaces and answers tools/list", async () => {
    const work = await mkdtemp(join(tmpdir(), "spine mcp entrypoint "));
    cleanup.push(work);
    const linkedEntrypoint = join(work, "spine mcp linked.js");
    await symlink(SERVER, linkedEntrypoint);

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [linkedEntrypoint],
      cwd: work,
      stderr: "pipe",
    });
    const client = new Client({ name: "entrypoint-regression", version: "0.0.0" });
    let stderr = "";
    transport.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    try {
      await client.connect(transport, { timeout: 10_000 });
      const listed = await client.listTools(undefined, { timeout: 10_000 });
      expect(listed.tools.some((tool) => tool.name === "spine_doctor"), stderr).toBe(true);
    } finally {
      await client.close().catch(() => {});
    }
  }, 20_000);
});
