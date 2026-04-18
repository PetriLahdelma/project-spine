# Design tokens input (`--tokens`)

Project Spine's `compile` command accepts a design tokens JSON file so exports
(`AGENTS.md`, `component-plan.md`, `qa-guardrails.md`, etc.) reflect the
project's brand palette, spacing scale, and typography.

```bash
spine compile --brief ./brief.md --repo . --tokens ./tokens.json
```

Tokens are merged with any `--design` Markdown you also pass. Both are fed into
the same `DesignRules` pipeline, so every downstream exporter that reads
`sections.tokens` picks them up automatically.

## Supported formats

| Format | Detection | Example |
|---|---|---|
| **DTCG** (W3C Design Tokens Community Group) | keys prefixed with `$value`/`$type` | `{ "color": { "primary": { "$value": "#6366f1", "$type": "color" } } }` |
| **Tokens Studio** (Figma plugin) | keys `value`/`type` with no `$` prefix | `{ "colors": { "brand": { "value": "#6366f1", "type": "color" } } }` |

Format is auto-detected from the document. Mixed formats default to DTCG.

## Features

- **Nested groups flatten to dotted paths.** `{ color: { button: { bg: ... } } }` becomes `color.button.bg`.
- **Aliases resolve.** `"$value": "{color.primary}"` resolves to the referenced token's value (recursively, up to 10 hops).
- **Types are inferred when missing.** Path names and value patterns detect `color`, `dimension`, `fontFamily`, `fontWeight`, `shadow`.
- **Source pointers** are written back into `spine.json` as `design:tokens.json#color/primary` so every rule is traceable.

## Drift detection

Tokens are tracked separately from `--design` files in the export manifest.
When you re-export from Figma and the JSON changes:

```bash
spine drift check
# drift detected — 2 item(s):
#   [input:tokens] tokens.json — design tokens file changed since last compile.
#   [spine:hash]   — spine hash changed (...). Run `spine compile` to refresh exports.
```

Run `spine compile` with the same flags to regenerate all exports from the
updated tokens.

## Example tokens.json

```json
{
  "color": {
    "primary": { "$value": "#6366f1", "$type": "color", "$description": "brand primary" },
    "accent":  { "$value": "#22d3ee", "$type": "color" },
    "button":  { "bg": { "$value": "{color.primary}", "$type": "color" } }
  },
  "space": {
    "xs": { "$value": "4px",  "$type": "dimension" },
    "sm": { "$value": "8px",  "$type": "dimension" },
    "md": { "$value": "16px", "$type": "dimension" }
  }
}
```

Compiled output in `AGENTS.md` gets a `## Design tokens` block:

```
- color.primary (color): #6366f1 — brand primary
- color.accent (color): #22d3ee
- color.button.bg (color): #6366f1
- space.xs (dimension): 4px
- space.sm (dimension): 8px
- space.md (dimension): 16px
```

and every token appears in `spine.json` as a `kind: "design"` rule with a
`source.pointer` back to its path in the original JSON.
