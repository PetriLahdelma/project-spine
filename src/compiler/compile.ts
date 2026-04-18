import type { NormalizedBrief, BriefItem } from "../model/brief.js";
import type { RepoProfile } from "../model/repo-profile.js";
import type { DesignRules, DesignItem } from "../model/design-rules.js";
import { SpineModel, type Rule, type Warning as SpineWarning } from "../model/spine.js";
import type { TemplateManifest } from "../templates/model.js";
import { computeInputHash, shortId } from "./hash.js";

export type CompileInput = {
  brief: NormalizedBrief;
  repo: RepoProfile;
  design: DesignRules | null;
  template?: TemplateManifest | null;
  projectName?: string;
  projectVersion?: string;
  now?: () => string;
};

export function compileSpine(input: CompileInput): SpineModel {
  const { brief, repo, design } = input;
  const name = input.projectName ?? brief.name ?? derivePackageName(repo) ?? "unnamed-project";
  const version = input.projectVersion ?? "0.1.0";
  const now = input.now ?? (() => new Date().toISOString());

  const goals = briefItemsToRules(brief.sections.goals, "goal");
  const nonGoals = briefItemsToRules(brief.sections.nonGoals, "nongoal");
  const audience = briefItemsToRules(brief.sections.audience, "aud");
  const constraints = briefItemsToRules(brief.sections.constraints, "con");
  const assumptions = briefItemsToRules(brief.sections.assumptions, "asm");
  const risks = briefItemsToRules(brief.sections.risks, "risk");

  const template = input.template ?? null;

  const repoConventions = buildRepoConventions(repo);
  const designRules = buildDesignRules(design);
  const uxRules = mergeTemplate(buildUxRules(brief, design), template?.contributes.uxRules, template?.name, "ux-tpl");
  const a11yRules = mergeTemplate(buildA11yRules(brief), template?.contributes.a11yRules, template?.name, "a11y-tpl");
  const componentGuidance = mergeTemplate(
    buildComponentGuidance(repo, design),
    template?.contributes.components,
    template?.name,
    "cmp-tpl"
  );
  const qaGuardrails = mergeTemplate(buildQaGuardrails(repo, brief), template?.contributes.qa, template?.name, "qa-tpl");
  const agentInstructions = buildAgentInstructions(repo, brief, template);
  const scaffoldPlan = buildScaffoldPlan(brief, repo, template);

  const warnings: SpineWarning[] = [];
  for (const w of brief.warnings) {
    warnings.push({
      id: `brief:${w.id}`,
      severity: w.severity,
      message: w.message,
      sources: [{ kind: "brief", pointer: "brief.md" }],
    });
  }
  for (const w of repo.warnings) {
    warnings.push({
      id: `repo:${w.id}`,
      severity: w.severity,
      message: w.message,
      sources: [{ kind: "repo", pointer: "repo-profile" }],
    });
  }
  if (design) {
    for (const w of design.warnings) {
      warnings.push({
        id: `design:${w.id}`,
        severity: w.severity,
        message: w.message,
        sources: [{ kind: "design", pointer: "design-rules.md" }],
      });
    }
  }

  const conflicts = detectConflicts(brief, repo);
  warnings.push(...conflicts);

  if (template && template.projectType !== brief.projectType) {
    warnings.push({
      id: "conflict:template-project-type",
      severity: "warn",
      message: `Template "${template.name}" targets projectType "${template.projectType}" but brief declares "${brief.projectType}". Using the brief's value; template contributions still applied.`,
      sources: [
        { kind: "template", pointer: `template:${template.name}` },
        { kind: "brief", pointer: "brief.md#frontmatter.projectType" },
      ],
    });
  }

  const hash = computeInputHash(brief, repo, design, template);
  const model: SpineModel = {
    metadata: {
      name,
      version,
      schemaVersion: 1,
      createdAt: now(),
      hash,
    },
    projectType: brief.projectType,
    goals,
    nonGoals,
    audience,
    constraints,
    assumptions,
    risks,
    stack: buildStack(repo),
    repoConventions,
    designRules,
    uxRules,
    a11yRules,
    componentGuidance,
    qaGuardrails,
    agentInstructions,
    scaffoldPlan,
    warnings,
  };
  return SpineModel.parse(model);
}

