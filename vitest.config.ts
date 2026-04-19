import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./src/commands/cli-e2e.setup.ts"],
  },
});
