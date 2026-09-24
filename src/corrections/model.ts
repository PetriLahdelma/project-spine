import { z } from "zod";

const SAFE_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const SHA = /^[a-f0-9]{40,64}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const IMAGE = /^[a-z0-9][a-z0-9._/-]*@sha256:[a-f0-9]{64}$/;
const PRINTABLE_LINE = /^[^\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]*$/u;
const TextSchema = z.string().regex(PRINTABLE_LINE, "Use a single line without terminal or directional controls").trim().min(1);

function safePath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("\0") || path.includes("\\")) return false;
  const parts = path.split("/");
  return parts.every((part) => part !== "" && part !== "." && part !== ".." && part !== ".git" && part !== ".project-spine" && part !== ".spine-harness");
}

const PathSchema = z.string().max(240).regex(PRINTABLE_LINE, "Path must be a single line without terminal or directional controls").refine(safePath, "unsafe repository-relative path");
const SourceFilesSchema = z.array(PathSchema).min(1).max(128);

export const CorrectionCaseSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1).max(64).regex(SAFE_ID),
  title: TextSchema.max(200),
  lesson: TextSchema.max(2_000),
  source: z.object({
    kind: z.enum(["manual", "github"]),
    url: z.string().url().max(2_000).optional(),
  }).strict(),
  revisions: z.object({ brokenSha: z.string().regex(SHA), fixedSha: z.string().regex(SHA) }).strict(),
  execution: z.object({
    image: z.string().regex(IMAGE),
    harnessSha256: z.string().regex(SHA256),
    testPath: PathSchema,
    testSha256: z.string().regex(SHA256),
    testBase64: z.string().max(350_000).regex(/^[A-Za-z0-9+/]*={0,2}$/),
  }).strict(),
  sourceFiles: SourceFilesSchema,
}).strict().superRefine((value, ctx) => {
  if (value.revisions.brokenSha === value.revisions.fixedSha) {
    ctx.addIssue({ code: "custom", path: ["revisions"], message: "broken and fixed revisions must differ" });
  }
  if (!/[.](?:mjs|js)$/.test(value.execution.testPath)) {
    ctx.addIssue({ code: "custom", path: ["execution", "testPath"], message: "test must be a Node .js or .mjs module" });
  }
  const seen = new Set<string>();
  for (const [index, path] of value.sourceFiles.entries()) {
    if (path === value.execution.testPath) ctx.addIssue({ code: "custom", path: ["sourceFiles", index], message: "testPath is stored separately" });
    if (seen.has(path)) ctx.addIssue({ code: "custom", path: ["sourceFiles", index], message: `duplicate path: ${path}` });
    seen.add(path);
  }
});

export const CaptureCorrectionOptionsSchema = z.object({
  id: z.string().min(1).max(64).regex(SAFE_ID),
  title: TextSchema.max(200),
  lesson: TextSchema.max(2_000),
  image: z.string().regex(IMAGE),
  testPath: PathSchema.refine((path) => /[.](?:mjs|js)$/.test(path), "test must be a Node .js or .mjs module"),
  sourceFiles: SourceFilesSchema,
  sourceUrl: z.string().url().max(2_000).optional(),
}).strict().superRefine((value, ctx) => {
  const seen = new Set<string>();
  for (const [index, path] of value.sourceFiles.entries()) {
    if (path === value.testPath) ctx.addIssue({ code: "custom", path: ["sourceFiles", index], message: "testPath is stored separately" });
    if (seen.has(path)) ctx.addIssue({ code: "custom", path: ["sourceFiles", index], message: `duplicate path: ${path}` });
    seen.add(path);
  }
});

export type CorrectionCase = z.infer<typeof CorrectionCaseSchema>;

export type CorrectionContext = {
  status: "candidate" | "verified";
  matched: boolean;
  caseId: string;
  title: string;
  lesson: string;
  files: string[];
  provenance: CorrectionCase["source"] & { brokenSha: string; fixedSha: string };
  warning?: string;
};

export type SnapshotManifest = {
  revision: "broken" | "fixed" | "current";
  files: Array<{ path: string; sha256: string; bytes: number; mode: "100644" | "100755"; role: "subject" | "test" }>;
  snapshotHash: string;
};

export type TestOutcome = {
  revision: "broken" | "fixed" | "current";
  exitCode: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  todo: number;
  assertionFailures: number;
  infrastructureFailures: number;
  otherFailures: number;
  testIds: string[];
  snapshot: SnapshotManifest;
};

export type CorrectionVerification = {
  version: 1;
  kind: "correction-verification";
  verified: true;
  observational: true;
  checkedAt: string;
  caseHash: string;
  testHash: string;
  controlHash: string;
  runtime: { imageReference: string; imageId: string; platform: string; harnessSha256: string; executionUid: number; executionGid: number };
  broken: TestOutcome;
  fixed: TestOutcome;
  context: CorrectionContext;
};

export type CorrectionCheck = {
  version: 1;
  kind: "correction-check";
  passed: boolean;
  observational: true;
  checkedAt: string;
  caseHash: string;
  testHash: string;
  controlHash: string;
  checkHash: string;
  runtime: CorrectionVerification["runtime"];
  controls: CorrectionVerification;
  current: TestOutcome;
  context: CorrectionContext;
};