function briefItemsToRules(items: BriefItem[], prefix: string): Rule[] {
  return items.map((item, i) => ({
    id: shortId(prefix, [item.source.pointer, String(i), item.text]),
    text: item.text,
    source: item.source,
  }));
}

function designItemsToRules(items: DesignItem[], prefix: string): Rule[] {
  return items.map((item, i) => ({
    id: shortId(prefix, [item.source.pointer, String(i), item.text]),
    text: item.text,
    source: item.source,
  }));
}

function inferredRule(prefix: string, parts: string[], text: string): Rule {
  return {
    id: shortId(prefix, [text, ...parts]),
    text,
    source: { kind: "inference", pointer: `inferred:${parts.join("/")}` },
  };
}

function derivePackageName(repo: RepoProfile): string | null {
  const pkg = repo.rawPackageJson;
  if (pkg && typeof pkg["name"] === "string") return pkg["name"];
  return null;
}

function buildStack(repo: RepoProfile): SpineModel["stack"] {
  return {
    framework: repo.framework.value,
    language: repo.language.typescript ? "typescript" : "javascript",
    packageManager: repo.packageManager.value,
    runtime: "node",
    styling: repo.styling.value,
    testing: repo.testing.runners,
    detected: {
      routing: repo.routing.value,
      tsStrict: repo.language.strict,
      storybook: repo.testing.storybook,
      ci: { githubActions: repo.ci.githubActions, workflows: repo.ci.workflows.length },
    },
  };
}

function buildRepoConventions(repo: RepoProfile): Rule[] {
  const rules: Rule[] = [];
  if (repo.framework.value === "next") {
    if (repo.routing.value === "next-app-router") {
      rules.push(inferredRule("conv", ["next", "app-router"], "Use the Next.js App Router (`app/`). Prefer server components by default; only opt into client components via `\"use client\"` when needed."));
    } else if (repo.routing.value === "next-pages-router") {
      rules.push(inferredRule("conv", ["next", "pages-router"], "Use the Next.js Pages Router (`pages/`). Do not introduce `app/` without explicit migration."));
    }
  }
  if (repo.styling.value === "tailwind") {
    rules.push(inferredRule("conv", ["tailwind"], "Style exclusively with Tailwind utility classes. Do not add inline `style` props or ad-hoc CSS unless the component is outside the design system."));
  }
  if (repo.language.typescript) {
    const strictness = repo.language.strict ? "strict" : "non-strict";
    rules.push(
      inferredRule(
        "conv",
        ["typescript", strictness],
        repo.language.strict
          ? "TypeScript strict mode is on. Never use `any`; prefer `unknown` + narrow at the boundary."
          : "TypeScript is enabled but strict is off. Avoid adding `any`; treat `unknown` as the default escape hatch."
      )
    );
  }
  if (repo.packageManager.value !== "unknown") {
    rules.push(
      inferredRule(
        "conv",
        ["pm", repo.packageManager.value],
        `Use \`${repo.packageManager.value}\` for all dependency operations. Do not commit lockfiles from other package managers.`
      )
    );
  }
  return rules;
}

function buildDesignRules(design: DesignRules | null): Rule[] {
  if (!design) return [];
  return [
    ...designItemsToRules(design.sections.tokens, "dtok"),
    ...designItemsToRules(design.sections.components, "dcmp"),
    ...designItemsToRules(design.sections.ux, "dux"),
    ...designItemsToRules(design.sections.accessibility, "da11y"),
    ...designItemsToRules(design.sections.other, "dother"),
  ];
}

