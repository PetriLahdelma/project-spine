import { app, BrowserWindow, dialog, ipcMain, shell, type OpenDialogOptions } from "electron";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  parseCompileRequest,
  parseDoctorRequest,
  parseOpenPathRequest,
  parseSelectPathRequest,
  parseTemplateListRequest,
  type CliStatus,
  type CompileRequest,
  type RunResult,
} from "./contracts";

const DESKTOP_ROOT = resolve(__dirname, "..");
const PROJECT_ROOT = resolve(DESKTOP_ROOT, "..", "..");
const LOCAL_CLI_PATH = resolve(PROJECT_ROOT, "dist", "cli.js");
const RENDERER_PATH = resolve(__dirname, "renderer", "index.html");
const PRELOAD_PATH = resolve(__dirname, "preload.js");

let mainWindow: BrowserWindow | null = null;

function resolveCliStatus(): CliStatus {
  const envCli = process.env.PROJECT_SPINE_CLI?.trim();
  if (envCli) {
    return {
      source: "env",
      command: envCli,
      argsPrefix: [],
      projectRoot: PROJECT_ROOT,
      cliPath: envCli,
    };
  }

  if (existsSync(LOCAL_CLI_PATH)) {
    return {
      source: "local-dist",
      command: process.execPath,
      argsPrefix: [LOCAL_CLI_PATH],
      projectRoot: PROJECT_ROOT,
      cliPath: LOCAL_CLI_PATH,
    };
  }

  return {
    source: "path",
    command: "spine",
    argsPrefix: [],
    projectRoot: PROJECT_ROOT,
  };
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 860,
    minHeight: 620,
    title: "Project Spine",
    backgroundColor: "#f7f8f6",
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = window;
  const rendererUrl = pathToFileURL(RENDERER_PATH).toString();

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith(rendererUrl)) return;
    event.preventDefault();
    if (isExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });

  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  window.loadFile(RENDERER_PATH).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox("Project Spine", message);
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle("spine:status", () => resolveCliStatus());

  ipcMain.handle("paths:select", async (event, rawRequest: unknown): Promise<string | null> => {
    const request = parseSelectPathRequest(rawRequest);
    const parent = BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
    const properties: OpenDialogOptions["properties"] = request.kind === "directory" ? ["openDirectory"] : ["openFile"];
    const options: OpenDialogOptions =
      request.title === undefined ? { properties } : { title: request.title, properties };
    const result = parent === null ? await dialog.showOpenDialog(options) : await dialog.showOpenDialog(parent, options);
    if (result.canceled) return null;
    return result.filePaths[0] ?? null;
  });

  ipcMain.handle("paths:open", async (_event, rawRequest: unknown) => {
    const request = parseOpenPathRequest(rawRequest);
    const targetPath = request.base === undefined ? resolve(request.path) : resolve(request.base, request.path);
    const error = await shell.openPath(targetPath);
    return error.length === 0 ? { ok: true } : { ok: false, error };
  });

  ipcMain.handle("spine:doctor", async (_event, rawRequest: unknown): Promise<RunResult> => {
    const request = parseDoctorRequest(rawRequest);
    const repo = resolve(request.repo);
    return runSpine(["doctor", "--repo", repo], repo);
  });

  ipcMain.handle("spine:templates", async (_event, rawRequest: unknown): Promise<RunResult> => {
    const request = parseTemplateListRequest(rawRequest);
    const cwd = request.repo === undefined ? PROJECT_ROOT : resolve(request.repo);
    return runSpine(["template", "list"], cwd);
  });

  ipcMain.handle("spine:compile", async (_event, rawRequest: unknown): Promise<RunResult> => {
    const request = parseCompileRequest(rawRequest);
    return runCompile(request);
  });
}

function runCompile(request: CompileRequest): Promise<RunResult> {
  const repo = resolve(request.repo);
  const args = ["compile", "--brief", resolve(repo, request.brief), "--repo", repo];
  appendPathOption(args, "--design", request.design, repo);
  appendPathOption(args, "--tokens", request.tokens, repo);
  appendOption(args, "--template", request.template);
  appendOption(args, "--out", request.out);
  appendOption(args, "--fail-on", request.failOn);
  return runSpine(args, repo);
}

function appendPathOption(args: string[], flag: string, value: string | undefined, base: string): void {
  if (value === undefined) return;
  args.push(flag, resolve(base, value));
}

function appendOption(args: string[], flag: string, value: string | undefined): void {
  if (value === undefined) return;
  args.push(flag, value);
}

function runSpine(args: string[], cwd: string): Promise<RunResult> {
  const startedAt = Date.now();
  const cli = resolveCliStatus();
  const commandArgs = [...cli.argsPrefix, ...args];
  const displayCommand = formatCommand(cli.command, commandArgs);

  return new Promise((resolveResult) => {
    let settled = false;
    const child = spawn(cli.command, commandArgs, {
      cwd,
      env: {
        ...process.env,
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      },
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      resolveResult({
        ok: false,
        code: null,
        signal: null,
        stdout,
        stderr: stderr.length > 0 ? `${stderr}\n${error.message}` : error.message,
        command: displayCommand,
        durationMs: Date.now() - startedAt,
      });
    });

    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      resolveResult({
        ok: code === 0,
        code,
        signal,
        stdout,
        stderr,
        command: displayCommand,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].map(quoteArg).join(" ");
}

function quoteArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function isExternalUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://");
}

registerIpcHandlers();

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
