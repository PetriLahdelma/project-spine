#!/usr/bin/env node
import { createHash } from "node:crypto";
import { appendFileSync, lstatSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_REGISTRY = "https://registry.npmjs.org";

export function compareRegistryMetadata({ expectedName, expectedVersion, expectedIntegrity, metadata }) {
  if (metadata.name !== expectedName || metadata.version !== expectedVersion) {
    throw new Error(
      `registry returned ${String(metadata.name)}@${String(metadata.version)}, expected ${expectedName}@${expectedVersion}`,
    );
  }
  const registryIntegrity = metadata.dist?.integrity;
  if (typeof registryIntegrity !== "string" || registryIntegrity.length === 0) {
    throw new Error(`registry metadata for ${expectedName}@${expectedVersion} has no dist.integrity`);
  }
  if (registryIntegrity !== expectedIntegrity) {
    throw new Error(
      `registry integrity mismatch for ${expectedName}@${expectedVersion}: ${registryIntegrity} != ${expectedIntegrity}`,
    );
  }
  return { published: true, integrity: registryIntegrity };
}

export function readPackResult(packJsonPath, tarballDir, expectedName, expectedVersion) {
  const parsed = JSON.parse(readFileSync(packJsonPath, "utf8"));
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error(`expected one npm pack result in ${packJsonPath}`);
  }
  const packed = parsed[0];
  if (packed?.name !== expectedName || packed?.version !== expectedVersion) {
    throw new Error(
      `packed ${String(packed?.name)}@${String(packed?.version)}, expected ${expectedName}@${expectedVersion}`,
    );
  }
  if (typeof packed.integrity !== "string" || typeof packed.filename !== "string") {
    throw new Error("npm pack result must contain integrity and filename");
  }
  if (basename(packed.filename) !== packed.filename) {
    throw new Error(`npm pack filename must not contain a path: ${packed.filename}`);
  }
  const resolvedDirectory = resolve(tarballDir);
  const tarball = resolve(resolvedDirectory, packed.filename);
  if (dirname(tarball) !== resolvedDirectory) throw new Error(`packed tarball escapes its directory: ${tarball}`);
  if (!lstatSync(tarball).isFile()) throw new Error(`packed tarball is not a regular file: ${tarball}`);
  const actualIntegrity = `sha512-${createHash("sha512").update(readFileSync(tarball)).digest("base64")}`;
  if (actualIntegrity !== packed.integrity) {
    throw new Error(`local tarball integrity mismatch: ${actualIntegrity} != ${packed.integrity}`);
  }
  return { integrity: packed.integrity, tarball };
}

export async function fetchRegistryMetadata(
  url,
  {
    requirePublished = false,
    fetchImpl = globalThis.fetch,
    delayImpl = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds)),
    attempts = requirePublished ? 5 : 3,
    timeoutMs = 10_000,
  } = {},
) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < attempts) await delayImpl(2000);
      continue;
    }
    if (response.status === 404) {
      if (!requirePublished) return null;
      lastError = new Error(`registry has not exposed the published version yet (${attempt}/${attempts})`);
    } else if (response.ok) {
      return await response.json();
    } else {
      const body = (await response.text()).slice(0, 500);
      lastError = new Error(`registry request failed with HTTP ${response.status}: ${body}`);
      if (response.status < 500 && response.status !== 429) throw lastError;
    }
    if (attempt < attempts) await delayImpl(2000);
  }
  throw lastError ?? new Error("registry request failed");
}

function parseArgs(argv) {
  const values = new Map();
  let requirePublished = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--require-published") {
      requirePublished = true;
      continue;
    }
    if (!arg?.startsWith("--")) throw new Error(`unexpected argument: ${String(arg)}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`missing value for ${arg}`);
    values.set(arg, value);
    index += 1;
  }
  const required = ["--pack-json", "--tarball-dir", "--package", "--version", "--output"];
  for (const name of required) if (!values.has(name)) throw new Error(`missing required argument ${name}`);
  return { values, requirePublished };
}

async function main() {
  const { values, requirePublished } = parseArgs(process.argv.slice(2));
  const packageName = values.get("--package");
  const version = values.get("--version");
  const output = values.get("--output");
  const packed = readPackResult(values.get("--pack-json"), values.get("--tarball-dir"), packageName, version);
  const base = (process.env.NPM_REGISTRY_URL ?? DEFAULT_REGISTRY).replace(/\/$/, "");
  const url = `${base}/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`;
  const metadata = await fetchRegistryMetadata(url, { requirePublished });
  const state = metadata
    ? compareRegistryMetadata({
        expectedName: packageName,
        expectedVersion: version,
        expectedIntegrity: packed.integrity,
        metadata,
      })
    : { published: false, integrity: packed.integrity };
  appendFileSync(output, `published=${state.published}\n`);
  appendFileSync(output, `integrity=${state.integrity}\n`);
  appendFileSync(output, `tarball=${packed.tarball}\n`);
  console.log(
    state.published
      ? `verified ${packageName}@${version} at the registry with matching integrity`
      : `${packageName}@${version} is not published; the exact tarball is ready for trusted publishing`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