function buildUxRules(brief: NormalizedBrief, design: DesignRules | null): Rule[] {
  const rules: Rule[] = [];
  for (const u of design?.sections.ux ?? []) {
    rules.push({
      id: shortId("ux", [u.source.pointer, u.text]),
      text: u.text,
      source: u.source,
    });
  }
  if (brief.projectType === "saas-marketing") {
    rules.push(inferredRule("ux", ["saas-marketing"], "Every page has a primary CTA above the fold; secondary CTAs never compete in weight."));
    rules.push(inferredRule("ux", ["saas-marketing", "states"], "Every interactive element exposes hover, focus-visible, active, and disabled states."));
  }
  if (brief.projectType === "app-dashboard") {
    rules.push(inferredRule("ux", ["dashboard", "states"], "Every data surface has explicit loading, empty, error, and partial states."));
  }
  return rules;
}

function buildA11yRules(brief: NormalizedBrief): Rule[] {
  const rules: Rule[] = [
    inferredRule("a11y", ["keyboard"], "All interactive elements must be reachable and operable with the keyboard alone."),
    inferredRule("a11y", ["focus"], "Focus must be visible at all times; never remove outlines without replacing them."),
    inferredRule("a11y", ["contrast"], "Text contrast must meet WCAG AA (4.5:1 for body, 3:1 for large text)."),
    inferredRule("a11y", ["labels"], "Every form control has a programmatic label."),
    inferredRule("a11y", ["landmarks"], "Pages use proper landmark regions (header, main, nav, footer) and a sensible heading order."),
    inferredRule("a11y", ["motion"], "Respect `prefers-reduced-motion` for any non-essential animation."),
  ];
  if (brief.sections.successCriteria.some((s) => /a11y|accessib|lighthouse|wcag/i.test(s.text))) {
    rules.push(inferredRule("a11y", ["brief"], "Brief success criteria reference accessibility — verify with automated (axe) and manual keyboard testing before shipping."));
  }
  return rules;
}

function buildComponentGuidance(repo: RepoProfile, design: DesignRules | null): Rule[] {
  const rules: Rule[] = [];
  if (design) {
    for (const c of design.sections.components) {
      rules.push({
        id: shortId("cmp", [c.source.pointer, c.text]),
        text: c.text,
        source: c.source,
      });
    }
  }
  if (repo.styling.value === "tailwind" && design?.sections.tokens.length) {
    rules.push(inferredRule("cmp", ["tokens-first"], "Never hardcode color, radius, or spacing values. Reference design tokens via Tailwind config or CSS variables only."));
  }
  if (repo.testing.storybook) {
    rules.push(inferredRule("cmp", ["storybook"], "Every shared UI component must have at least one Storybook story covering default and loading/error states where applicable."));
  }
  return rules;
}

function buildQaGuardrails(repo: RepoProfile, brief: NormalizedBrief): Rule[] {
  const rules: Rule[] = [];
  if (repo.testing.runners.includes("vitest")) {
    rules.push(inferredRule("qa", ["vitest"], "Unit tests live next to source as `*.test.ts`. Run `vitest run` in CI and before every commit touching business logic."));
  }
  if (repo.testing.runners.includes("jest")) {
    rules.push(inferredRule("qa", ["jest"], "Unit tests live as `*.test.ts(x)`. Run `jest` in CI before merge."));
  }
  if (repo.testing.runners.includes("playwright")) {
    rules.push(inferredRule("qa", ["playwright"], "End-to-end tests live under `tests/e2e/`. A Playwright run must pass before release."));
  }
  if (repo.linting.eslint || repo.linting.biome || repo.linting.oxlint) {
    rules.push(inferredRule("qa", ["lint"], "Lint must pass with zero warnings on changed files."));
  }
  if (repo.language.typescript) {
    rules.push(inferredRule("qa", ["typecheck"], "`tsc --noEmit` must pass on every PR."));
  }
  for (const s of brief.sections.successCriteria) {
    rules.push({
      id: shortId("qa-brief", [s.source.pointer, s.text]),
      text: `Success criterion to verify before launch: ${s.text}`,
      source: s.source,
    });
  }
  // minimal definition-of-done if nothing else
  if (rules.length === 0) {
    rules.push(inferredRule("qa", ["dod"], "Definition of done: code reviewed, type-checked, linted, and manually verified against the brief."));
  }
  return rules;
}

