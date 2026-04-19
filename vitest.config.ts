import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./src/commands/cli-e2e.setup.ts"],
    // Nested git worktrees (e.g. those Claude Code creates under .claude/) carry
    // their own node_modules copies and duplicate source trees. Vitest scans
    // them by default and would run each test twice — once against the real
    // repo and once against a stale copy. Exclude them wholesale.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.claude/worktrees/**",
      "**/.history/**",
    ],
  },
});
