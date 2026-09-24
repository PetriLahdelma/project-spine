import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { compareRegistryMetadata, fetchRegistryMetadata, readPackResult } from "./release-registry-state.mjs";

function registryResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("accepts registry metadata only when identity and integrity match", () => {
  assert.deepEqual(
    compareRegistryMetadata({
      expectedName: "project-spine",
      expectedVersion: "1.2.3-beta.0",
      expectedIntegrity: "sha512-match",
      metadata: {
        name: "project-spine",
        version: "1.2.3-beta.0",
        dist: { integrity: "sha512-match" },
      },
    }),
    { published: true, integrity: "sha512-match" },
  );
});

test("rejects an already-published version with a different tarball", () => {
  assert.throws(
    () =>
      compareRegistryMetadata({
        expectedName: "project-spine",
        expectedVersion: "1.2.3-beta.0",
        expectedIntegrity: "sha512-local",
        metadata: {
          name: "project-spine",
          version: "1.2.3-beta.0",
          dist: { integrity: "sha512-registry" },
        },
      }),
    /integrity mismatch/,
  );
});

test("validates npm pack identity and the tarball path", () => {
  const directory = mkdtempSync(join(tmpdir(), "spine-release-state-"));
  const tarball = join(directory, "project-spine-1.2.3-beta.0.tgz");
  const packJson = join(directory, "npm-pack.json");
  const bytes = Buffer.from("fixture");
  const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  writeFileSync(tarball, bytes);
  writeFileSync(
    packJson,
    JSON.stringify([
      {
        name: "project-spine",
        version: "1.2.3-beta.0",
        filename: "project-spine-1.2.3-beta.0.tgz",
        integrity,
      },
    ]),
  );
  assert.deepEqual(readPackResult(packJson, directory, "project-spine", "1.2.3-beta.0"), {
    integrity,
    tarball,
  });
});

test("rejects altered tarball bytes", () => {
  const directory = mkdtempSync(join(tmpdir(), "spine-release-state-"));
  const filename = "project-spine-1.2.3-beta.0.tgz";
  writeFileSync(join(directory, filename), "altered");
  const packJson = join(directory, "npm-pack.json");
  writeFileSync(
    packJson,
    JSON.stringify([
      {
        name: "project-spine",
        version: "1.2.3-beta.0",
        filename,
        integrity: "sha512-original",
      },
    ]),
  );
  assert.throws(
    () => readPackResult(packJson, directory, "project-spine", "1.2.3-beta.0"),
    /local tarball integrity mismatch/,
  );
});

test("rejects a tarball filename with path traversal", () => {
  const directory = mkdtempSync(join(tmpdir(), "spine-release-state-"));
  const packJson = join(directory, "npm-pack.json");
  writeFileSync(
    packJson,
    JSON.stringify([
      {
        name: "project-spine",
        version: "1.2.3-beta.0",
        filename: "../project-spine-1.2.3-beta.0.tgz",
        integrity: "sha512-local",
      },
    ]),
  );
  assert.throws(
    () => readPackResult(packJson, directory, "project-spine", "1.2.3-beta.0"),
    /must not contain a path/,
  );
});

test("treats a 404 as unpublished during preflight", async () => {
  let calls = 0;
  const metadata = await fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
    fetchImpl: async () => {
      calls += 1;
      return registryResponse(404, { error: "Not found" });
    },
    delayImpl: async () => {},
  });
  assert.equal(metadata, null);
  assert.equal(calls, 1);
});

test("never treats registry authentication failures as an unpublished version", async () => {
  for (const status of [401, 403]) {
    let calls = 0;
    await assert.rejects(
      fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
        fetchImpl: async () => {
          calls += 1;
          return registryResponse(status, { error: "authentication required" });
        },
        delayImpl: async () => {},
      }),
      new RegExp(`HTTP ${status}`),
    );
    assert.equal(calls, 1);
  }
});

test("requires a published version after bounded 404 retries", async () => {
  let calls = 0;
  await assert.rejects(
    fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
      requirePublished: true,
      attempts: 3,
      fetchImpl: async () => {
        calls += 1;
        return registryResponse(404, { error: "Not found" });
      },
      delayImpl: async () => {},
    }),
    /registry has not exposed the published version yet \(3\/3\)/,
  );
  assert.equal(calls, 3);
});

test("returns matching registry metadata on success", async () => {
  const expected = {
    name: "project-spine",
    version: "1.2.3",
    dist: { integrity: "sha512-match" },
  };
  let calls = 0;
  const metadata = await fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
    requirePublished: true,
    fetchImpl: async () => {
      calls += 1;
      return registryResponse(200, expected);
    },
    delayImpl: async () => {},
  });
  assert.deepEqual(metadata, expected);
  assert.equal(calls, 1);
});

test("post-publish visibility tolerates two minutes of propagation with bounded requests", async () => {
  let calls = 0;
  const waits = [];
  const expected = { name: "project-spine", version: "1.2.3" };
  const metadata = await fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
    requirePublished: true,
    fetchImpl: async (_url, options) => {
      assert.ok(options.signal instanceof AbortSignal);
      calls += 1;
      return calls === 13 ? registryResponse(200, expected) : registryResponse(404, {});
    },
    delayImpl: async (milliseconds) => { waits.push(milliseconds); },
  });
  assert.deepEqual(metadata, expected);
  assert.equal(calls, 13);
  assert.deepEqual(waits, Array(12).fill(10_000));
});

test("post-publish visibility still fails after its complete retry budget", async () => {
  let calls = 0;
  const waits = [];
  await assert.rejects(fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
    requirePublished: true,
    fetchImpl: async () => { calls += 1; return registryResponse(404, {}); },
    delayImpl: async (milliseconds) => { waits.push(milliseconds); },
  }), /not exposed.*\(13\/13\)/);
  assert.equal(calls, 13);
  assert.deepEqual(waits, Array(12).fill(10_000));
});

test("post-publish retries transient failures without weakening authentication failures", async () => {
  for (const failure of [429, 503, "network"]) {
    let calls = 0;
    const waits = [];
    const metadata = await fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
      requirePublished: true,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 2) return registryResponse(200, { version: "1.2.3" });
        if (failure === "network") throw new Error("connection interrupted");
        return registryResponse(failure, {});
      },
      delayImpl: async (milliseconds) => { waits.push(milliseconds); },
    });
    assert.equal(metadata.version, "1.2.3");
    assert.deepEqual(waits, [10_000]);
  }
  for (const status of [400, 401, 403]) {
    await assert.rejects(fetchRegistryMetadata("https://registry.example/project-spine/1.2.3", {
      requirePublished: true,
      fetchImpl: async () => registryResponse(status, {}),
      delayImpl: async () => { assert.fail("non-retryable failures must not wait"); },
    }), new RegExp(`HTTP ${status}`));
  }
});
