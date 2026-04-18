import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile, chmod, unlink, access } from "node:fs/promises";
import { z } from "zod";

const CONFIG_VERSION = 1;

const Config = z.object({
  version: z.literal(CONFIG_VERSION).default(CONFIG_VERSION),
  apiUrl: z.string().url().default("https://projectspine.dev"),
  auth: z
    .object({
      token: z.string(),
      userId: z.string().optional(),
      githubLogin: z.string().optional(),
      issuedAt: z.string().optional(),
    })
    .nullable()
    .default(null),
  activeWorkspace: z.string().nullable().default(null),
});

export type Config = z.infer<typeof Config>;

export function configDir(): string {
  return join(homedir(), ".project-spine");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

const EMPTY: Config = {
  version: CONFIG_VERSION,
  apiUrl: "https://projectspine.dev",
  auth: null,
  activeWorkspace: null,
};

export async function readConfig(): Promise<Config> {
  try {
    const raw = await readFile(configPath(), "utf8");
    const parsed = Config.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY;
    return parsed.data;
  } catch {
    return EMPTY;
  }
}

export async function writeConfig(cfg: Config): Promise<void> {
  await mkdir(configDir(), { recursive: true });
  const path = configPath();
  await writeFile(path, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  // Restrict to user-only since this holds a bearer token.
  try {
    await chmod(path, 0o600);
  } catch {
    // not fatal on Windows / non-POSIX FS
  }
}

/** Return `apiUrl` with env override applied (SPINE_API_URL beats stored value). */
export function resolveApiUrl(cfg: Config): string {
  const override = process.env["SPINE_API_URL"];
  if (override && /^https?:\/\//.test(override)) return override.replace(/\/$/, "");
  return cfg.apiUrl.replace(/\/$/, "");
}

/** Return the effective bearer token — SPINE_API_TOKEN env beats stored config. */
export function resolveToken(cfg: Config): string | null {
  const envToken = process.env["SPINE_API_TOKEN"];
  if (envToken && envToken.trim().length > 0) return envToken.trim();
  return cfg.auth?.token ?? null;
}

/** Return the effective active workspace — SPINE_WORKSPACE env beats stored config. */
export function resolveActiveWorkspace(cfg: Config): string | null {
  const envWs = process.env["SPINE_WORKSPACE"];
  if (envWs && envWs.trim().length > 0) return envWs.trim();
  return cfg.activeWorkspace;
}

export async function clearAuth(): Promise<void> {
  const cfg = await readConfig();
  await writeConfig({ ...cfg, auth: null, activeWorkspace: null });
}

export async function deleteConfig(): Promise<void> {
  try {
    await unlink(configPath());
  } catch {
    // already gone
  }
}

export async function configExists(): Promise<boolean> {
  try {
    await access(configPath());
    return true;
  } catch {
    return false;
  }
}
