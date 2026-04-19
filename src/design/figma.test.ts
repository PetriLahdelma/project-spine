import { describe, it, expect } from "vitest";
import {
  figmaToDtcg,
  parseFigmaUrl,
  fetchFigmaVariables,
  type FigmaVariablesResponse,
} from "./figma.js";

function fixture(): FigmaVariablesResponse {
  return {
    meta: {
      variableCollections: {
        coll1: { id: "coll1", name: "Brand", modes: [{ modeId: "m1", name: "default" }], defaultModeId: "m1" },
      },
      variables: {
        v1: {
          id: "v1",
          name: "color/primary",
          resolvedType: "COLOR",
          variableCollectionId: "coll1",
          valuesByMode: { m1: { r: 1, g: 0, b: 0.5, a: 1 } },
        },
        v2: {
          id: "v2",
          name: "color/accent",
          resolvedType: "COLOR",
          variableCollectionId: "coll1",
          valuesByMode: { m1: { type: "VARIABLE_ALIAS", id: "v1" } },
        },
        v3: {
          id: "v3",
          name: "spacing/sm",
          resolvedType: "FLOAT",
          variableCollectionId: "coll1",
          valuesByMode: { m1: 8 },
        },
        v4: {
          id: "v4",
          name: "brand/name",
          resolvedType: "STRING",
          variableCollectionId: "coll1",
          valuesByMode: { m1: "Acme" },
        },
        v5: {
          id: "v5",
          name: "flags/enabled",
          resolvedType: "BOOLEAN",
          variableCollectionId: "coll1",
          valuesByMode: { m1: true },
        },
      },
    },
  };
}

describe("figmaToDtcg", () => {
  it("nests by slash-delimited names and converts COLOR → hex", () => {
    const dtcg = figmaToDtcg(fixture());
    expect(dtcg).toHaveProperty("color.primary");
    const primary = (dtcg as Record<string, Record<string, unknown>>).color!["primary"] as {
      $value: string;
      $type: string;
    };
    expect(primary.$type).toBe("color");
    expect(primary.$value).toBe("#ff0080");
  });

  it("emits DTCG alias syntax for VARIABLE_ALIAS references", () => {
    const dtcg = figmaToDtcg(fixture());
    const accent = (dtcg as Record<string, Record<string, unknown>>).color!["accent"] as {
      $value: string;
      $type: string;
    };
    expect(accent.$value).toBe("{color.primary}");
    expect(accent.$type).toBe("color");
  });

  it("preserves FLOAT, STRING, BOOLEAN values with the right $type", () => {
    const dtcg = figmaToDtcg(fixture()) as Record<string, Record<string, unknown>>;
    expect(dtcg.spacing!["sm"]).toEqual({ $value: 8, $type: "number" });
    expect(dtcg.brand!["name"]).toEqual({ $value: "Acme", $type: "string" });
    expect(dtcg.flags!["enabled"]).toEqual({ $value: true, $type: "boolean" });
  });

  it("appends an alpha byte to the hex when a < 1", () => {
    const r = fixture();
    r.meta.variables["v1"]!.valuesByMode["m1"] = { r: 0, g: 0, b: 0, a: 0.5 };
    const dtcg = figmaToDtcg(r) as Record<string, Record<string, unknown>>;
    const primary = dtcg.color!["primary"] as { $value: string };
    expect(primary.$value).toBe("#00000080");
  });
});

describe("parseFigmaUrl", () => {
  it.each([
    ["https://www.figma.com/design/ABC123/My-File", "ABC123"],
    ["https://figma.com/file/XYZ789/Old-Style", "XYZ789"],
    ["https://www.figma.com/board/FJ1234/FigJam", "FJ1234"],
    ["https://www.figma.com/design/ABC123/My-File?node-id=1-2", "ABC123"],
  ])("extracts fileKey from %s", (url, expected) => {
    expect(parseFigmaUrl(url)).toBe(expected);
  });

  it("returns null for non-Figma URLs", () => {
    expect(parseFigmaUrl("https://example.com/design/abc")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parseFigmaUrl("not a url")).toBeNull();
  });
});

describe("fetchFigmaVariables", () => {
  it("sends X-Figma-Token and parses the meta shape", async () => {
    let capturedHeaders: Headers | null = null;
    let capturedUrl = "";
    const mockFetch: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify(fixture()), { status: 200 });
    };
    const resp = await fetchFigmaVariables({ fileKey: "abc", token: "figd_xyz", fetchImpl: mockFetch });
    expect(resp.meta.variables["v1"]?.name).toBe("color/primary");
    expect(capturedUrl).toContain("/v1/files/abc/variables/local");
    expect(capturedHeaders!.get("X-Figma-Token")).toBe("figd_xyz");
  });

  it("throws with the status and a truncated body on non-2xx", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response("Invalid token", { status: 403 });
    await expect(
      fetchFigmaVariables({ fileKey: "abc", token: "bad", fetchImpl: mockFetch }),
    ).rejects.toThrow(/403/);
  });

  it("throws when the response shape is not a variables payload", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: "nope" }), { status: 200 });
    await expect(
      fetchFigmaVariables({ fileKey: "abc", token: "tok", fetchImpl: mockFetch }),
    ).rejects.toThrow(/meta\.variables/);
  });
});
