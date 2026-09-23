import { z } from "zod";

const SAFE_ID = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40,64}$/;

function isSafePattern(pattern: string): boolean {
  if (pattern.startsWith("/") || pattern.startsWith("!") || pattern.includes("\\") || pattern.includes("\0")) return false;
  if (pattern.split("/").some((part) => part === ".." || part === "")) return false;
  // Keep the matching language small and deterministic. Character classes,
  // brace expansion and extglobs have subtly different meanings across tools.
  return !/[\[\]{}()]/.test(pattern);
}

export const LearningRuleSchema = z.object({
  id: z.string().min(1).max(64).regex(SAFE_ID),
  description: z.string().trim().min(1).max(500),
  files: z.array(z.string().min(1).max(240).refine(isSafePattern, "unsafe or unsupported file pattern")).min(1).max(16),
  kind: z.enum(["forbid-text", "require-text"]),
  text: z.string().min(1).max(4_096).refine((value) => !value.includes("\0"), "text cannot contain NUL"),
}).strict();

export const FailureCaseSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1).max(64).regex(SAFE_ID),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(2_000),
  source: z.object({
    kind: z.enum(["manual", "github"]),
    url: z.string().url().max(2_000).optional(),
    revision: z.string().min(1).max(200).optional(),
  }).strict(),
  rules: z.array(LearningRuleSchema).min(1).max(32).superRefine((rules, ctx) => {
    const seen = new Set<string>();
    for (const [index, rule] of rules.entries()) {
      if (seen.has(rule.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate rule id: ${rule.id}`, path: [index, "id"] });
      }
      seen.add(rule.id);
    }
  }),
  replay: z.object({
    brokenRef: z.string().trim().min(1).max(240),
    fixedRef: z.string().trim().min(1).max(240),
  }).strict(),
}).strict();

export type LearningRule = z.infer<typeof LearningRuleSchema>;
export type FailureCase = z.infer<typeof FailureCaseSchema>;

export const StoredLearningCaseSchema = z.object({
  schemaVersion: z.literal(1),
  case: FailureCaseSchema,
  evidence: z.object({
    inputHash: z.string().regex(SHA256),
    ingestedAt: z.string().datetime(),
    sourceFile: z.string().min(1).max(500),
  }).strict(),
}).strict();

export type StoredLearningCase = z.infer<typeof StoredLearningCaseSchema>;

export const ReplayVerificationSchema = z.object({
  schemaVersion: z.literal(1),
  caseId: z.string().regex(SAFE_ID),
  caseHash: z.string().regex(SHA256),
  ruleDigest: z.string().regex(SHA256),
  brokenSha: z.string().regex(GIT_SHA),
  fixedSha: z.string().regex(GIT_SHA),
  verifiedAt: z.string().datetime(),
  ruleIds: z.array(z.string().regex(SAFE_ID)).min(1).max(32),
}).strict();

export type ReplayVerification = z.infer<typeof ReplayVerificationSchema>;

export type RuleEvaluation = {
  caseId: string;
  ruleId: string;
  description: string;
  kind: LearningRule["kind"];
  passed: boolean;
  matchedFiles: string[];
  violatingFiles: string[];
  reason?: "no-coverage";
};

export type ReplayResult = {
  caseId: string;
  verified: true;
  brokenSha: string;
  fixedSha: string;
  broken: RuleEvaluation[];
  fixed: RuleEvaluation[];
  verification: ReplayVerification;
};

export type GuardReport = {
  evidence: Array<{
    caseId: string;
    title: string;
    source: FailureCase["source"];
    caseHash: string;
    ruleDigest: string;
    brokenSha: string;
    fixedSha: string;
  }>;
  checkedAt: string;
  status: "passed" | "failed" | "unprotected" | "uncovered";
  protected: boolean;
  caseCount: number;
  ruleCount: number;
  checkedRuleCount: number;
  skippedCaseIds: string[];
  unverifiedCaseIds: string[];
  checkedFiles: string[];
  uncoveredFiles: string[];
  passed: boolean;
  evaluations: RuleEvaluation[];
  violations: RuleEvaluation[];
};

export type ContextInstruction = {
  caseId: string;
  ruleId: string;
  description: string;
  kind: LearningRule["kind"];
  text: string;
  matchingFiles: string[];
  provenance: FailureCase["source"] & { title: string; verification: { brokenSha: string; fixedSha: string } };
};

export type ContextResult = { files: string[]; instructions: ContextInstruction[]; skippedCaseIds: string[] };

export type LearningCaseSummary = {
  id: string;
  title: string;
  source: FailureCase["source"];
  ruleCount: number;
  status: "candidate" | "verified" | "invalid" | "stale";
};
