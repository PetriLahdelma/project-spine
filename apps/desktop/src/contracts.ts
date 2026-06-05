export type CliSource = "env" | "local-dist" | "path";
export type FailOn = "never" | "info" | "warn" | "error";
export type PathKind = "directory" | "file";

export type CliStatus = {
  source: CliSource;
  command: string;
  argsPrefix: string[];
  projectRoot: string;
  cliPath?: string;
};

export type RunResult = {
  ok: boolean;
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  command: string;
  durationMs: number;
};

export type SelectPathRequest = {
  kind: PathKind;
  title?: string;
};

export type DoctorRequest = {
  repo: string;
};

export type TemplateListRequest = {
  repo?: string;
};

export type CompileRequest = {
  repo: string;
  brief: string;
  design?: string;
  tokens?: string;
  template?: string;
  out?: string;
  failOn?: FailOn;
};

export type OpenPathRequest = {
  path: string;
  base?: string;
};

export type OpenPathResult = {
  ok: boolean;
  error?: string;
};

export type ProjectSpineApi = {
  getStatus: () => Promise<CliStatus>;
  selectPath: (request: SelectPathRequest) => Promise<string | null>;
  runDoctor: (request: DoctorRequest) => Promise<RunResult>;
  runCompile: (request: CompileRequest) => Promise<RunResult>;
  listTemplates: (request?: TemplateListRequest) => Promise<RunResult>;
  openPath: (request: OpenPathRequest) => Promise<OpenPathResult>;
};

const FAIL_ON_VALUES: readonly FailOn[] = ["never", "info", "warn", "error"];
const PATH_KINDS: readonly PathKind[] = ["directory", "file"];

export function parseSelectPathRequest(value: unknown): SelectPathRequest {
  const record = requireRecord(value, "path selection request");
  const kind = requireEnum(record, "kind", PATH_KINDS);
  const title = optionalNonEmptyString(record, "title");
  return title === undefined ? { kind } : { kind, title };
}

export function parseDoctorRequest(value: unknown): DoctorRequest {
  const record = requireRecord(value, "doctor request");
  return { repo: requireNonEmptyString(record, "repo") };
}

export function parseTemplateListRequest(value: unknown): TemplateListRequest {
  if (value === undefined || value === null) return {};
  const record = requireRecord(value, "template list request");
  const repo = optionalNonEmptyString(record, "repo");
  return repo === undefined ? {} : { repo };
}

export function parseCompileRequest(value: unknown): CompileRequest {
  const record = requireRecord(value, "compile request");
  const repo = requireNonEmptyString(record, "repo");
  const brief = requireNonEmptyString(record, "brief");
  const design = optionalNonEmptyString(record, "design");
  const tokens = optionalNonEmptyString(record, "tokens");
  const template = optionalNonEmptyString(record, "template");
  const out = optionalNonEmptyString(record, "out");
  const failOn = optionalEnum(record, "failOn", FAIL_ON_VALUES);
  return {
    repo,
    brief,
    ...(design !== undefined && { design }),
    ...(tokens !== undefined && { tokens }),
    ...(template !== undefined && { template }),
    ...(out !== undefined && { out }),
    ...(failOn !== undefined && { failOn }),
  };
}

export function parseOpenPathRequest(value: unknown): OpenPathRequest {
  const record = requireRecord(value, "open path request");
  const path = requireNonEmptyString(record, "path");
  const base = optionalNonEmptyString(record, "base");
  return base === undefined ? { path } : { path, base };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`invalid ${label}`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(record: Record<string, unknown>, key: string): string {
  const value = optionalNonEmptyString(record, key);
  if (value === undefined) throw new Error(`missing ${key}`);
  return value;
}

function optionalNonEmptyString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireEnum<T extends string>(record: Record<string, unknown>, key: string, allowed: readonly T[]): T {
  const value = optionalEnum(record, key, allowed);
  if (value === undefined) throw new Error(`missing ${key}`);
  return value;
}

function optionalEnum<T extends string>(record: Record<string, unknown>, key: string, allowed: readonly T[]): T | undefined {
  const value = optionalNonEmptyString(record, key);
  if (value === undefined) return undefined;
  if (!allowed.includes(value as T)) {
    throw new Error(`${key} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}
