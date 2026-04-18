import { z } from "zod";
import { ProjectType } from "../model/spine.js";

export const TemplateManifest = z.object({
  schemaVersion: z.literal(1),
  name: z.string().regex(/^[a-z][a-z0-9-]*$/, "lowercase-kebab"),
  title: z.string(),
  description: z.string(),
  projectType: ProjectType,
  contributes: z
    .object({
      routes: z.array(z.string()).default([]),
      components: z.array(z.string()).default([]),
      qa: z.array(z.string()).default([]),
      uxRules: z.array(z.string()).default([]),
      a11yRules: z.array(z.string()).default([]),
      agentDos: z.array(z.string()).default([]),
      agentDonts: z.array(z.string()).default([]),
      unsafeActions: z.array(z.string()).default([]),
    })
    .default({
      routes: [],
      components: [],
      qa: [],
      uxRules: [],
      a11yRules: [],
      agentDos: [],
      agentDonts: [],
      unsafeActions: [],
    }),
});
export type TemplateManifest = z.infer<typeof TemplateManifest>;

export type ResolvedTemplate = {
  manifest: TemplateManifest;
  dir: string;
  briefPath: string;
  designPath: string | null;
};