function buildAgentInstructions(
  repo: RepoProfile,
  brief: NormalizedBrief,
  template: TemplateManifest | null
): SpineModel["agentInstructions"] {
  const dos: Rule[] = [
    inferredRule("do", ["diff"], "Prefer small, focused diffs. One concern per PR or patch."),
    inferredRule("do", ["test-cmd"], "Always show the exact test or typecheck command you ran and its result."),
    inferredRule("do", ["trace"], "When following a rule from this file, cite it by section heading so reviewers can audit."),
  ];
  const donts: Rule[] = [
    inferredRule("dont", ["scope"], "Do not refactor code unrelated to the task, even if it looks better."),
    inferredRule("dont", ["deps"], "Do not add new dependencies without flagging the choice and reason."),
  ];
  if (repo.styling.value === "mixed") {
    donts.push(inferredRule("dont", ["styling-mixed"], "This repo uses multiple styling approaches. Do not introduce a new one; match the pattern already used in the file you are editing."));
  }
  const unsafe: Rule[] = [
    inferredRule("unsafe", ["generated"], "Never modify generated files (anything under `dist/`, `build/`, `.next/`, or marked `@generated`)."),
    inferredRule("unsafe", ["lockfile"], "Never edit lockfiles manually."),
    inferredRule("unsafe", ["secrets"], "Never commit secrets. Redact any `.env*` content that appears in logs or diffs."),
  ];
  const placement: Rule[] = [];
  if (repo.framework.value === "next" && repo.routing.value === "next-app-router") {
    placement.push(inferredRule("placement", ["next-app"], "Pages go in `app/`. Route segments use `page.tsx`. Shared UI goes in `components/` or `src/components/`."));
  }
  if (repo.framework.value === "next" && repo.routing.value === "next-pages-router") {
    placement.push(inferredRule("placement", ["next-pages"], "Pages go in `pages/`. API handlers go in `pages/api/`. Shared UI goes in `components/`."));
  }
  if (repo.testing.storybook) {
    placement.push(inferredRule("placement", ["stories"], "Stories live next to components as `*.stories.tsx`."));
  }
  const response: Rule[] = [
    inferredRule("resp", ["verify"], "Before claiming work is complete, run the repo's typecheck and test commands and show the output."),
    inferredRule("resp", ["ask"], "If the brief is ambiguous on a specific section, ask rather than guess. Cite the section heading."),
  ];
  if (brief.warnings.length > 0) {
    response.push(
      inferredRule(
        "resp",
        ["warnings"],
        `The compiled brief has ${brief.warnings.length} warning${brief.warnings.length === 1 ? "" : "s"} — review \`warnings.json\` before starting a new capability.`
      )
    );
  }

  let allDos = [...dos, ...donts];
  let allUnsafe = [...unsafe];
  if (template) {
    allDos = [
      ...allDos,
      ...templateToRules(template.contributes.agentDos, template.name, "do-tpl"),
      ...templateToRules(template.contributes.agentDonts, template.name, "dont-tpl"),
    ];
    allUnsafe = [...allUnsafe, ...templateToRules(template.contributes.unsafeActions, template.name, "unsafe-tpl")];
  }
  return { dosAndDonts: allDos, unsafeActions: allUnsafe, filePlacement: placement, responseExpectations: response };
}

