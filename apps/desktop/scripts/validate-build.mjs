import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredFiles = [
  "dist/main.js",
  "dist/preload.js",
  "dist/contracts.js",
  "dist/renderer/index.html",
  "dist/renderer/index.js",
  "dist/renderer/styles.css",
];

for (const file of requiredFiles) {
  await readFile(join(appRoot, file), "utf8");
}

const html = await readFile(join(appRoot, "dist/renderer/index.html"), "utf8");
if (!html.includes("Content-Security-Policy")) {
  throw new Error("renderer is missing a Content Security Policy");
}
if (!html.includes('script type="module" src="./index.js"')) {
  throw new Error("renderer is not loading the compiled renderer script");
}

const renderer = await readFile(join(appRoot, "dist/renderer/index.js"), "utf8");
if (renderer.includes("exports.")) {
  throw new Error("renderer build must be an ES module, not CommonJS");
}

const contracts = await readFile(join(appRoot, "dist/contracts.js"), "utf8");
if (contracts.includes("export function")) {
  throw new Error("main-process contracts build must be CommonJS, not ESM");
}

const main = await readFile(join(appRoot, "dist/main.js"), "utf8");
for (const expected of ["contextIsolation: true", "nodeIntegration: false", "sandbox: true"]) {
  if (!main.includes(expected)) {
    throw new Error(`main process build is missing ${expected}`);
  }
}

console.log("desktop build verified");
