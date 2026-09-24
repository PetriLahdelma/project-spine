import { describe, expect, it } from "vitest";
import { CaptureCorrectionOptionsSchema, CorrectionCaseSchema } from "./model.js";

const candidate = {
  id: "terminal-boundary", title: "Keep the correction", lesson: "Review the behavior.",
  image: `node@sha256:${"a".repeat(64)}`, testPath: "test/review.mjs", sourceFiles: ["src/a.mjs"],
};
const stored = {
  version: 1, id: candidate.id, title: candidate.title, lesson: candidate.lesson,
  source: { kind: "manual" }, revisions: { brokenSha: "b".repeat(40), fixedSha: "c".repeat(40) },
  execution: { image: candidate.image, harnessSha256: "d".repeat(64), testPath: candidate.testPath, testSha256: "e".repeat(64), testBase64: "YQ==" },
  sourceFiles: candidate.sourceFiles,
};

describe.each([
  { label: "newline", control: "\n" }, { label: "carriage return", control: "\r" },
  { label: "tab", control: "\t" }, { label: "ANSI escape", control: "\u001b[2J" },
  { label: "C1 escape", control: "\u009b2J" }, { label: "line separator", control: "\u2028" },
  { label: "directional override", control: "\u202e" },
])("terminal spoof boundary $label", ({ control }) => {
  it("rejects control-bearing titles and lessons before capture or presentation", () => {
    for (const field of ["title", "lesson"]) {
      const value = `ordinary${control}VERIFIED: forged`;
      expect(CaptureCorrectionOptionsSchema.safeParse({ ...candidate, [field]: value }).success).toBe(false);
      expect(CorrectionCaseSchema.safeParse({ ...stored, [field]: value }).success).toBe(false);
    }
  });

  it("rejects control-bearing source and test paths", () => {
    const path = `src/ordinary${control}VERIFIED.mjs`;
    expect(CaptureCorrectionOptionsSchema.safeParse({ ...candidate, sourceFiles: [path] }).success).toBe(false);
    expect(CaptureCorrectionOptionsSchema.safeParse({ ...candidate, testPath: path }).success).toBe(false);
    expect(CorrectionCaseSchema.safeParse({ ...stored, sourceFiles: [path] }).success).toBe(false);
    expect(CorrectionCaseSchema.safeParse({ ...stored, execution: { ...stored.execution, testPath: path } }).success).toBe(false);
  });
});

it("retains ordinary Unicode text and comma-containing path identities", () => {
  expect(CaptureCorrectionOptionsSchema.safeParse({ ...candidate, title: "Säilytä korjaus", sourceFiles: ["src/a, b.mjs"] }).success).toBe(true);
});
