import { z } from "zod";

export const ProjectType = z.enum([
  "saas-marketing",
  "app-dashboard",
  "design-system",
  "docs-portal",
  "extension",
  "other",
]);
export type ProjectType = z.infer<typeof ProjectType>;

const Source = z.object({
  kind: z.enum(["brief", "repo", "design", "template", "inference"]),
  pointer: z.string(),
});
export type Source = z.infer<typeof Source>;

const Rule = z.object({
  id: z.string(),
  text: z.string(),
  source: Source,
  confidence: z.number().min(0).max(1).optional(),
});
export type Rule = z.infer<typeof Rule>;

const Warning = z.object({
  id: z.string(),
  severity: z.enum(["info", "warn", "error"]),
  message: z.string(),
  sources: z.array(Source),
  suggestion: z.string().optional(),
});
export type Warning = z.infer<typeof Warning>;

export const SpineModel = z.object({
  metadata: z.object({
    name: z.string(),
    version: z.string(),
    schemaVersion: z.literal(1),
    createdAt: z.string(),
    hash: z.string(),
  }),
  projectType: ProjectType,
  goals: z.array(Rule),
  nonGoals: z.array(Rule),
  audience: z.array(Rule),
  constraints: z.array(Rule),
  assumptions: z.array(Rule),
  risks: z.array(Rule),
  stack: z.object({
    framework: z.string().optional(),
    language: z.string().optional(),
    packageManager: z.string().optional(),
    runtime: z.string().optional(),
    styling: z.string().optional(),
    testing: z.array(z.string()).default([]),
    detected: z.record(z.unknown()).default({}),
  }),
  repoConventions: z.array(Rule),
  designRules: z.array(Rule),
  uxRules: z.array(Rule),
  a11yRules: z.array(Rule),
  componentGuidance: z.array(Rule),
  qaGuardrails: z.array(Rule),
  agentInstructions: z.object({
    dosAndDonts: z.array(Rule),
    unsafeActions: z.array(Rule),
    filePlacement: z.array(Rule),
    responseExpectations: z.array(Rule),
  }),
  scaffoldPlan: z.object({
    routes: z.array(Rule),
    components: z.array(Rule),
    sprint1: z.array(Rule),
  }),
  warnings: z.array(Warning),
});
export type SpineModel = z.infer<typeof SpineModel>;
