import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import { parse as parseYaml } from "yaml";
import type { Root, RootContent, Heading, List, Paragraph, PhrasingContent } from "mdast";
import { DesignRules } from "../model/design-rules.js";

type SectionKey = "tokens" | "components" | "ux" | "accessibility" | "other";

const aliases: Record<SectionKey, string[]> = {
  tokens: ["tokens", "design tokens", "colors", "typography", "spacing", "theme", "variables"],
  components: ["components", "component usage", "primitives", "patterns"],
  ux: ["ux", "ux rules", "interaction", "behavior", "motion", "states"],
  accessibility: ["accessibility", "a11y", "wcag", "keyboard", "screen reader"],
  other: [],
};

const lookup = new Map<string, SectionKey>();
for (const [key, list] of Object.entries(aliases) as Array<[SectionKey, string[]]>) {
  for (const a of list) lookup.set(normalize(a), key);
}

export async function parseDesignFromFile(path: string): Promise<DesignRules> {
  const content = await readFile(path, "utf8");
  return parseDesign(content, basename(path));
}

export function parseDesign(content: string, source = "design-rules.md"): DesignRules {
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]);
  const tree = processor.parse(content) as Root;

  const frontmatter = extractFrontmatter(tree);
  const sections: DesignRules["sections"] = {
    tokens: [],
    components: [],
    ux: [],
    accessibility: [],
    other: [],
  };

  const blocks = splitByDepth(tree, 2);
  const warnings: DesignRules["warnings"] = [];

  if (blocks.length === 0) {
    // whole-document mode: treat top-level bullets as "other"
    let idx = 0;
    for (const node of tree.children) {
      if (node.type === "list") {
        for (const li of (node as List).children) {
          const text = extractListItemText(li.children as RootContent[]).trim();
          if (text.length > 0) {
            sections.other.push({
              text,
              source: { kind: "design", pointer: `${source}#root/item${idx++}` },
            });
          }
        }
      }
    }
    if (sections.other.length === 0) {
      warnings.push({
        id: "design-empty",
        severity: "warn",
        message: "Design rules file contained no headings or bullets.",
      });
    }
  } else {
    for (const block of blocks) {
      const key = matchSection(block.headingText) ?? "other";
      const items = flattenItems(block.body, source, block.index, "design");
      sections[key].push(...items);
    }
  }

  const result: DesignRules = {
    schemaVersion: 1,
    parsedAt: new Date().toISOString(),
    frontmatter,
    sections,
    warnings,
  };
  return DesignRules.parse(result);
}

function matchSection(heading: string): SectionKey | null {
  const n = normalize(heading);
  if (lookup.has(n)) return lookup.get(n)!;
  for (const [key, canonical] of lookup) {
    if (n.includes(key) || key.includes(n)) return canonical;
  }
  return null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFrontmatter(tree: Root): Record<string, unknown> {
  const first = tree.children[0];
  if (first && first.type === "yaml") {
    try {
      const parsed = parseYaml(first.value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

type Block = { headingText: string; body: RootContent[]; index: number };

function splitByDepth(tree: Root, depth: number): Block[] {
  const out: Block[] = [];
  let current: Block | null = null;
  let i = 0;
  for (const node of tree.children) {
    if (node.type === "heading" && (node as Heading).depth === depth) {
      if (current) out.push(current);
      current = { headingText: headingText(node as Heading), body: [], index: i++ };
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
  sectionIndex: number,
  kind: "design"
): { text: string; source: { kind: "design"; pointer: string } }[] {
  const items: { text: string; source: { kind: "design"; pointer: string } }[] = [];
  let itemIdx = 0;
  for (const node of body) {
    if (node.type === "list") {
      for (const li of (node as List).children) {
        const text = extractListItemText(li.children as RootContent[]).trim();
        if (text.length > 0) {
          items.push({
            text,
            source: { kind, pointer: `${source}#section${sectionIndex}/item${itemIdx++}` },
          });
        }
      }
    } else if (node.type === "paragraph") {
      const text = paragraphText(node as Paragraph).trim();
      if (text.length > 0) {
        items.push({
          text,
          source: { kind, pointer: `${source}#section${sectionIndex}/para${itemIdx++}` },
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
