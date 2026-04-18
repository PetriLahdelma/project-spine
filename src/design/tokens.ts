import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { DesignRules, DesignItem } from "../model/design-rules.js";

export type TokenFormat = "dtcg" | "tokens-studio" | "unknown";

export type Token = {
  path: string[];
  type: string;
  value: string;
  description?: string;
};

export type TokensIngest = {
  format: TokenFormat;
  source: string;
  tokens: Token[];
  warnings: Array<{ id: string; severity: "info" | "warn" | "error"; message: string }>;
};

export async function parseTokensFromFile(path: string): Promise<TokensIngest> {
  const content = await readFile(path, "utf8");
  return parseTokens(content, basename(path));
}

export function parseTokens(content: string, source = "tokens.json"): TokensIngest {
  const warnings: TokensIngest["warnings"] = [];
  let doc: unknown;
  try {
    doc = JSON.parse(content);
  } catch (err) {
    return {
      format: "unknown",
      source,
      tokens: [],
      warnings: [
        {
          id: "tokens-invalid-json",
          severity: "error",
          message: `Could not parse ${source} as JSON: ${(err as Error).message}`,
        },
      ],
    };
  }

  if (!isObject(doc)) {
    return {
      format: "unknown",
      source,
      tokens: [],
      warnings: [
        {
          id: "tokens-not-object",
          severity: "error",
          message: `${source} root must be a JSON object.`,
        },
      ],
    };
  }

  const format = detectFormat(doc);
  if (format === "unknown") {
    warnings.push({
      id: "tokens-format-unknown",
      severity: "warn",
      message: `${source} does not look like DTCG (uses $value/$type) or Tokens Studio (uses value/type). Treating keys as nested groups.`,
    });
  }

  const tokens: Token[] = [];
  walk(doc, [], format, tokens, warnings, source);

  const byPath = new Map<string, Token>();
  for (const t of tokens) byPath.set(t.path.join("."), t);
  const resolved = tokens.map((t) => {
    if (looksLikeAlias(t.value)) {
      const target = resolveAlias(t.value, byPath);
      if (target) return { ...t, value: target };
      warnings.push({
        id: "tokens-unresolved-alias",
        severity: "info",
        message: `${source}: alias ${t.value} at ${t.path.join(".")} did not resolve to a known token.`,
      });
    }
    return t;
  });

  return { format, source, tokens: resolved, warnings };
}

export function tokensIngestToDesignRules(ingest: TokensIngest): DesignRules {
  const items: DesignItem[] = ingest.tokens.map((t) => ({
    text: renderToken(t),
    source: { kind: "design", pointer: `${ingest.source}#${t.path.join("/")}` },
  }));

  return {
    schemaVersion: 1,
    parsedAt: new Date().toISOString(),
    frontmatter: { generatedFrom: ingest.source, format: ingest.format, tokenCount: ingest.tokens.length },
    sections: {
      tokens: items,
      components: [],
      ux: [],
      accessibility: [],
      other: [],
    },
    warnings: ingest.warnings,
  };
}

export function mergeDesignRules(a: DesignRules | null, b: DesignRules | null): DesignRules | null {
  if (!a) return b;
  if (!b) return a;
  return {
    schemaVersion: 1,
    parsedAt: new Date().toISOString(),
    frontmatter: { ...a.frontmatter, ...b.frontmatter },
    sections: {
      tokens: [...a.sections.tokens, ...b.sections.tokens],
      components: [...a.sections.components, ...b.sections.components],
      ux: [...a.sections.ux, ...b.sections.ux],
      accessibility: [...a.sections.accessibility, ...b.sections.accessibility],
      other: [...a.sections.other, ...b.sections.other],
    },
    warnings: [...a.warnings, ...b.warnings],
  };
}

function detectFormat(doc: Record<string, unknown>): TokenFormat {
  let sawDtcg = false;
  let sawStudio = false;
  const visit = (node: unknown, depth: number): void => {
    if (!isObject(node) || depth > 6) return;
    if ("$value" in node || "$type" in node) sawDtcg = true;
    if ("value" in node && ("type" in node || typeof (node as Record<string, unknown>).value !== "object")) {
      if (typeof (node as Record<string, unknown>).value !== "object" || (node as Record<string, unknown>).value === null) {
        sawStudio = true;
      }
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      visit(v, depth + 1);
    }
  };
  visit(doc, 0);
  if (sawDtcg && !sawStudio) return "dtcg";
  if (sawStudio && !sawDtcg) return "tokens-studio";
  if (sawDtcg && sawStudio) return "dtcg";
  return "unknown";
}

function walk(
  node: unknown,
  path: string[],
  format: TokenFormat,
  out: Token[],
  warnings: TokensIngest["warnings"],
  source: string
): void {
  if (!isObject(node)) return;

  const dtcgToken = "$value" in node;
  const studioToken = !dtcgToken && "value" in node && !isObject((node as Record<string, unknown>).value);

  if (dtcgToken || studioToken) {
    const rawValue = dtcgToken ? (node as Record<string, unknown>).$value : (node as Record<string, unknown>).value;
    const rawType = dtcgToken ? (node as Record<string, unknown>).$type : (node as Record<string, unknown>).type;
    const rawDescription = dtcgToken
      ? (node as Record<string, unknown>).$description
      : (node as Record<string, unknown>).description;

    const value = stringifyValue(rawValue);
    const type = typeof rawType === "string" ? rawType : inferType(path, value);
    const description = typeof rawDescription === "string" ? rawDescription : undefined;

    if (value.length > 0) {
      const token: Token = {
        path: [...path],
        type,
        value,
      };
      if (description !== undefined) token.description = description;
      out.push(token);
    } else {
      warnings.push({
        id: "tokens-empty-value",
        severity: "info",
        message: `${source}: token ${path.join(".")} has an empty value.`,
      });
    }
    return;
  }

  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("$")) continue;
    walk(v, [...path, k], format, out, warnings, source);
  }
}

function stringifyValue(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "boolean") return String(raw);
  if (raw === null || raw === undefined) return "";
  try {
    return JSON.stringify(raw);
  } catch {
    return "";
  }
}

function inferType(path: string[], value: string): string {
  const p = path.join(".").toLowerCase();
  if (p.includes("color") || p.includes("colour") || /^#([0-9a-f]{3,8})$/i.test(value) || /^(rgb|hsl)a?\(/i.test(value)) {
    return "color";
  }
  if (p.includes("font") && p.includes("family")) return "fontFamily";
  if (p.includes("font") && p.includes("weight")) return "fontWeight";
  if (p.includes("font") && p.includes("size")) return "dimension";
  if (p.includes("spacing") || p.includes("space") || p.includes("padding") || p.includes("margin")) return "dimension";
  if (p.includes("radius") || p.includes("radii")) return "dimension";
  if (p.includes("shadow")) return "shadow";
  return "string";
}

function looksLikeAlias(value: string): boolean {
  return /^\{[^}]+\}$/.test(value);
}

function resolveAlias(value: string, byPath: Map<string, Token>, depth = 0): string | null {
  if (depth > 10) return null;
  const inner = value.slice(1, -1).trim();
  const target = byPath.get(inner);
  if (!target) return null;
  if (looksLikeAlias(target.value)) return resolveAlias(target.value, byPath, depth + 1);
  return target.value;
}

function renderToken(t: Token): string {
  const label = t.path.join(".");
  const extra = t.description ? ` — ${t.description}` : "";
  return `${label} (${t.type}): ${t.value}${extra}`;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
