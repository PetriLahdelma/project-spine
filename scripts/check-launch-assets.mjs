#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const EXPECTED = [
  ["docs/product-hunt/assets/product-hunt-thumbnail.png", 600, 600],
  ["docs/product-hunt/assets/gallery-01-hero.png", 1270, 760],
  ["docs/product-hunt/assets/gallery-02-compile.png", 1270, 760],
  ["docs/product-hunt/assets/gallery-03-drift.png", 1270, 760],
  ["docs/product-hunt/assets/gallery-04-agents.png", 1270, 760],
  ["docs/product-hunt/assets/social-share.png", 1200, 630],
  ["site/public/og.png", 1200, 630],
];

let failed = false;
for (const [path, width, height] of EXPECTED) {
  const actual = await readPngSize(path).catch((err) => {
    failed = true;
    console.error(`missing or invalid launch asset: ${path}`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    return null;
  });
  if (!actual) continue;
  if (actual.width !== width || actual.height !== height) {
    failed = true;
    console.error(`${path}: expected ${width}x${height}, got ${actual.width}x${actual.height}`);
  }
}

if (failed) process.exitCode = 1;
else console.log(`launch asset check passed: ${EXPECTED.length} PNG files`);

async function readPngSize(path) {
  const buf = await readFile(path);
  const signature = "89504e470d0a1a0a";
  if (buf.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("not a PNG file");
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}
