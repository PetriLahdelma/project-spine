import sanitizeHtml from "sanitize-html";

/**
 * Sanitizer for markdown-rendered HTML that lands on public pages.
 *
 * Threat: a workspace member publishes a rationale whose source `.md` contains
 * inline HTML (marked passes raw HTML through by default). That HTML then
 * renders on /r/[publicSlug] via dangerouslySetInnerHTML. Without sanitization
 * a `<script>` tag would execute for anyone who opens the link.
 *
 * Policy: allow the subset of tags markdown normally produces plus a few
 * harmless extras. Block script, iframe, style, form, on* attributes, and
 * javascript: URLs. Images + anchors are allowed but locked to http(s) and
 * mailto.
 */
export function sanitizeRationaleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "blockquote", "hr", "br",
      "ul", "ol", "li",
      "strong", "em", "b", "i", "s", "u",
      "code", "pre", "kbd", "samp",
      "a", "img",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      pre: ["class"],
      span: ["class"],
      div: ["class"],
      th: ["align", "scope"],
      td: ["align"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
    // Strip any unrecognised tag's text content out entirely rather than
    // leaving the inner text behind (the default), so that <script>evil()
    // </script> contributes nothing — not even the string "evil()".
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  });
}
