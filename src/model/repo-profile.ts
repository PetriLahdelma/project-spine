import { z } from "zod";

export const Confidence = z.number().min(0).max(1);
export type Confidence = z.infer<typeof Confidence>;

const Detection = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    value: value,
    confidence: Confidence,
    evidence: z.array(z.string()),
  });

export const PackageManager = z.enum(["npm", "pnpm", "yarn", "bun", "unknown"]);
export type PackageManager = z.infer<typeof PackageManager>;

export const Framework = z.enum([
  "next",
  "remix",
  "astro",
  "vite-react",
  "vite-vue",
  "vite-svelte",
  "sveltekit",
  "nuxt",
  "expo",
  "node-library",
  "node-app",
  "unknown",
]);
export type Framework = z.infer<typeof Framework>;

export const Routing = z.enum([
  "next-app-router",
  "next-pages-router",
  "next-hybrid",
  "remix",
  "astro",
  "sveltekit",
  "nuxt",
  "react-router",
  "file-based-other",
  "none",
  "unknown",
]);
export type Routing = z.infer<typeof Routing>;

export const Styling = z.enum([
  "tailwind",
  "css-modules",
  "vanilla-extract",
  "panda",
  "stitches",
  "styled-components",
  "emotion",
  "plain-css",
  "mixed",
  "unknown",
]);
export type Styling = z.infer<typeof Styling>;

const AgentFilePresence = z.object({
  agentsMd: z.boolean(),
  claudeMd: z.boolean(),
  copilotInstructions: z.boolean(),
  cursorRules: z.boolean(),
  projectSpineDir: z.boolean(),
});

const Monorepo = z.object({
  isMonorepo: z.boolean(),
  tool: z.enum(["npm", "yarn", "pnpm", "bun", "nx", "turbo", "unknown"]).nullable(),
  workspaces: z.array(z.string()),
  evidence: z.array(z.string()),
});
export type Monorepo = z.infer<typeof Monorepo>;

export const RepoProfile = z.object({
  schemaVersion: z.literal(1),
  root: z.string(),
  detectedAt: z.string(),
  packageManager: Detection(PackageManager),
  framework: Detection(Framework),
  routing: Detection(Routing),
  styling: Detection(Styling),
  language: z.object({
    typescript: z.boolean(),
    strict: z.boolean().nullable(),
    evidence: z.array(z.string()),
  }),
  testing: z.object({
    runners: z.array(z.enum(["vitest", "jest", "playwright", "cypress", "testing-library"])),
    storybook: z.boolean(),
    storybookVersion: z.string().nullable(),
    evidence: z.array(z.string()),
  }),
  linting: z.object({
    eslint: z.boolean(),
    biome: z.boolean(),
    prettier: z.boolean(),
    oxlint: z.boolean(),
    evidence: z.array(z.string()),
  }),
  ci: z.object({
    githubActions: z.boolean(),
    workflows: z.array(z.string()),
    other: z.array(z.string()),
    evidence: z.array(z.string()),
  }),
  agentFiles: AgentFilePresence,
  monorepo: Monorepo,
  rawPackageJson: z.record(z.unknown()).nullable(),
  warnings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["info", "warn", "error"]),
      message: z.string(),
      suggestion: z.string().optional(),
    })
  ),
});
export type RepoProfile = z.infer<typeof RepoProfile>;
