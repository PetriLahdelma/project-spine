import { randomBytes } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HARNESS_SHA256, HARNESS_SOURCE, parseHarnessResult } from "./harness.js";
import type { TestOutcome } from "./model.js";
import { resolveTrustedExecutable, scrubbedToolEnvironment } from "./executable.js";

const execFileAsync = promisify(execFile);
const OUTPUT_LIMIT = 1024 * 1024;
const TIMEOUT_MS = 30_000;

export type DockerRuntime = { imageReference: string; imageId: string; platform: string; harnessSha256: string; executionUid: number; executionGid: number };
type ImageInspection = { Id?: string; RepoDigests?: string[]; Os?: string; Architecture?: string; Config?: { Volumes?: Record<string, unknown> | null } };
export type DockerRemovalCommand = (args: string[]) => Promise<void>;

export async function removeContainerStrict(name: string, command: DockerRemovalCommand): Promise<void> {
  try {
    await command(["rm", "-fv", name]);
  } catch (error) {
    const stderr = typeof (error as { stderr?: unknown }).stderr === "string" ? (error as { stderr: string }).stderr.trim() : "";
    if (stderr === `Error response from daemon: No such container: ${name}`) return;
    throw new Error(`Failed to remove isolated correction container ${name}`, { cause: error });
  }
}

export function validateImageInspection(image: string, item: ImageInspection | undefined, uid: number, gid: number): DockerRuntime {
  if (!item?.Id?.startsWith("sha256:") || !item.RepoDigests?.includes(image) || !item.Os || !item.Architecture) throw new Error("Pinned correction image is unavailable locally or does not match its repository digest");
  if (item.Config?.Volumes && Object.keys(item.Config.Volumes).length > 0) throw new Error("Pinned correction image declares writable volumes and cannot be used");
  return { imageReference: image, imageId: item.Id, platform: `${item.Os}/${item.Architecture}`, harnessSha256: HARNESS_SHA256, executionUid: uid, executionGid: gid };
}

async function localDockerEnvironment(forbiddenRoots: string[]): Promise<{ env: NodeJS.ProcessEnv; docker: string }> {
  for (const key of ["DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) {
    if (process.env[key]) throw new Error(`${key} is not allowed for correction execution`);
  }
  const docker = await resolveTrustedExecutable("docker", [...forbiddenRoots, process.cwd()]);
  const baseEnv = scrubbedToolEnvironment();
  const { stdout } = await execFileAsync(docker, ["context", "show"], { encoding: "utf8", timeout: 10_000, env: baseEnv });
  const context = stdout.trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(context)) throw new Error("Docker returned an invalid context name");
  const env: NodeJS.ProcessEnv = { ...baseEnv, DOCKER_CONTEXT: context };
  const inspected = await execFileAsync(docker, ["context", "inspect", context], { encoding: "utf8", timeout: 10_000, maxBuffer: 1024 * 1024, env });
  const parsed = JSON.parse(inspected.stdout) as Array<{ Endpoints?: { docker?: { Host?: string } } }>;
  if (!parsed[0]?.Endpoints?.docker?.Host?.startsWith("unix://")) throw new Error("Correction execution requires a local Unix-socket Docker context");
  return { env, docker };
}

async function inspectImage(image: string, docker: string, env: NodeJS.ProcessEnv, uid: number, gid: number): Promise<DockerRuntime> {
  const { stdout } = await execFileAsync(docker, ["image", "inspect", image], { encoding: "utf8", timeout: 10_000, maxBuffer: 2 * 1024 * 1024, env });
  const parsed = JSON.parse(stdout) as ImageInspection[];
  return validateImageInspection(image, parsed[0], uid, gid);
}

async function inspectContainer(name: string, docker: string, env: NodeJS.ProcessEnv): Promise<{ exitCode: number; oomKilled: boolean; error: string; status: string }> {
  const { stdout } = await execFileAsync(docker, ["inspect", name], { encoding: "utf8", timeout: 10_000, maxBuffer: 1024 * 1024, env });
  const parsed = JSON.parse(stdout) as Array<{ State?: { ExitCode?: number; OOMKilled?: boolean; Error?: string; Status?: string } }>;
  const state = parsed[0]?.State;
  if (!state || typeof state.ExitCode !== "number" || typeof state.OOMKilled !== "boolean" || typeof state.Error !== "string" || typeof state.Status !== "string") throw new Error("Docker returned an invalid container state");
  return { exitCode: state.ExitCode, oomKilled: state.OOMKilled, error: state.Error, status: state.Status };
}

export function buildDockerRunArgs(options: { image: string; snapshot: string; testPath: string; name: string; harnessDirectory: string; uid: number; gid: number }): string[] {
  return [
    "run", "--name", options.name, "--pull=never", "--network=none", "--read-only",
    "--user", `${options.uid}:${options.gid}`, "--cap-drop=ALL", "--security-opt=no-new-privileges",
    "--cpus=1", "--memory=256m", "--memory-swap=256m", "--pids-limit=64", "--ulimit", "nofile=64:64", "--stop-timeout=1",
    "--mount", `type=bind,src=${options.snapshot},dst=/workspace,readonly`, "--workdir", "/workspace",
    "--mount", `type=bind,src=${options.harnessDirectory},dst=/.spine-harness,readonly`,
    options.image, "node", "/.spine-harness/runner.mjs", `/workspace/${options.testPath}`,
  ];
}

