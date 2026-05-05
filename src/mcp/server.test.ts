/**
 * MCP server smoke test.
 *
 * Uses an in-memory duplex transport pair to drive the server without
 * spawning a subprocess. Exercises the three highest-leverage paths:
 *   1. initialize + tools/list returns the expected tool names.
 *   2. calling spine_doctor returns structured readiness checks.
 *   3. calling spine_drift_check on an empty dir surfaces a useful error
 *      (the CLI reports "manifest:missing", exit code non-zero).
 *   4. calling spine_init writes brief.md to a tmp dir and exits zero.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, access, constants as fsConstants } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "./server.js";

async function connect() {
  const server = buildServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

describe("spine-mcp", () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), "spine-mcp-"));
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it("exposes the expected tool set via tools/list", async () => {
    const { client, server } = await connect();
    try {
      const listed = await client.listTools();
      const names = listed.tools.map((t) => t.name).sort();
      expect(names).toEqual([
        "spine_compile",
        "spine_doctor",
        "spine_drift_check",
        "spine_drift_diff",
        "spine_init",
        "spine_tokens_pull",
      ]);
      // Annotations should be set on the readonly tools.
      const check = listed.tools.find((t) => t.name === "spine_drift_check");
      expect(check?.annotations?.readOnlyHint).toBe(true);
      const compile = listed.tools.find((t) => t.name === "spine_compile");
      expect(compile?.annotations?.destructiveHint).toBe(true);
      const doctor = listed.tools.find((t) => t.name === "spine_doctor");
      expect(doctor?.annotations?.readOnlyHint).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("spine_doctor returns structured beta readiness checks", async () => {
    const { client, server } = await connect();
    try {
      const result = await client.callTool({
        name: "spine_doctor",
        arguments: { repoPath: work },
      });
      expect(result.isError).toBeFalsy();
      const sc = result.structuredContent as
        | { ok?: boolean; version?: string; checks?: { name?: string; status?: string }[] }
        | undefined;
      expect(sc?.ok).toBe(true);
      expect(sc?.version).toContain("-beta.");
      expect(sc?.checks?.some((check) => check.name === "routed commands")).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  }, 30_000);

  it("spine_init writes brief.md into the target repoPath", async () => {
    const { client, server } = await connect();
    try {
      const result = await client.callTool({
        name: "spine_init",
        arguments: { repoPath: work, template: "saas-marketing" },
      });
      expect(result.isError).toBeFalsy();
      // brief.md should now exist.
      await expect(access(join(work, "brief.md"), fsConstants.R_OK)).resolves.toBeUndefined();
    } finally {
      await client.close();
      await server.close();
    }
  }, 30_000);

  it("spine_drift_check on an empty repo reports manifest:missing", async () => {
    const { client, server } = await connect();
    try {
      const result = await client.callTool({
        name: "spine_drift_check",
        arguments: { repoPath: work, failOn: "any" },
      });
      // Non-zero exit (drift found: manifest missing).
      expect(result.isError).toBe(true);
      const sc = result.structuredContent as
        | { clean?: boolean; items?: { kind?: string }[] }
        | undefined;
      expect(sc?.clean).toBe(false);
      expect(sc?.items?.some((i) => i.kind === "manifest:missing")).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  }, 30_000);
});
