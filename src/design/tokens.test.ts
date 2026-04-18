import { describe, it, expect } from "vitest";
import { parseTokens, tokensIngestToDesignRules, mergeDesignRules } from "./tokens.js";
import { parseDesign } from "./parse.js";

describe("parseTokens", () => {
  it("detects DTCG format and flattens grouped tokens", () => {
    const doc = {
      color: {
        primary: { $value: "#6366f1", $type: "color", $description: "brand primary" },
        accent: { $value: "#22d3ee", $type: "color" },
      },
      space: {
        sm: { $value: "8px", $type: "dimension" },
      },
    };
    const ingest = parseTokens(JSON.stringify(doc), "tokens.json");
    expect(ingest.format).toBe("dtcg");
    expect(ingest.tokens).toHaveLength(3);

    const primary = ingest.tokens.find((t) => t.path.join(".") === "color.primary");
    expect(primary).toMatchObject({ type: "color", value: "#6366f1", description: "brand primary" });

    const sm = ingest.tokens.find((t) => t.path.join(".") === "space.sm");
    expect(sm).toMatchObject({ type: "dimension", value: "8px" });
  });

  it("detects Tokens Studio format (value/type without $ prefix)", () => {
    const doc = {
      colors: {
        brand: { value: "#ff0080", type: "color" },
      },
      typography: {
        heading: {
          xl: { value: "32px", type: "fontSizes" },
        },
      },
    };
    const ingest = parseTokens(JSON.stringify(doc), "studio.json");
    expect(ingest.format).toBe("tokens-studio");
    expect(ingest.tokens).toHaveLength(2);
    expect(ingest.tokens.find((t) => t.path.join(".") === "colors.brand")?.value).toBe("#ff0080");
  });

  it("resolves DTCG aliases like {color.primary}", () => {
    const doc = {
      color: {
        primary: { $value: "#6366f1", $type: "color" },
        button: { bg: { $value: "{color.primary}", $type: "color" } },
      },
    };
    const ingest = parseTokens(JSON.stringify(doc), "tokens.json");
    const buttonBg = ingest.tokens.find((t) => t.path.join(".") === "color.button.bg");
    expect(buttonBg?.value).toBe("#6366f1");
  });

  it("warns on unresolved aliases but still emits the token", () => {
    const doc = { color: { fg: { $value: "{color.missing}", $type: "color" } } };
    const ingest = parseTokens(JSON.stringify(doc), "tokens.json");
    expect(ingest.tokens[0]!.value).toBe("{color.missing}");
    expect(ingest.warnings.find((w) => w.id === "tokens-unresolved-alias")).toBeTruthy();
  });

  it("returns an error warning on invalid JSON", () => {
    const ingest = parseTokens("{not-json", "bad.json");
    expect(ingest.format).toBe("unknown");
    expect(ingest.tokens).toHaveLength(0);
    expect(ingest.warnings[0]!.id).toBe("tokens-invalid-json");
  });

  it("tokensIngestToDesignRules produces DesignRules with tokens section", () => {
    const doc = { color: { primary: { $value: "#000", $type: "color" } } };
    const ingest = parseTokens(JSON.stringify(doc), "tokens.json");
    const design = tokensIngestToDesignRules(ingest);
    expect(design.sections.tokens).toHaveLength(1);
    expect(design.sections.tokens[0]!.text).toContain("color.primary (color): #000");
    expect(design.sections.tokens[0]!.source.pointer).toBe("tokens.json#color/primary");
  });

  it("mergeDesignRules concatenates sections from both sources", () => {
    const fromMd = parseDesign("## Components\n- Use Button for primary CTA\n");
    const fromTokens = tokensIngestToDesignRules(
      parseTokens(JSON.stringify({ color: { primary: { $value: "#f00", $type: "color" } } }), "tokens.json")
    );
    const merged = mergeDesignRules(fromMd, fromTokens);
    expect(merged).not.toBeNull();
    expect(merged!.sections.tokens).toHaveLength(1);
    expect(merged!.sections.components).toHaveLength(1);
  });
});
