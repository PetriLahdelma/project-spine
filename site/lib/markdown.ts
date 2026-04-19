import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/]],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
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
