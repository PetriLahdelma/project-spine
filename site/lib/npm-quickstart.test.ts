import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AUTH_MD,
  HOME_MARKDOWN,
  LLMS_TXT,
  NPM_BETA_PACKAGE,
  PROJECT_SPINE_SKILL,
  mcpServerCard,
} from "./agent-discovery";

const EXPECTED_PACKAGE = "project-spine@0.10.0-beta.3";
const GITHUB_ASSET =
  "https://github.com/PetriLahdelma/project-spine/releases/download/v0.10.0-beta.3/project-spine-0.10.0-beta.3.tgz";
const LEGACY_GITHUB_SELECTOR =
  `--package=${GITHUB_ASSET}`;

const commandSurfaceFiles = [
  "../app/components/install-command.tsx",
  "../app/components/webmcp-provider.tsx",
  "../app/(marketing)/docs/page.tsx",
  "../app/(marketing)/for/[stack]/page.tsx",
  "../app/(marketing)/product/templates/[name]/page.tsx",
];

describe("published npm beta quickstart", () => {
  it("uses the exact published package in agent-facing discovery surfaces", () => {
    expect(NPM_BETA_PACKAGE).toBe(EXPECTED_PACKAGE);

    for (const content of [HOME_MARKDOWN, LLMS_TXT, AUTH_MD, PROJECT_SPINE_SKILL]) {
      expect(content).toContain(`--package=${EXPECTED_PACKAGE}`);
      expect(content).not.toContain(LEGACY_GITHUB_SELECTOR);
    }
    for (const content of [HOME_MARKDOWN, LLMS_TXT]) {
      expect(content).toContain(GITHUB_ASSET);
      expect(content).toContain("ff0d733988e87cd0ee75029eea4599fd214c171896a3a40862d89b87928770a1");
    }

    const card = mcpServerCard() as {
      transport: { type: string; command: string; args: string[]; install: string };
    };
    expect(card.transport).toEqual({
      type: "stdio",
      command: "npx",
      args: ["--yes", `--package=${EXPECTED_PACKAGE}`, "spine-mcp"],
      install: "No persistent global install; npx selects the exact published npm beta.",
    });
  });

  it("keeps every human and WebMCP command surface on the same selector", () => {
    for (const relativePath of commandSurfaceFiles) {
      const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
      expect(source, relativePath).toContain(`--package=${EXPECTED_PACKAGE}`);
      expect(source, relativePath).not.toContain(LEGACY_GITHUB_SELECTOR);
    }
  });
});
