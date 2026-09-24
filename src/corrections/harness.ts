import { createHash } from "node:crypto";

export const HARNESS_SOURCE = String.raw`
import { run } from "node:test";
import { createHash } from "node:crypto";
const file = process.argv[2];
if (!file) throw new Error("missing test path");
const result = { version: 1, tests: 0, passed: 0, failed: 0, skipped: 0, todo: 0, assertionFailures: 0, infrastructureFailures: 0, otherFailures: 0, outputBytes: 0, outputOverflow: false, testIds: [] };
const record = (data) => result.testIds.push(createHash("sha256").update(String(data?.name ?? "")).digest("hex"));
const search = (value, predicate, seen = new WeakSet(), depth = 0) => { if (!value || typeof value !== "object" || depth > 8 || seen.has(value)) return false; seen.add(value); if (predicate(value)) return true; for (const key of Object.getOwnPropertyNames(value)) { try { if (search(value[key], predicate, seen, depth + 1)) return true; } catch {} } return false; };
const assertion = (error) => search(error, (item) => item.code === "ERR_ASSERTION" || item.name === "AssertionError");
const infrastructure = (error) => search(error, (item) => /(?:MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND|ERR_UNKNOWN_FILE_EXTENSION|ERR_INVALID_TYPESCRIPT_SYNTAX)/.test(String(item.code ?? "")) || item.name === "SyntaxError");
const controller = new AbortController();
const stream = run({ files: [file], concurrency: false, isolation: "process", execArgv: [], argv: [], signal: controller.signal });
stream.on("test:pass", (data) => { record(data); result.tests++; if (data.skip) result.skipped++; else if (data.todo) result.todo++; else result.passed++; });
stream.on("test:fail", (data) => { record(data); result.tests++; result.failed++; const error = data?.details?.error; if (assertion(error)) result.assertionFailures++; else if (infrastructure(error)) result.infrastructureFailures++; else result.otherFailures++; });
const countOutput = (data) => { result.outputBytes += Buffer.byteLength(String(data?.message ?? "")); if (result.outputBytes > 1048576 && !result.outputOverflow) { result.outputOverflow = true; result.infrastructureFailures++; controller.abort(); } };
stream.on("test:stdout", countOutput);
stream.on("test:stderr", countOutput);
stream.on("error", () => { result.infrastructureFailures++; process.exitCode = 2; });
stream.on("end", () => { process.stdout.write(JSON.stringify(result)); if (result.failed > 0) process.exitCode = 1; });
stream.resume();
`;

export const HARNESS_SHA256 = createHash("sha256").update(HARNESS_SOURCE).digest("hex");

export type HarnessResult = {
  version: 1;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  todo: number;
  assertionFailures: number;
  infrastructureFailures: number;
  otherFailures: number;
  outputBytes: number;
  outputOverflow: boolean;
  testIds: string[];
};

export function parseHarnessResult(value: string): HarnessResult {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("Correction harness did not return valid structured output"); }
  if (!parsed || typeof parsed !== "object") throw new Error("Correction harness returned an invalid result");
  const item = parsed as Record<string, unknown>;
  for (const key of ["tests", "passed", "failed", "skipped", "todo", "assertionFailures", "infrastructureFailures", "otherFailures", "outputBytes"] as const) {
    if (!Number.isSafeInteger(item[key]) || (item[key] as number) < 0) throw new Error(`Correction harness returned invalid ${key}`);
  }
  if (item.version !== 1 || typeof item.outputOverflow !== "boolean" || !Array.isArray(item.testIds) || !item.testIds.every((id) => typeof id === "string" && /^[a-f0-9]{64}$/.test(id))) {
    throw new Error("Correction harness returned an invalid result shape");
  }
  return item as HarnessResult;
}
