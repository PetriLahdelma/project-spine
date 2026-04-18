import { exists, isDir, rootPath } from "./fs.js";

export async function detectAgentFiles(root: string): Promise<{
  agentsMd: boolean;
  claudeMd: boolean;
  copilotInstructions: boolean;
  cursorRules: boolean;
  projectSpineDir: boolean;
}> {
  return {
    agentsMd: await exists(rootPath(root, "AGENTS.md")),
    claudeMd: await exists(rootPath(root, "CLAUDE.md")),
    copilotInstructions: await exists(rootPath(root, ".github", "copilot-instructions.md")),
    cursorRules: await isDir(rootPath(root, ".cursor", "rules")),
    projectSpineDir: await isDir(rootPath(root, ".project-spine")),
  };
}
