/**
 * Figma Variables → DTCG bridge.
 *
 * Reads `/v1/files/:fileKey/variables/local` with a Figma Personal Access
 * Token and emits a DTCG-shaped JSON tree that `spine compile --tokens`
 * accepts without manual massaging.
 *
 * Scope of this first cut:
 * - Variable types: COLOR, FLOAT, STRING, BOOLEAN.
 * - Default-mode values only (multi-mode = follow-up work; the compiler
 *   currently has no way to represent theme sets).
 * - Variable aliases emit DTCG alias syntax: `{path.to.target}`.
 *
 * No implicit network calls: a fileKey is always required and the PAT has
 * to be present in `FIGMA_TOKEN` before we hit Figma. See
 * docs/tokens.md for the worked end-to-end example.
 */

const FIGMA_API = "https://api.figma.com";

type FigmaVariableAlias = { type: "VARIABLE_ALIAS"; id: string };
type FigmaRGBA = { r: number; g: number; b: number; a: number };
type FigmaValue = string | number | boolean | FigmaRGBA | FigmaVariableAlias;

export type FigmaVariable = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: Record<string, FigmaValue>;
  variableCollectionId: string;
};

export type FigmaCollection = {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
};

export type FigmaVariablesResponse = {
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaCollection>;
  };
};

type DtcgLeaf = { $value: string | number | boolean; $type: string };
export type DtcgTree = { [key: string]: DtcgTree | DtcgLeaf };

export type PullOptions = {
  fileKey: string;
  token: string;
  fetchImpl?: typeof fetch;
  figmaApi?: string;
};

export async function fetchFigmaVariables(
  opts: PullOptions,
): Promise<FigmaVariablesResponse> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const base = opts.figmaApi ?? FIGMA_API;
  const url = `${base}/v1/files/${encodeURIComponent(opts.fileKey)}/variables/local`;
  const res = await fetchImpl(url, {
    headers: { "X-Figma-Token": opts.token },
  });
  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(
      `Figma API ${res.status} for file ${opts.fileKey}${body ? `: ${body}` : ""}`,
    );
  }
  const data = (await res.json()) as FigmaVariablesResponse;
  if (!data?.meta?.variables || !data.meta.variableCollections) {
    throw new Error(
      `Figma response missing meta.variables or meta.variableCollections — does the file have local variables enabled?`,
    );
  }
  return data;
}

/**
 * Convert a FigmaVariablesResponse to a DTCG tree. Uses the
 * `defaultModeId` from each collection as the single-mode value.
 * Slashes in variable names split into nested groups.
 */
export function figmaToDtcg(resp: FigmaVariablesResponse): DtcgTree {
  const { variables, variableCollections } = resp.meta;
  const byId = new Map<string, FigmaVariable>();
  for (const v of Object.values(variables)) byId.set(v.id, v);

  const root: DtcgTree = {};

  for (const variable of Object.values(variables)) {
    const collection = variableCollections[variable.variableCollectionId];
    if (!collection) continue;
    const modeId = collection.defaultModeId;
    const raw = variable.valuesByMode[modeId];
    if (raw === undefined) continue;

    const leaf = leafFor(variable, raw, byId);
    if (!leaf) continue;

    const path = variable.name.split("/").map((s) => s.trim()).filter(Boolean);
    if (path.length === 0) continue;
    setAtPath(root, path, leaf);
  }

  return root;
}

function leafFor(
  variable: FigmaVariable,
  raw: FigmaValue,
  byId: Map<string, FigmaVariable>,
): DtcgLeaf | null {
  if (isAlias(raw)) {
    const target = byId.get(raw.id);
    if (!target) return null;
    const targetPath = target.name.split("/").map((s) => s.trim()).filter(Boolean);
    return {
      $value: `{${targetPath.join(".")}}`,
      $type: dtcgTypeFor(variable.resolvedType),
    };
  }
  switch (variable.resolvedType) {
    case "COLOR":
      if (!isRgba(raw)) return null;
      return { $value: rgbaToHex(raw), $type: "color" };
    case "FLOAT":
      if (typeof raw !== "number") return null;
      return { $value: raw, $type: "number" };
    case "STRING":
      if (typeof raw !== "string") return null;
      return { $value: raw, $type: "string" };
    case "BOOLEAN":
      if (typeof raw !== "boolean") return null;
      return { $value: raw, $type: "boolean" };
  }
}

function dtcgTypeFor(t: FigmaVariable["resolvedType"]): string {
  switch (t) {
    case "COLOR":
      return "color";
    case "FLOAT":
      return "number";
    case "STRING":
      return "string";
    case "BOOLEAN":
      return "boolean";
  }
}

function setAtPath(root: DtcgTree, path: string[], leaf: DtcgLeaf): void {
  let node: DtcgTree = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const next = node[key];
    if (next === undefined || isLeaf(next)) {
      const fresh: DtcgTree = {};
      node[key] = fresh;
      node = fresh;
    } else {
      node = next;
    }
  }
  node[path[path.length - 1]!] = leaf;
}

function isLeaf(n: DtcgTree | DtcgLeaf): n is DtcgLeaf {
  return typeof (n as DtcgLeaf).$value !== "undefined";
}

function isAlias(v: FigmaValue): v is FigmaVariableAlias {
  return typeof v === "object" && v !== null && (v as FigmaVariableAlias).type === "VARIABLE_ALIAS";
}

function isRgba(v: FigmaValue): v is FigmaRGBA {
  return typeof v === "object" && v !== null && "r" in v && "g" in v && "b" in v;
}

function rgbaToHex({ r, g, b, a }: FigmaRGBA): string {
  const to255 = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const base = `#${hex(to255(r))}${hex(to255(g))}${hex(to255(b))}`;
  return a >= 1 ? base : `${base}${hex(to255(a))}`;
}

async function safeText(res: Response): Promise<string | null> {
  try {
    const text = await res.text();
    return text.length > 200 ? text.slice(0, 200) + "…" : text;
  } catch {
    return null;
  }
}

/**
 * Extract the fileKey from a figma.com URL. Accepts the canonical
 * `https://www.figma.com/design/:key/...` form used by the current Figma UI.
 * Returns null for URLs we can't parse rather than throwing — the CLI
 * wraps with a friendlier error.
 */
export function parseFigmaUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("figma.com")) return null;
    const match = u.pathname.match(/^\/(?:design|file|board|make)\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
