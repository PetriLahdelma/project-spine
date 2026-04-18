import type { ProjectType } from "../model/spine.js";

type Signal = {
  type: Exclude<ProjectType, "other">;
  keywords: string[];
};

const signals: Signal[] = [
  {
    type: "saas-marketing",
    keywords: ["marketing site", "landing page", "product site", "pricing page", "trial signups", "waitlist"],
  },
  {
    type: "app-dashboard",
    keywords: ["dashboard", "admin panel", "internal tool", "multi-tenant", "user accounts", "auth", "data-heavy"],
  },
  {
    type: "design-system",
    keywords: ["design system", "component library", "storybook", "tokens", "primitives", "foundations"],
  },
  {
    type: "docs-portal",
    keywords: ["docs portal", "documentation site", "api reference", "developer docs", "handbook"],
  },
  {
    type: "extension",
    keywords: ["browser extension", "chrome extension", "vs code extension", "figma plugin"],
  },
];

export function classifyProjectType(
  frontmatter: Record<string, unknown>,
  corpus: string
): { value: ProjectType; confidence: number; evidence: string[] } {
  const evidence: string[] = [];
  const fromFm = frontmatter["projectType"] ?? frontmatter["projectTtype"] ?? frontmatter["project_type"];
  if (typeof fromFm === "string") {
    const normalized = fromFm.trim().toLowerCase() as ProjectType;
    if (["saas-marketing", "app-dashboard", "design-system", "docs-portal", "extension", "other"].includes(normalized)) {
      return {
        value: normalized,
        confidence: 1,
        evidence: [`frontmatter.projectType = ${normalized}`],
      };
    }
    evidence.push(`frontmatter.projectType = "${fromFm}" is not a recognized value`);
  }

  const haystack = corpus.toLowerCase();
  const hits: { type: Exclude<ProjectType, "other">; matches: string[] }[] = [];
  for (const s of signals) {
    const matches = s.keywords.filter((k) => haystack.includes(k));
    if (matches.length > 0) hits.push({ type: s.type, matches });
  }
  if (hits.length === 0) {
    return { value: "other", confidence: 0, evidence: [...evidence, "no keyword signals matched"] };
  }
  hits.sort((a, b) => b.matches.length - a.matches.length);
  const winner = hits[0]!;
  const confidence = Math.min(1, 0.4 + 0.2 * winner.matches.length);
  return {
    value: winner.type,
    confidence,
    evidence: [...evidence, `matched keywords for ${winner.type}: ${winner.matches.join(", ")}`],
  };
}
