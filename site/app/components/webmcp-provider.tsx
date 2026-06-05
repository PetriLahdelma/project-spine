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
    "Return Project Spine install, MCP setup, and core CLI commands for compiling deterministic repo-native agent instructions.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  async execute() {
    return {
      title: "Project Spine getting started",
      install: "npm install -g project-spine@beta",
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
        "spine doctor --strict",
        "spine init --template saas-marketing",
        "spine compile --brief ./brief.md --repo .",
        "spine drift check --fail-on any",
        "spine drift diff",
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
