"use client";

import { useEffect } from "react";

type WebMcpResult = {
  title: string;
  install: string;
  docs: string;
  mcp: {
    command: string;
    config: {
      mcpServers: {
        "project-spine": {
          command: string;
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
    "Return Project Spine source-build, MCP setup, and core repository-learning commands.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  async execute() {
    return {
      title: "Project Spine getting started",
      install: "git clone --branch main https://github.com/PetriLahdelma/project-spine.git && cd project-spine && npm ci && npm run build && node dist/cli.js demo",
      docs: "https://projectspine.dev/docs",
      mcp: {
        command: "spine-mcp",
        config: {
          mcpServers: {
            "project-spine": {
              command: "spine-mcp",
            },
          },
        },
      },
      coreCommands: [
        "spine learn --case failure.json",
        "spine replay <case-id>",
        "spine guard --diff HEAD~1 --json",
        "spine context --files 'src/a.ts'",
        "spine report --format html --out report.html",
        "spine demo",
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
