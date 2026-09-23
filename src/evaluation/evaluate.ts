import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { explainCase } from "../learning/index.js";
import { repositoryRoot } from "../learning/storage.js";
import {
  EvaluationAdapterSchema,
  type CaseEvaluationReport,
  type EvaluationAdapter,
  type EvaluationAttempt,
  type ProcessObservation,
} from "./model.js";

const MAX_ADAPTER_BYTES = 64 * 1024;
const MAX_COMMAND_OUTPUT = 1024 * 1024;
const GIT_TIMEOUT_MS = 30_000;
const GIT_MAX_OUTPUT = 4 * 1024 * 1024;

export interface EvaluateCaseOptions {
  allowExecution: true;
  runs?: number;
}

type CommandSpec = EvaluationAdapter["agent"];

type InternalProcessObservation = ProcessObservation & {
  stdout: string;
  stderr: string;
  outputExceeded: boolean;
  spawnError: string | null;
};

export async function evaluateCase(
  repo: string,
  caseId: string,
  adapterPath: string,
  options: EvaluateCaseOptions,
): Promise<CaseEvaluationReport> {
  if (!options || options.allowExecution !== true) {
    throw new Error(
      "Agent replay executes local processes and repository code without an operating-system sandbox. Pass allowExecution: true only after reviewing the adapter.",
    );
  }
  const runs = options.runs ?? 1;
  if (!Number.isSafeInteger(runs) || runs < 1 || runs > 5) throw new Error("runs must be an integer between 1 and 5.");

  const root = await repositoryRoot(repo);
  const adapterFile = await realpath(resolve(adapterPath));
  const { adapter, contentHash: adapterHash } = await readAdapter(adapterFile);
  const explained = await explainCase(root, caseId);
  if (!explained.enforceable || !explained.verification) {
    throw new Error(`Case ${caseId} must have current deterministic replay verification before agent evaluation.`);
  }

  const temporaryRoot = await mkdtemp(join(tmpdir(), "spine-evaluate-"));
  try {
    const commonEnvironment = inheritedEnvironment(adapter.allowedEnv ?? []);
    const brokenDir = await cloneAt(root, explained.verification.brokenSha, temporaryRoot, "broken-control", commonEnvironment);
    const brokenControl = await runCommand(
      adapter.verify,
      brokenDir,
      { ...commonEnvironment, SPINE_REPO_DIR: brokenDir },
      adapter.timeoutMs,
    );
    assertExpectedBrokenFailure(brokenControl, "broken control verification", adapter.expectedFailureCodes);

    const fixedDir = await cloneAt(root, explained.verification.fixedSha, temporaryRoot, "fixed-control", commonEnvironment);
    const fixedControl = await runCommand(
      adapter.verify,
      fixedDir,
      { ...commonEnvironment, SPINE_REPO_DIR: fixedDir },
      adapter.timeoutMs,
    );
    assertConclusive(fixedControl, "fixed control verification");
    if (!fixedControl.succeeded) {
      throw new Error("Adapter verification failed on the known corrected revision. The evaluator cannot distinguish a valid correction.");
    }

    const task = `${explained.stored.case.title}\n\n${explained.stored.case.summary}`;
    const context = renderVerifiedContext(explained.stored.case, explained.verification.brokenSha, explained.verification.fixedSha);
    const results: CaseEvaluationReport["results"] = [];
    for (let run = 1; run <= runs; run += 1) {
      const baselineDir = await cloneAt(root, explained.verification.brokenSha, temporaryRoot, `run-${run}-baseline`, commonEnvironment);
      const guardedDir = await cloneAt(root, explained.verification.brokenSha, temporaryRoot, `run-${run}-guarded`, commonEnvironment);

      const baseline = await evaluateAttempt({
        directory: baselineDir,
        adapter,
        environment: { ...commonEnvironment, SPINE_TASK: task, SPINE_REPO_DIR: baselineDir },
        label: `baseline run ${run}`,
      });

      const contextFile = join(guardedDir, `.spine-context-${randomUUID()}.md`);
      await writeFile(contextFile, context, { encoding: "utf8", flag: "wx", mode: 0o600 });
      const guarded = await evaluateAttempt({
        directory: guardedDir,
        adapter,
        environment: {
          ...commonEnvironment,
          SPINE_TASK: task,
          SPINE_REPO_DIR: guardedDir,
          SPINE_CONTEXT_FILE: contextFile,
        },
        label: `guarded run ${run}`,
      });
      results.push({ run, baseline, guarded });
    }

    return {
      version: 1,
      kind: "agent-replay-evaluation",
      caseId,
      adapterPath: adapterFile,
      adapterHash,
      runs,
      revisions: {
        brokenSha: explained.verification.brokenSha,
        fixedSha: explained.verification.fixedSha,
      },
      brokenControl: publicObservation(brokenControl),
      fixedControl: publicObservation(fixedControl),
      baselineSuccesses: results.filter((result) => result.baseline.succeeded).length,
      guardedSuccesses: results.filter((result) => result.guarded.succeeded).length,
      results,
      evaluatedAt: new Date().toISOString(),
      limitations: [
        "This opt-in evaluation executes local processes and repository code without an operating-system sandbox.",
        "Results measure command success, elapsed time, and output size; they do not measure token usage or monetary cost.",
        "Agent replay results are performance evidence only and never activate or replace deterministic guardrail verification.",
        "The verifier is trusted evaluation code. Keep it outside agent-editable paths or separately detect test and evaluator changes.",
      ],
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 2 });
  }
}

