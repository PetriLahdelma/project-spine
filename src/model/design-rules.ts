import { z } from "zod";

const Source = z.object({
  kind: z.literal("design"),
  pointer: z.string(),
});

const DesignItem = z.object({
  text: z.string(),
  source: Source,
});
export type DesignItem = z.infer<typeof DesignItem>;

export const DesignRules = z.object({
  schemaVersion: z.literal(1),
  parsedAt: z.string(),
  frontmatter: z.record(z.string(), z.unknown()),
  sections: z.object({
    tokens: z.array(DesignItem),
    components: z.array(DesignItem),
    ux: z.array(DesignItem),
    accessibility: z.array(DesignItem),
    other: z.array(DesignItem),
  }),
  warnings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["info", "warn", "error"]),
      message: z.string(),
      suggestion: z.string().optional(),
    })
  ),
});
export type DesignRules = z.infer<typeof DesignRules>;
