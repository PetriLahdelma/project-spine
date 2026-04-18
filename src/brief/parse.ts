import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import { parse as parseYaml } from "yaml";
import type { Root, RootContent, Heading, List, Paragraph, PhrasingContent } from "mdast";
import { NormalizedBrief, CANONICAL_SECTIONS, type CanonicalSection } from "../model/brief.js";
import { matchSection } from "./sections.js";
import { classifyProjectType } from "./classify.js";

export async function parseBriefFromFile(path: string): Promise<NormalizedBrief> {
  const content = await readFile(path, "utf8");
  return parseBrief(content, basename(path));
}

export function parseBrief(content: string, source = "brief.md"): NormalizedBrief {
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]);
  const tree = processor.parse(content) as Root;

  const frontmatter = extractFrontmatter(tree);
  const name = typeof frontmatter["name"] === "string" ? frontmatter["name"] : null;

  const sections: NormalizedBrief["sections"] = {
    goals: [],
    nonGoals: [],
    audience: [],
    constraints: [],
    assumptions: [],
    risks: [],
    successCriteria: [],
  };
  const unknownSections: NormalizedBrief["unknownSections"] = [];

  const topLevelHeadings = collectSectionHeadings(tree);
  for (const block of topLevelHeadings) {
    const items = flattenItems(block.body, source, block.index);
    if (block.canonical) {
      sections[block.canonical].push(...items);
    } else {
      unknownSections.push({
        heading: block.headingText,
        items: items.map((i) => i.text),
      });
    }
  }

  const corpus = stringifyAst(tree);
  const classification = classifyProjectType(frontmatter, corpus);

  const warnings: NormalizedBrief["warnings"] = [];
  const missing: CanonicalSection[] = CANONICAL_SECTIONS.filter(
    (s) => s !== "nonGoals" && sections[s].length === 0
  );
  if (missing.length > 0) {
    warnings.push({
      id: "missing-sections",
      severity: "warn",
      message: `Brief is missing items under: ${missing.join(", ")}. Add at least one bullet per section for high-quality output.`,
      suggestion: `Open \`brief.md\` and add at least one bullet under each of: ${missing
        .map((s) => s === "nonGoals" ? "Non-goals" : humanSection(s))
        .join(", ")}. Recompile.`,
    });
  }
  if (classification.confidence < 0.5) {
    warnings.push({
      id: "project-type-uncertain",
      severity: "warn",
      message: `Project type inferred as "${classification.value}" with confidence ${classification.confidence}. Set \`projectType\` in frontmatter to remove ambiguity.`,
      suggestion:
        'Add `projectType: "saas-marketing" | "app-dashboard" | "design-system" | "docs-portal" | "extension" | "other"` to the YAML frontmatter of brief.md.',
    });
  }
  if (unknownSections.length > 0) {
    warnings.push({
      id: "unknown-sections",
      severity: "info",
      message: `Unrecognized top-level sections (skipped): ${unknownSections.map((s) => s.heading).join(", ")}`,
      suggestion:
        "Rename each to one of: Goals, Non-goals, Audience, Constraints, Assumptions, Risks, Success criteria — or move the content into an existing section.",
    });
  }

  const result: NormalizedBrief = {
    schemaVersion: 1,
    parsedAt: new Date().toISOString(),
    frontmatter,
    name,
    projectType: classification.value,
    projectTypeConfidence: classification.confidence,
    projectTypeEvidence: classification.evidence,
    sections,
    unknownSections,
    warnings,
  };
  return NormalizedBrief.parse(result);
}

function extractFrontmatter(tree: Root): Record<string, unknown> {
  const first = tree.children[0];
  if (first && first.type === "yaml") {
    try {
      const parsed = parseYaml(first.value);
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

type SectionBlock = {
  canonical: CanonicalSection | null;
  headingText: string;
  body: RootContent[];
  index: number;
};

function collectSectionHeadings(tree: Root): SectionBlock[] {
  const out: SectionBlock[] = [];
  const children = tree.children;
  // find the highest section depth (min of depth 2 headings after the title if any)
  // simple rule: consider headings of depth 2 as section headers, consistent with the template
  const sectionDepth = 2;

  let current: SectionBlock | null = null;
  let i = 0;
  for (const node of children) {
    if (node.type === "heading" && (node as Heading).depth === sectionDepth) {
      if (current) out.push(current);
      const text = headingText(node as Heading);
      current = {
        canonical: matchSection(text),
        headingText: text,
        body: [],
        index: i++,
      };
    } else if (current) {
      current.body.push(node);
    }
  }
  if (current) out.push(current);
  return out;
}

function headingText(node: Heading): string {
  return (node.children as PhrasingContent[]).map(phraseToText).join("").trim();
}

function phraseToText(node: PhrasingContent): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) {
    return (node.children as PhrasingContent[]).map(phraseToText).join("");
  }
  return "";
}

function flattenItems(
  body: RootContent[],
  source: string,
  sectionIndex: number
): { text: string; source: { kind: "brief"; pointer: string } }[] {
  const items: { text: string; source: { kind: "brief"; pointer: string } }[] = [];
  let itemIdx = 0;
  for (const node of body) {
    if (node.type === "list") {
      for (const li of (node as List).children) {
        const text = extractListItemText(li.children as RootContent[]).trim();
        if (text.length === 0) continue;
        items.push({
          text,
          source: { kind: "brief", pointer: `${source}#section${sectionIndex}/item${itemIdx++}` },
        });
      }
    } else if (node.type === "paragraph") {
      const text = paragraphText(node as Paragraph).trim();
      if (text.length > 0) {
        items.push({
          text,
          source: { kind: "brief", pointer: `${source}#section${sectionIndex}/para${itemIdx++}` },
        });
      }
    }
  }
  return items;
}

function extractListItemText(children: RootContent[]): string {
  return children
    .map((c) => {
      if (c.type === "paragraph") return paragraphText(c as Paragraph);
      if (c.type === "list") return (c as List).children.map((li) => extractListItemText(li.children as RootContent[])).join("; ");
      return "";
    })
    .join(" ")
    .trim();
}

function paragraphText(p: Paragraph): string {
  return (p.children as PhrasingContent[]).map(phraseToText).join("");
}

function stringifyAst(tree: Root): string {
  const out: string[] = [];
  walk(tree as unknown as { children?: RootContent[] }, out);
  return out.join(" ");
}

function walk(node: { children?: RootContent[] | PhrasingContent[]; value?: string }, out: string[]): void {
  if (typeof node.value === "string") out.push(node.value);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child as { children?: RootContent[]; value?: string }, out);
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function humanSection(key: string): string {
  switch (key) {
    case "successCriteria":
      return "Success criteria";
    case "nonGoals":
      return "Non-goals";
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
}