async function evaluateAttempt(input: {
  directory: string;
  adapter: EvaluationAdapter;
  environment: NodeJS.ProcessEnv;
  label: string;
}): Promise<EvaluationAttempt> {
  const agent = await runCommand(input.adapter.agent, input.directory, input.environment, input.adapter.timeoutMs);
  if (agent.spawnError) throw new Error(`${input.label} agent could not run. ${agent.spawnError}`);
  if (agent.outputExceeded) {
    throw new Error(`${input.label} agent exceeded the ${MAX_COMMAND_OUTPUT}-byte output limit; no result was recorded.`);
  }
  const verification = await runCommand(input.adapter.verify, input.directory, input.environment, input.adapter.timeoutMs);
  assertConclusive(verification, `${input.label} post-agent verification`);
  return {
    agent: publicObservation(agent),
    verification: publicObservation(verification),
    succeeded: agent.succeeded && verification.succeeded,
  };
}

async function readAdapter(path: string): Promise<{ adapter: EvaluationAdapter; contentHash: string }> {
  const info = await stat(path);
  if (!info.isFile()) throw new Error(`Evaluation adapter is not a regular file: ${path}`);
  if (info.size > MAX_ADAPTER_BYTES) throw new Error(`Evaluation adapter exceeds ${MAX_ADAPTER_BYTES} bytes.`);
  let value: unknown;
  try {
    const contents = await readFile(path, "utf8");
    value = JSON.parse(contents);
    const parsed = EvaluationAdapterSchema.safeParse(value);
    if (!parsed.success) {
      throw new Error(`Invalid evaluation adapter: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
    }
    return { adapter: parsed.data, contentHash: createHash("sha256").update(contents).digest("hex") };
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Invalid evaluation adapter JSON: ${error.message}`);
    throw error;
  }
}

async function cloneAt(
  source: string,
  sha: string,
  parent: string,
  name: string,
  environment: NodeJS.ProcessEnv,
): Promise<string> {
  if (!/^[a-f0-9]{40,64}$/.test(sha)) throw new Error(`Refusing to clone an invalid verified commit id: ${sha}`);
  const destination = join(parent, name);
  await runGit(["clone", "--quiet", "--no-hardlinks", "--no-checkout", "--", source, destination], dirname(destination), environment);
  await runGit(["-C", destination, "-c", "core.hooksPath=/dev/null", "checkout", "--quiet", "--detach", sha, "--"], parent, environment);
  return destination;
}

async function runGit(args: string[], cwd: string, environment: NodeJS.ProcessEnv): Promise<void> {
  const result = await runRaw("git", args, cwd, environment, GIT_TIMEOUT_MS, GIT_MAX_OUTPUT);
  if (!result.succeeded) {
    const detail = result.stderr.trim().slice(0, 1_000) || result.spawnError || `exit ${result.exitCode ?? "unknown"}`;
    throw new Error(`Could not prepare isolated evaluation checkout: ${detail}`);
  }
}

async function runCommand(
  command: CommandSpec,
  cwd: string,
  environment: NodeJS.ProcessEnv,
  timeoutMs: number,
): Promise<InternalProcessObservation> {
  return runRaw(command.command, command.args, cwd, environment, timeoutMs, MAX_COMMAND_OUTPUT);
}

async function runRaw(
  command: string,
  args: readonly string[],
  cwd: string,
  environment: NodeJS.ProcessEnv,
  timeoutMs: number,
  maxBuffer: number,
): Promise<InternalProcessObservation> {
  const started = performance.now();
  return new Promise((resolveResult) => {
    let timedOut = false;
    let outputExceeded = false;
    let spawnError: string | null = null;
    let stdoutBytes = 0;
    let stderrBytes = 0;
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const child = spawn(command, [...args], {
      cwd,
      env: environment,
      detached: process.platform !== "win32",
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const capture = (target: Buffer[], chunk: Buffer, stream: "stdout" | "stderr") => {
      if (stream === "stdout") stdoutBytes += chunk.length;
      else stderrBytes += chunk.length;
      const capturedBytes = target.reduce((total, item) => total + item.length, 0);
      if (capturedBytes < maxBuffer) target.push(chunk.subarray(0, maxBuffer - capturedBytes));
      if (stdoutBytes + stderrBytes > maxBuffer && !outputExceeded) {
        outputExceeded = true;
        killProcessTree(child.pid);
      }
    };
    child.stdout.on("data", (chunk: Buffer) => capture(stdoutChunks, chunk, "stdout"));
    child.stderr.on("data", (chunk: Buffer) => capture(stderrChunks, chunk, "stderr"));
    child.on("error", (error: NodeJS.ErrnoException) => {
      spawnError = error.code === "ENOENT" ? `Command not found: ${command}` : error.message;
    });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timeout);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      resolveResult({
        exitCode,
        signal,
        timedOut,
        durationMs: Math.max(0, Math.round(performance.now() - started)),
        stdoutBytes,
        stderrBytes,
        succeeded: !spawnError && !timedOut && !outputExceeded && exitCode === 0 && signal === null,
        stdout,
        stderr,
        outputExceeded,
        spawnError,
      });
    });
    const timeout = setTimeout(() => {
      timedOut = true;
      killProcessTree(child.pid);
    }, timeoutMs);
    timeout.unref();
  });
}

