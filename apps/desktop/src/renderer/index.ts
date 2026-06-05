type CliStatus = {
  source: "env" | "local-dist" | "path";
  command: string;
  argsPrefix: string[];
  projectRoot: string;
  cliPath?: string;
};

type RunResult = {
  ok: boolean;
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  command: string;
  durationMs: number;
};

type ProjectSpineApi = {
  getStatus: () => Promise<CliStatus>;
  selectPath: (request: { kind: "directory" | "file"; title?: string }) => Promise<string | null>;
  runDoctor: (request: { repo: string }) => Promise<RunResult>;
  runCompile: (request: {
    repo: string;
    brief: string;
    design?: string;
    tokens?: string;
    template?: string;
    out?: string;
    failOn?: "never" | "info" | "warn" | "error";
  }) => Promise<RunResult>;
  listTemplates: (request?: { repo?: string }) => Promise<RunResult>;
  openPath: (request: { path: string; base?: string }) => Promise<{ ok: boolean; error?: string }>;
};

const repoInput = requiredElement<HTMLInputElement>("repo-path");
const briefInput = requiredElement<HTMLInputElement>("brief-path");
const designInput = requiredElement<HTMLInputElement>("design-path");
const tokensInput = requiredElement<HTMLInputElement>("tokens-path");
const templateInput = requiredElement<HTMLInputElement>("template");
const failOnSelect = requiredElement<HTMLSelectElement>("fail-on");
const outInput = requiredElement<HTMLInputElement>("out-path");
const statusText = requiredElement<HTMLElement>("status-text");
const cliSource = requiredElement<HTMLElement>("cli-source");
const output = requiredElement<HTMLElement>("command-output");
const commandMeta = requiredElement<HTMLElement>("command-meta");
const openOutputButton = requiredElement<HTMLButtonElement>("open-output");
const doctorButton = requiredElement<HTMLButtonElement>("doctor");
const templateButton = requiredElement<HTMLButtonElement>("templates");
const compileForm = requiredElement<HTMLFormElement>("compile-form");

const api = (window as Window & { projectSpine?: ProjectSpineApi }).projectSpine;
if (api === undefined) {
  cliSource.textContent = "preload unavailable";
  setStatus("fail", "Electron bridge unavailable");
  for (const button of document.querySelectorAll("button")) {
    button.disabled = true;
  }
} else {
  bindPathButton(api, "choose-repo", repoInput, "directory", "Choose repo root", () => {
    if (briefInput.value.trim().length === 0) {
      briefInput.value = `${trimTrailingSlash(repoInput.value)}/brief.md`;
    }
  });
  bindPathButton(api, "choose-brief", briefInput, "file", "Choose brief.md");
  bindPathButton(api, "choose-design", designInput, "file", "Choose design-rules.md");
  bindPathButton(api, "choose-tokens", tokensInput, "file", "Choose tokens JSON");

  doctorButton.addEventListener("click", () => {
    void runWithButton(doctorButton, async () => {
      const result = await api.runDoctor({ repo: repoInput.value });
      renderResult("doctor", result);
    });
  });

  templateButton.addEventListener("click", () => {
    void runWithButton(templateButton, async () => {
      const result = await api.listTemplates({ repo: repoInput.value });
      renderResult("template list", result);
    });
  });

  compileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void runWithButton(requiredElement<HTMLButtonElement>("compile"), async () => {
      const design = optionalValue(designInput);
      const tokens = optionalValue(tokensInput);
      const template = optionalValue(templateInput);
      const out = optionalValue(outInput);
      const failOn = normalizeFailOn(failOnSelect.value);
      const result = await api.runCompile({
        repo: repoInput.value,
        brief: briefInput.value,
        ...(design !== undefined && { design }),
        ...(tokens !== undefined && { tokens }),
        ...(template !== undefined && { template }),
        ...(out !== undefined && { out }),
        failOn,
      });
      renderResult("compile", result);
    });
  });

  openOutputButton.addEventListener("click", () => {
    const repo = repoInput.value.trim();
    const out = outInput.value.trim() || ".project-spine";
    if (repo.length === 0) {
      setStatus("warn", "Choose a repo first.");
      return;
    }
    void api.openPath({ base: repo, path: out }).then((result) => {
      if (!result.ok) setStatus("warn", result.error ?? "Could not open output path.");
    });
  });

  void api.getStatus().then(renderCliStatus).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    setStatus("fail", message);
  });
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing #${id}`);
  return element as T;
}

function bindPathButton(
  api: ProjectSpineApi,
  buttonId: string,
  target: HTMLInputElement,
  kind: "directory" | "file",
  title: string,
  afterSelect?: () => void
): void {
  const button = requiredElement<HTMLButtonElement>(buttonId);
  button.addEventListener("click", () => {
    void runWithButton(button, async () => {
      const selected = await api.selectPath({ kind, title });
      if (selected === null) return;
      target.value = selected;
      afterSelect?.();
    });
  });
}

async function runWithButton(button: HTMLButtonElement, task: () => Promise<void>): Promise<void> {
  button.disabled = true;
  try {
    await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus("fail", message);
  } finally {
    button.disabled = false;
  }
}

function renderCliStatus(status: CliStatus): void {
  const sourceLabels: Record<CliStatus["source"], string> = {
    env: "PROJECT_SPINE_CLI",
    "local-dist": "local dist",
    path: "PATH",
  };
  if (repoInput.value.trim().length === 0) {
    repoInput.value = status.projectRoot;
  }
  if (briefInput.value.trim().length === 0) {
    briefInput.value = `${trimTrailingSlash(status.projectRoot)}/brief.md`;
  }
  cliSource.textContent = `${sourceLabels[status.source]}: ${status.cliPath ?? status.command}`;
  setStatus("pass", "Ready");
}

function renderResult(label: string, result: RunResult): void {
  const status = result.ok ? "pass" : "fail";
  setStatus(status, result.ok ? `${label} finished` : `${label} failed`);
  commandMeta.textContent = `${result.command} (${result.durationMs} ms)`;
  output.textContent = [result.stdout.trim(), result.stderr.trim()].filter((part) => part.length > 0).join("\n\n");
  if (output.textContent.length === 0) output.textContent = "(no output)";
}

function setStatus(status: "pass" | "warn" | "fail", message: string): void {
  statusText.dataset.status = status;
  statusText.textContent = message;
}

function optionalValue(input: HTMLInputElement): string | undefined {
  const value = input.value.trim();
  return value.length === 0 ? undefined : value;
}

function normalizeFailOn(value: string): "never" | "info" | "warn" | "error" {
  switch (value) {
    case "info":
    case "warn":
    case "error":
    case "never":
      return value;
    default:
      return "never";
  }
}

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}
