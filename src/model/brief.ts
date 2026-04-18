import { z } from "zod";
import { ProjectType } from "./spine.js";

const Source = z.object({
  kind: z.literal("brief"),
  pointer: z.string(),
});

const BriefItem = z.object({
  text: z.string(),
  source: Source,
});
export type BriefItem = z.infer<typeof BriefItem>;

export const NormalizedBrief = z.object({
  schemaVersion: z.literal(1),
  parsedAt: z.string(),
  frontmatter: z.record(z.unknown()),
  name: z.string().nullable(),
  projectType: ProjectType,
  projectTypeConfidence: z.number().min(0).max(1),
  projectTypeEvidence: z.array(z.string()),
  sections: z.object({
    goals: z.array(BriefItem),
    nonGoals: z.array(BriefItem),
    audience: z.array(BriefItem),
    constraints: z.array(BriefItem),
    assumptions: z.array(BriefItem),
    risks: z.array(BriefItem),
    successCriteria: z.array(BriefItem),
  }),
  unknownSections: z.array(
    z.object({ heading: z.string(), items: z.array(z.string()) })
  ),
  warnings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["info", "warn", "error"]),
      message: z.string(),
    })
  ),
});
export type NormalizedBrief = z.infer<typeof NormalizedBrief>;

export const CANONICAL_SECTIONS = [
  "goals",
  "nonGoals",
  "audience",
  "constraints",
  "assumptions",
  "risks",
  "successCriteria",
] as const;
export type CanonicalSection = (typeof CANONICAL_SECTIONS)[number];
