import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, Element } from "hast";

const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/]],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "tabIndex"],
  },
};

/**
 * Shift every heading one level deeper so that a release body's `##` becomes
 * an `<h3>` instead of an `<h2>`. The page that consumes this output uses
 * `<h1>` for the page title and `<h2>` for each release title, so without the
 * shift the body headings collide with the release title level and axe flags
 * a heading-order violation.
 */
function rehypeDemoteHeadings() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      if ("tagName" in node && /^h[1-5]$/.test(node.tagName)) {
        const depth = Number(node.tagName.slice(1));
        node.tagName = `h${depth + 1}`;
      }
      for (const child of node.children as Element[]) {
        if (child && typeof child === "object" && "children" in child) walk(child);
      }
    };
    walk(tree);
  };
}

/**
 * Long fenced code blocks scroll horizontally on narrow viewports. Give each
 * `<pre>` `tabindex="0"` so keyboard-only users can reach and scroll them
 * (axe rule: `scrollable-region-focusable`). No `role="region"` + aria-label:
 * that upgrades each pre to a landmark, and multiple landmarks with the same
 * name trip `landmark-unique`.
 */
function rehypeAccessiblePre() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      if ("tagName" in node && node.tagName === "pre") {
        node.properties = {
          ...(node.properties ?? {}),
          tabIndex: 0,
        };
      }
      for (const child of node.children as Element[]) {
        if (child && typeof child === "object" && "children" in child) walk(child);
      }
    };
    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeDemoteHeadings)
  .use(rehypeAccessiblePre)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify);

/**
 * Render a Markdown string (e.g. a GitHub release body) to sanitized HTML.
 * GFM extensions enabled for fenced code blocks, tables, strikethrough, and
 * task lists. Output is sanitized against rehype-sanitize's default schema
 * with a narrow allowlist extension for `language-*` code classes.
 */
export async function renderMarkdown(source: string): Promise<string> {
  if (!source.trim()) return "";
  const file = await processor.process(source);
  return String(file);
}
