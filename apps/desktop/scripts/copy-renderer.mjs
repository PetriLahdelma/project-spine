import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = join(appRoot, "renderer");
const targetRoot = join(appRoot, "dist", "renderer");

await mkdir(targetRoot, { recursive: true });
await Promise.all([
  copyFile(join(sourceRoot, "index.html"), join(targetRoot, "index.html")),
  copyFile(join(sourceRoot, "styles.css"), join(targetRoot, "styles.css")),
]);
