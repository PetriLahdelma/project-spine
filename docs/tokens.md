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

---

## Pulling from Figma Variables

If your design team edits tokens in Figma, skip the manual export step and
pull them into `.project-spine/tokens.json` directly.

Prerequisites:

1. Create a Figma personal access token: Settings → Account → *Personal access
   tokens*. Grant **File read** and **Variables read** scopes.
2. Export it:

```bash
export FIGMA_TOKEN=figd_yourTokenHere
```

Then point at a file:

```bash
# by key (take from the figma.com/design/<KEY>/... URL)
spine tokens pull --file ABC123XYZ

# or paste the full URL
spine tokens pull --url "https://www.figma.com/design/ABC123XYZ/Brand"
```

`spine tokens pull` emits a DTCG-shaped `.project-spine/tokens.json`. Feed it
back into compile:

```bash
spine compile --brief ./brief.md --repo . --tokens .project-spine/tokens.json
```

### What translates

| Figma variable type | DTCG `$type` | Value form             |
| ------------------- | ------------ | ---------------------- |
| COLOR               | `color`      | `#rrggbb` or `#rrggbbaa` (alpha appended when < 1) |
| FLOAT               | `number`     | JSON number            |
| STRING              | `string`     | JSON string            |
| BOOLEAN             | `boolean`    | `true` / `false`       |

Variable aliases (`VARIABLE_ALIAS`) emit DTCG alias syntax:
`{color.primary}` → compile resolves them the same way file-based aliases
resolve.

### Current limits

- **Default mode only.** If a collection has multiple modes (light / dark,
  brand variants), only the collection's `defaultModeId` value is written.
  Multi-mode support is follow-up work; the compiler has no theme-set
  representation yet.
- **Read-only.** Push back to Figma is out of scope for this first cut.
- **Flat by variable name.** Slashes in variable names (`color/primary`)
  become nested groups. No aliasing by Figma collection name.

The command makes exactly one network request per invocation, gated by an
explicit flag and an explicit env var — consistent with the "no implicit
network calls" line in SECURITY.md.
