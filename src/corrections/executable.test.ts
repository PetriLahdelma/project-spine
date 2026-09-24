import { describe, expect, it } from "vitest";
import { scrubbedGitEnvironment } from "./executable.js";

describe("correction Git evidence environment", () => {
  it("does not lazily fetch missing objects or prompt for credentials", () => {
    const environment = scrubbedGitEnvironment();
    expect(environment.GIT_NO_LAZY_FETCH).toBe("1");
    expect(environment.GIT_TERMINAL_PROMPT).toBe("0");
  });

  it("reads original objects rather than local replacement refs", () => {
    expect(scrubbedGitEnvironment().GIT_NO_REPLACE_OBJECTS).toBe("1");
  });
});
