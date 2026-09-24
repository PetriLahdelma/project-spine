import { describe, expect, it, vi } from "vitest";
import { removeContainerStrict } from "./docker.js";

describe("removeContainerStrict", () => {
  it("accepts a successful forced removal", async () => {
    const command = vi.fn(async () => undefined);

    await expect(removeContainerStrict("spine-correction-safe", command)).resolves.toBeUndefined();
    expect(command).toHaveBeenCalledWith(["rm", "-fv", "spine-correction-safe"]);
  });

  it("accepts only the exact already-gone response for the requested container", async () => {
    const command = vi.fn(async () => Promise.reject(Object.assign(new Error("missing"), {
      stderr: "Error response from daemon: No such container: spine-correction-gone\n",
    })));

    await expect(removeContainerStrict("spine-correction-gone", command)).resolves.toBeUndefined();
  });

  it("rejects daemon, transport, timeout, and ambiguous removal failures", async () => {
    for (const error of [
      Object.assign(new Error("daemon unavailable"), { stderr: "Cannot connect to the Docker daemon" }),
      Object.assign(new Error("wrong object"), { stderr: "Error response from daemon: No such container: another-container" }),
      new Error("command timed out"),
    ]) {
      await expect(removeContainerStrict("spine-correction-target", async () => Promise.reject(error))).rejects.toThrow(
        "Failed to remove isolated correction container spine-correction-target",
      );
    }
  });
});