function buildScaffoldPlan(
  brief: NormalizedBrief,
  repo: RepoProfile,
  template: TemplateManifest | null
): SpineModel["scaffoldPlan"] {
  const routes: Rule[] = [];
  const components: Rule[] = [];
  const sprint1: Rule[] = [];

  if (template && template.contributes.routes.length > 0) {
    routes.push(...templateToRules(template.contributes.routes, template.name, "route-tpl"));
  } else {
    if (brief.projectType === "saas-marketing") {
      routes.push(inferredRule("route", ["saas-home"], "/ — Home: hero, social proof, primary CTA."));
      routes.push(inferredRule("route", ["saas-product"], "/product — Core product overview."));
      routes.push(inferredRule("route", ["saas-pricing"], "/pricing — Plans and pricing."));
      routes.push(inferredRule("route", ["saas-security"], "/security — Security and compliance overview."));
    }
    if (brief.projectType === "app-dashboard") {
      routes.push(inferredRule("route", ["dash-login"], "/login — Auth entry."));
      routes.push(inferredRule("route", ["dash-home"], "/app — Dashboard home with default view."));
      routes.push(inferredRule("route", ["dash-settings"], "/app/settings — User/workspace settings."));
    }
    if (brief.projectType === "docs-portal") {
      routes.push(inferredRule("route", ["docs-home"], "/ — Landing with quick-start and search."));
      routes.push(inferredRule("route", ["docs-api"], "/api — API reference."));
    }
  }

  components.push(inferredRule("cmp-bucket", ["layout"], "Layout primitives: `AppShell`, `PageHeader`, `Section`, `Stack`."));
  components.push(inferredRule("cmp-bucket", ["primitives"], "UI primitives: `Button`, `Input`, `Field`, `Dialog`, `Toast`."));
  components.push(inferredRule("cmp-bucket", ["features"], "Feature components live co-located with the route or feature folder that owns them."));

  let i = 0;
  for (const goal of brief.sections.goals.slice(0, 5)) {
    sprint1.push({
      id: shortId("s1", [goal.source.pointer, goal.text, String(i++)]),
      text: `Deliver: ${goal.text}`,
      source: goal.source,
    });
  }
  if (sprint1.length === 0) {
    sprint1.push(inferredRule("s1", ["seed"], "Seed: scaffold the initial route and header; land an empty-state page for the primary surface."));
  }
  if (!repo.agentFiles.agentsMd && !repo.agentFiles.claudeMd && !repo.agentFiles.copilotInstructions) {
    sprint1.push(
      inferredRule("s1", ["agent-files"], "Commit the Project Spine–generated `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` after review.")
    );
  }
  return { routes, components, sprint1 };
}

function detectConflicts(brief: NormalizedBrief, repo: RepoProfile): SpineWarning[] {
  const out: SpineWarning[] = [];
  const briefText = sectionCorpus(brief).toLowerCase();
  if (/multi-?tenant/.test(briefText) && repo.framework.value !== "unknown") {
    const hasAuth = /next-auth|clerk|auth0|supabase\/auth|better-auth/.test(JSON.stringify(repo.rawPackageJson ?? {}));
    if (!hasAuth) {
      out.push({
        id: "conflict:multitenant-no-auth",
        severity: "warn",
        message:
          "Brief mentions multi-tenancy but no auth provider detected in package.json. Agents will need guidance on how auth is meant to be wired.",
        sources: [
          { kind: "brief", pointer: "brief#constraints-or-goals" },
          { kind: "repo", pointer: "package.json" },
        ],
      });
    }
  }
  if (brief.projectType === "saas-marketing" && repo.framework.value === "unknown") {
    out.push({
      id: "conflict:marketing-unknown-framework",
      severity: "info",
      message: "Brief implies a marketing site, but no framework was detected. Expect scaffold plan to suggest a setup choice.",
      sources: [{ kind: "brief", pointer: "brief" }, { kind: "repo", pointer: "repo-profile" }],
    });
  }
  return out;
}

function sectionCorpus(brief: NormalizedBrief): string {
  const parts: string[] = [];
  for (const key of Object.keys(brief.sections) as Array<keyof NormalizedBrief["sections"]>) {
    for (const item of brief.sections[key]) parts.push(item.text);
  }
  return parts.join(" ");
}

function templateToRules(items: string[], templateName: string, prefix: string): Rule[] {
  return items.map((text, i) => ({
    id: shortId(prefix, [templateName, String(i), text]),
    text,
    source: { kind: "template", pointer: `template:${templateName}/contributes#${i}` },
  }));
}

function mergeTemplate(
  base: Rule[],
  extras: string[] | undefined,
  templateName: string | undefined,
  prefix: string
): Rule[] {
  if (!extras || extras.length === 0 || !templateName) return base;
  return [...base, ...templateToRules(extras, templateName, prefix)];
}