function killProcessTree(pid: number | undefined): void {
  if (!pid) return;
  if (process.platform === "win32") {
    const terminator = spawn("taskkill", ["/pid", String(pid), "/t", "/f"], {
      windowsHide: true,
      shell: false,
      stdio: "ignore",
    });
    terminator.unref();
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // The process may have exited between the timeout and termination.
      }
    }
  }
}

function assertConclusive(result: InternalProcessObservation, label: string): void {
  if (result.spawnError) throw new Error(`${label} could not run. ${result.spawnError}`);
  if (result.timedOut) throw new Error(`${label} timed out; no result was recorded.`);
  if (result.outputExceeded) throw new Error(`${label} exceeded the ${MAX_COMMAND_OUTPUT}-byte output limit; no result was recorded.`);
  if (result.signal || result.exitCode === null) {
    throw new Error(`${label} terminated abnormally${result.signal ? ` with signal ${result.signal}` : ""}; no result was recorded.`);
  }
}

function assertExpectedBrokenFailure(
  result: InternalProcessObservation,
  label: string,
  expectedFailureCodes: readonly number[],
): void {
  assertConclusive(result, label);
  if (result.exitCode === 0) {
    throw new Error(`${label} already passes on the broken revision; the paired replay is invalid.`);
  }
  if (!expectedFailureCodes.includes(result.exitCode!)) {
    throw new Error(
      `${label} must use a configured expected failure code (${expectedFailureCodes.join(", ")}); received ${result.exitCode}.`,
    );
  }
}

function publicObservation(result: InternalProcessObservation): ProcessObservation {
  return {
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    durationMs: result.durationMs,
    stdoutBytes: result.stdoutBytes,
    stderrBytes: result.stderrBytes,
    succeeded: result.succeeded,
  };
}

function inheritedEnvironment(allowedNames: readonly string[]): NodeJS.ProcessEnv {
  const names = new Set(["PATH", "HOME", ...allowedNames]);
  const environment: NodeJS.ProcessEnv = {};
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined) environment[name] = value;
  }
  return environment;
}

function renderVerifiedContext(
  failureCase: Awaited<ReturnType<typeof explainCase>>["stored"]["case"],
  brokenSha: string,
  fixedSha: string,
): string {
  const lines = [
    "# Project Spine verified guidance",
    "",
    `Case: ${failureCase.id}`,
    `Source: ${failureCase.source.url ?? failureCase.source.kind}`,
    `Deterministic replay: ${brokenSha} failed; ${fixedSha} passed.`,
    "",
  ];
  for (const rule of failureCase.rules) {
    lines.push(
      `## ${rule.description}`,
      "",
      `Rule: ${rule.kind}`,
      `Files: ${rule.files.join(", ")}`,
      "Literal:",
      "```text",
      rule.text,
      "```",
      "",
    );
  }
  return lines.join("\n");
}
