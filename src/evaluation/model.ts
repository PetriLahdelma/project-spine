import { z } from "zod";

const CommandSchema = z.object({
  command: z.string().trim().min(1).max(1_024),
  args: z.array(z.string().max(16_000)).max(100),
}).strict();

export const EvaluationAdapterSchema = z.object({
  version: z.literal(1),
  agent: CommandSchema,
  verify: CommandSchema,
  timeoutMs: z.number().int().min(100).max(120_000),
  expectedFailureCodes: z.array(z.number().int().min(1).max(255))
    .min(1)
    .max(16)
    .default([1])
    .describe("Normal verifier exit codes that prove the broken control fails; defaults to [1]."),
  allowedEnv: z.array(
    z.string()
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
      .max(128)
      .refine(
        (name) => !["SPINE_CONTEXT_FILE", "SPINE_REPO_DIR", "SPINE_TASK"].includes(name),
        "Project Spine controls this environment variable",
      ),
  ).max(32).optional(),
}).strict();

export type EvaluationAdapter = z.infer<typeof EvaluationAdapterSchema>;

export type ProcessObservation = {
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  durationMs: number;
  stdoutBytes: number;
  stderrBytes: number;
  succeeded: boolean;
};

export type EvaluationAttempt = {
  agent: ProcessObservation;
  verification: ProcessObservation;
  succeeded: boolean;
};

export type PairedEvaluationRun = {
  run: number;
  baseline: EvaluationAttempt;
  guarded: EvaluationAttempt;
};

export type CaseEvaluationReport = {
  version: 1;
  kind: "agent-replay-evaluation";
  caseId: string;
  adapterPath: string;
  adapterHash: string;
  runs: number;
  revisions: {
    brokenSha: string;
    fixedSha: string;
  };
  brokenControl: ProcessObservation;
  fixedControl: ProcessObservation;
  baselineSuccesses: number;
  guardedSuccesses: number;
  results: PairedEvaluationRun[];
  evaluatedAt: string;
  limitations: string[];
};