export async function runNodeTestInDocker(options: { image: string; snapshot: string; testPath: string; revision: TestOutcome["revision"]; forbiddenRoots: string[] }): Promise<{ outcome: Omit<TestOutcome, "snapshot">; runtime: DockerRuntime }> {
  const uid = process.getuid?.();
  const gid = process.getgid?.();
  if (!uid || uid === 0 || gid === undefined) throw new Error("Correction execution requires a non-root numeric host UID/GID");
  const { env, docker } = await localDockerEnvironment(options.forbiddenRoots);
  const runtime = await inspectImage(options.image, docker, env, uid, gid);
  const name = `spine-correction-${randomBytes(8).toString("hex")}`;
  const harnessDirectory = await mkdtemp(join(tmpdir(), "spine-harness-"));
  await chmod(harnessDirectory, 0o700);
  await writeFile(join(harnessDirectory, "runner.mjs"), HARNESS_SOURCE, { mode: 0o600 });
  const args = buildDockerRunArgs({ ...options, name, harnessDirectory, uid, gid });
  let timedOut = false;
  let overflow = false;
  const removeContainer = () => removeContainerStrict(name, async (args) => {
    await execFileAsync(docker, args, { timeout: 10_000, env });
  });
  try {
    const execution = await new Promise<{ code: number; stdout: string }>((resolve, reject) => {
      const child = spawn(docker, args, { shell: false, stdio: ["ignore", "pipe", "pipe"], env });
      const stdout: Buffer[] = [];
      let bytes = 0;
      const stop = () => { child.kill("SIGKILL"); };
      const timer = setTimeout(() => { timedOut = true; stop(); }, TIMEOUT_MS);
      child.stdout.on("data", (chunk: Buffer) => { bytes += chunk.length; if (bytes > OUTPUT_LIMIT) { overflow = true; stop(); } else stdout.push(chunk); });
      child.stderr.on("data", (chunk: Buffer) => { bytes += chunk.length; if (bytes > OUTPUT_LIMIT) { overflow = true; stop(); } });
      child.on("error", reject);
      child.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? 128, stdout: Buffer.concat(stdout).toString("utf8") }); });
    });
    if (timedOut) throw new Error(`Correction test timed out after ${TIMEOUT_MS}ms`);
    if (overflow) throw new Error(`Correction test output exceeded ${OUTPUT_LIMIT} bytes`);
    const state = await inspectContainer(name, docker, env);
    if (state.status !== "exited" || state.oomKilled || state.error || state.exitCode !== execution.code || state.exitCode >= 125) throw new Error("Correction container failed outside the reviewed test assertion path");
    const result = parseHarnessResult(execution.stdout);
    if (result.outputOverflow) throw new Error(`Correction test output exceeded ${OUTPUT_LIMIT} bytes`);
    const value = {
      runtime,
      outcome: {
        revision: options.revision, exitCode: execution.code, tests: result.tests, passed: result.passed,
        failed: result.failed, skipped: result.skipped, todo: result.todo, assertionFailures: result.assertionFailures,
        infrastructureFailures: result.infrastructureFailures, otherFailures: result.otherFailures, testIds: result.testIds,
      },
    };
    return value;
  } finally {
    let cleanupError: unknown;
    try {
      await removeContainer();
    } catch (error) {
      cleanupError = error;
    }
    try {
      await rm(harnessDirectory, { recursive: true, force: true });
    } catch (error) {
      cleanupError ??= error;
    }
    if (cleanupError) throw new Error("Isolated correction container cleanup failed", { cause: cleanupError });
  }
}

export function assertBrokenControl(outcome: TestOutcome): void {
  if (outcome.exitCode === 0 || outcome.tests < 1 || outcome.failed < 1 || outcome.assertionFailures < 1 || outcome.assertionFailures !== outcome.failed || outcome.infrastructureFailures !== 0 || outcome.otherFailures !== 0 || outcome.skipped !== 0 || outcome.todo !== 0) {
    throw new Error(`Broken control must execute expected node:test assertions that fail, without skips, todos, crashes, or harness errors (exit=${outcome.exitCode}, tests=${outcome.tests}, failed=${outcome.failed}, assertions=${outcome.assertionFailures}, infrastructure=${outcome.infrastructureFailures}, other=${outcome.otherFailures}, skipped=${outcome.skipped}, todo=${outcome.todo})`);
  }
}

export function assertPassingOutcome(outcome: TestOutcome, label: string): void {
  if (outcome.exitCode !== 0 || outcome.tests < 1 || outcome.passed < 1 || outcome.failed !== 0 || outcome.skipped !== 0 || outcome.todo !== 0 || outcome.infrastructureFailures !== 0 || outcome.otherFailures !== 0) {
    throw new Error(`${label} must execute at least one passing test without failures, skips, todos, or harness errors`);
  }
}
