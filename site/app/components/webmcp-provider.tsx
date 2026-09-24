"use client";

import { useEffect } from "react";

type WebMcpResult = {
  title: string;
  trial: string;
  docs: string;
  mcp: {
    command: string;
    args: string[];
    config: {
      mcpServers: {
        "project-spine": {
          command: string;
          args: string[];
        };
      };
    };
  };
  coreCommands: string[];
};

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, never>;
    additionalProperties: false;
  };
  execute: () => Promise<WebMcpResult>;
  annotations: {
    readOnlyHint: true;
  };
};

type ModelContext = {
  registerTool?: (tool: WebMcpTool) => void;
  provideContext?: (context: { tools: WebMcpTool[] }) => void;
};

type NavigatorWithModelContext = Navigator & {
  modelContext?: ModelContext;
};

const projectSpineTool: WebMcpTool = {
  name: "project_spine_getting_started",
  description:
    "Return the Project Spine npm beta trial, reusable npx MCP setup, and fully prefixed repository-learning commands.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  async execute() {
    return {
      title: "Project Spine getting started",
      trial: "npx --yes --package=project-spine@0.10.0-beta.3 spine demo",
      docs: "https://projectspine.dev/docs",
      mcp: {
        command: "npx",
        args: ["--yes", "--package=project-spine@0.10.0-beta.3", "spine-mcp"],
        config: {
          mcpServers: {
            "project-spine": {
              command: "npx",
              args: ["--yes", "--package=project-spine@0.10.0-beta.3", "spine-mcp"],
            },
          },
        },
      },
      coreCommands: [
        "npx --yes --package=project-spine@0.10.0-beta.3 spine learn --case failure.json",
        "npx --yes --package=project-spine@0.10.0-beta.3 spine replay <case-id>",
        "npx --yes --package=project-spine@0.10.0-beta.3 spine guard --diff HEAD~1 --json",
        "npx --yes --package=project-spine@0.10.0-beta.3 spine context --files 'src/a.ts'",
        "npx --yes --package=project-spine@0.10.0-beta.3 spine report --format html --out report.html",
        "npx --yes --package=project-spine@0.10.0-beta.3 spine demo",
      ],
    };
  },
  annotations: {
    readOnlyHint: true,
  },
};

export function WebMcpProvider() {
  useEffect(() => {
    const modelContext = (navigator as NavigatorWithModelContext).modelContext;
    if (!modelContext) return;

    modelContext.registerTool?.(projectSpineTool);
    modelContext.provideContext?.({ tools: [projectSpineTool] });
  }, []);

  return null;
}
