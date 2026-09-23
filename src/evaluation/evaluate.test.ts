import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { learnCase, listCases, replayCase, type FailureCase } from "../learning/index.js";
import { evaluateCase } from "./index.js";

const tempRoots: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

async function fixture(): Promise<{ root: string; adapterPath: string; brokenSha: string; fixedSha: string }> {
  const root = await mkdtemp(join(tmpdir(), "spine-evaluation-fixture-"));
  tempRoots.push(root);
  git(root, "init", "-q");
  git(root, "config", "user.name", "Spine Test");
  git(root, "config", "user.email", "spine@example.test");
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src/result.txt"), "BROKEN\n");
  git(root, "add", "src/result.txt");
  git(root, "commit", "-q", "-m", "broken");
  const brokenSha = git(root, "rev-parse", "HEAD");
  await writeFile(join(root, "src/result.txt"), "CORRECTED\n");
  git(root, "add", "src/result.txt");
  git(root, "commit", "-q", "-m", "fixed");
  const fixedSha = git(root, "rev-parse", "HEAD");

  const failureCase: FailureCase = {
    version: 1,
    id: "paired-agent-replay",
    title: "Produce the corrected result",
    summary: "The fixture agent should use verified context to replace the broken literal.",
    source: { kind: "manual", revision: fixedSha },
    rules: [{
      id: "corrected-result",
      description: "The result contains the reviewed correction.",
      files: ["src/result.txt"],
      kind: "require-text",
      text: "CORRECTED",
    }],
    replay: { brokenRef: brokenSha, fixedRef: fixedSha },
  };
  const caseFile = join(root, "failure.json");
  await writeFile(caseFile, JSON.stringify(failureCase));
  await learnCase(root, caseFile);
  await replayCase(root, failureCase.id);

  const agentScript = [
    "const fs=require('node:fs');",
    "const path=require('node:path');",
    "if(process.env.SPINE_CONTEXT_FILE){",
    " const context=fs.readFileSync(process.env.SPINE_CONTEXT_FILE,'utf8');",
    " if(context.includes('CORRECTED')) fs.writeFileSync(path.join(process.env.SPINE_REPO_DIR,'src/result.txt'),'CORRECTED\\n');",
    "}",
  ].join("");
  const verifyScript = [
    "const fs=require('node:fs');",
    "const path=require('node:path');",
    "const value=fs.readFileSync(path.join(process.env.SPINE_REPO_DIR,'src/result.txt'),'utf8');",
    "process.exit(value.includes('CORRECTED')?0:1);",
  ].join("");
  const adapterPath = join(root, "simulated-adapter.json");
  await writeFile(adapterPath, JSON.stringify({
    version: 1,
    agent: { command: process.execPath, args: ["-e", agentScript] },
    verify: { command: process.execPath, args: ["-e", verifyScript] },
    timeoutMs: 5_000,
  }));
  return { root, adapterPath, brokenSha, fixedSha };
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("evaluateCase", { timeout: 60_000 }, () => {
  it("runs paired isolated simulated-agent attempts and a corrected-revision control", async () => {
    const { root, adapterPath } = await fixture();
    const original = await readFile(join(root, "src/result.txt"), "utf8");

    const report = await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true, runs: 2 });

    expect(report).toMatchObject({
      version: 1,
      kind: "agent-replay-evaluation",
      caseId: "paired-agent-replay",
      runs: 2,
      adapterHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      revisions: {
        brokenSha: expect.stringMatching(/^[a-f0-9]{40}$/),
        fixedSha: expect.stringMatching(/^[a-f0-9]{40}$/),
      },
      brokenControl: { exitCode: 1, succeeded: false, signal: null },
      fixedControl: { succeeded: true },
      baselineSuccesses: 0,
      guardedSuccesses: 2,
      results: [
        { run: 1, baseline: { succeeded: false }, guarded: { succeeded: true } },
        { run: 2, baseline: { succeeded: false }, guarded: { succeeded: true } },
      ],
    });
    expect(report.results[0]?.baseline.agent).toMatchObject({ succeeded: true, timedOut: false });
    expect(report.results[0]?.baseline.verification).toMatchObject({ succeeded: false, timedOut: false });
    expect(report.results[0]?.guarded.verification).toMatchObject({ succeeded: true, timedOut: false });
    expect(report.limitations.join(" ")).toMatch(/without an operating-system sandbox/);
    expect(report.limitations.join(" ")).toMatch(/verifier is trusted evaluation code/);
    expect(await readFile(join(root, "src/result.txt"), "utf8")).toBe(original);
    expect(await listCases(root)).toMatchObject([{ id: "paired-agent-replay", status: "verified" }]);
  });

  it("requires explicit execution opt-in and bounded runs", async () => {
    const { root, adapterPath } = await fixture();
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: false } as never)).rejects.toThrow(
      /allowExecution: true/,
    );
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true, runs: 6 })).rejects.toThrow(
      /between 1 and 5/,
    );
  });

  it("rejects adapter fields outside the strict execution contract", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as Record<string, unknown>;
    value.shell = true;
    await writeFile(adapterPath, JSON.stringify(value));
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true })).rejects.toThrow(
      /Invalid evaluation adapter/,
    );
  });

  it("reserves Project Spine's context environment variables", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as Record<string, unknown>;
    value.allowedEnv = ["SPINE_CONTEXT_FILE"];
    await writeFile(adapterPath, JSON.stringify(value));
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true })).rejects.toThrow(
      /Project Spine controls this environment variable/,
    );
  });

  it("requires the evaluator to pass the corrected control revision", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      verify: { command: string; args: string[] };
    };
    value.verify.args = ["-e", "process.exit(1)"];
    await writeFile(adapterPath, JSON.stringify(value));
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true })).rejects.toThrow(
      /known corrected revision/,
    );
  });

  it("requires the isolated broken control to fail the evaluator", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      verify: { command: string; args: string[] };
    };
    value.verify.args = ["-e", "process.exit(0)"];
    await writeFile(adapterPath, JSON.stringify(value));
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true })).rejects.toThrow(
      /already passes on the broken revision/,
    );
  });

  it("does not leak verifier mutations from the broken control into agent attempts", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      agent: { command: string; args: string[] };
      verify: { command: string; args: string[] };
    };
    value.agent.args = ["-e", "process.exit(0)"];
    value.verify.args = [
      "-e",
      "const fs=require('node:fs');const path=require('node:path');const p=path.join(process.env.SPINE_REPO_DIR,'src/result.txt');const v=fs.readFileSync(p,'utf8');if(v.includes('CORRECTED'))process.exit(0);fs.writeFileSync(p,'CORRECTED\\n');process.exit(1);",
    ];
    await writeFile(adapterPath, JSON.stringify(value));

    const report = await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true });
    expect(report.brokenControl).toMatchObject({ exitCode: 1, succeeded: false });
    expect(report.results[0]?.baseline).toMatchObject({
      agent: { exitCode: 0, succeeded: true },
      verification: { exitCode: 1, succeeded: false },
      succeeded: false,
    });
    expect(report.results[0]?.guarded.succeeded).toBe(false);
  });

  it("rejects broken-state verifier crashes and non-contract exit codes", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      verify: { command: string; args: string[] };
    };
    value.verify.args = [
      "-e",
      "const fs=require('node:fs');const path=require('node:path');const v=fs.readFileSync(path.join(process.env.SPINE_REPO_DIR,'src/result.txt'),'utf8');if(v.includes('CORRECTED'))process.exit(0);process.kill(process.pid,'SIGKILL');",
    ];
    await writeFile(adapterPath, JSON.stringify(value));
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true })).rejects.toThrow(
      /terminated abnormally with signal SIGKILL/,
    );

    value.verify.args = [
      "-e",
      "const fs=require('node:fs');const path=require('node:path');const v=fs.readFileSync(path.join(process.env.SPINE_REPO_DIR,'src/result.txt'),'utf8');process.exit(v.includes('CORRECTED')?0:2);",
    ];
    await writeFile(adapterPath, JSON.stringify(value));
    await expect(evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true })).rejects.toThrow(
      /configured expected failure code \(1\)/,
    );
  });

  it("supports tool-specific expected broken-state exit codes", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      agent: { command: string; args: string[] };
      verify: { command: string; args: string[] };
      expectedFailureCodes?: number[];
    };
    value.agent.args = ["-e", "process.exit(0)"];
    value.verify.args = [
      "-e",
      "const fs=require('node:fs');const path=require('node:path');const v=fs.readFileSync(path.join(process.env.SPINE_REPO_DIR,'src/result.txt'),'utf8');process.exit(v.includes('CORRECTED')?0:2);",
    ];
    value.expectedFailureCodes = [2];
    await writeFile(adapterPath, JSON.stringify(value));

    const report = await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true });
    expect(report.brokenControl).toMatchObject({ exitCode: 2, succeeded: false });
    expect(report.results[0]?.baseline.verification.exitCode).toBe(2);
  });

  it("does not inherit credentials unless named by the adapter", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      agent: { command: string; args: string[] };
      verify: { command: string; args: string[] };
    };
    value.agent.args = ["-e", "if(process.env.SPINE_EVALUATION_SECRET)process.exit(9)"];
    await writeFile(adapterPath, JSON.stringify(value));
    const previous = process.env.SPINE_EVALUATION_SECRET;
    process.env.SPINE_EVALUATION_SECRET = "must-not-leak";
    try {
      const report = await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true });
      expect(report.results[0]?.baseline.agent.exitCode).toBe(0);
      expect(report.results[0]?.guarded.agent.exitCode).toBe(0);
    } finally {
      if (previous === undefined) delete process.env.SPINE_EVALUATION_SECRET;
      else process.env.SPINE_EVALUATION_SECRET = previous;
    }
  });

  it("terminates timed-out agent processes and records the timeout", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      agent: { command: string; args: string[] };
      timeoutMs: number;
    };
    value.agent.args = ["-e", "setInterval(()=>{},1000)"];
    value.timeoutMs = 500;
    await writeFile(adapterPath, JSON.stringify(value));

    const report = await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true });
    expect(report.results[0]?.baseline.agent).toMatchObject({ timedOut: true, succeeded: false });
    expect(report.results[0]?.guarded.agent).toMatchObject({ timedOut: true, succeeded: false });
  });

  it.skipIf(process.platform === "win32")("terminates descendant processes in the timed-out agent group", async () => {
    const { root, adapterPath } = await fixture();
    const marker = join(root, ".descendant-marker");
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      agent: { command: string; args: string[] };
      timeoutMs: number;
      allowedEnv?: string[];
    };
    const descendant = "setTimeout(()=>require('node:fs').writeFileSync(process.env.SPINE_DESCENDANT_MARKER,'leaked'),1200)";
    value.agent.args = [
      "-e",
      `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'ignore'});setInterval(()=>{},1000)`,
    ];
    value.timeoutMs = 500;
    value.allowedEnv = ["SPINE_DESCENDANT_MARKER"];
    await writeFile(adapterPath, JSON.stringify(value));
    const previous = process.env.SPINE_DESCENDANT_MARKER;
    process.env.SPINE_DESCENDANT_MARKER = marker;
    try {
      await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true });
      await new Promise((resolveWait) => setTimeout(resolveWait, 1_300));
      await expect(readFile(marker, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      if (previous === undefined) delete process.env.SPINE_DESCENDANT_MARKER;
      else process.env.SPINE_DESCENDANT_MARKER = previous;
    }
  });

  it("does not count a failed agent as successful when its edits happen to pass verification", async () => {
    const { root, adapterPath } = await fixture();
    const value = JSON.parse(await readFile(adapterPath, "utf8")) as {
      agent: { command: string; args: string[] };
    };
    value.agent.args = [
      "-e",
      "const fs=require('node:fs');const path=require('node:path');fs.writeFileSync(path.join(process.env.SPINE_REPO_DIR,'src/result.txt'),'CORRECTED\\n');process.exit(9);",
    ];
    await writeFile(adapterPath, JSON.stringify(value));

    const report = await evaluateCase(root, "paired-agent-replay", adapterPath, { allowExecution: true });
    expect(report.results[0]?.baseline).toMatchObject({
      agent: { exitCode: 9, succeeded: false },
      verification: { exitCode: 0, succeeded: true },
      succeeded: false,
    });
    expect(report.baselineSuccesses).toBe(0);
    expect(report.guardedSuccesses).toBe(0);
  });
});
