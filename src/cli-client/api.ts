import { readConfig, resolveApiUrl, resolveToken, type Config } from "./config.js";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  token?: string | null;
  /** Don't throw on this status. Useful for the /poll endpoint's 202. */
  acceptStatus?: number[];
  timeoutMs?: number;
};

/**
 * Minimal HTTP client for the hosted API. Bearer comes from explicit param
 * or falls back to the stored config. `SPINE_API_URL` env overrides the URL.
 */
export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<{ status: number; body: T }> {
  const cfg = await readConfig();
  return apiFetchWithConfig<T>(cfg, path, opts);
}

export async function apiFetchWithConfig<T = unknown>(
  cfg: Config,
  path: string,
  opts: ApiOptions = {},
): Promise<{ status: number; body: T }> {
  const base = resolveApiUrl(cfg);
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers: Record<string, string> = {
    "User-Agent": `project-spine-cli/${process.env["npm_package_version"] ?? "0.4.0"}`,
    Accept: "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = opts.token === undefined ? resolveToken(cfg) : opts.token;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  let res: Response;
  try {
    const init: RequestInit = {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      signal: controller.signal,
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
    res = await fetch(url, init);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(`request timed out: ${url}`, 0, null);
    }
    throw new ApiError(`network error: ${(err as Error).message}`, 0, null);
  }
  clearTimeout(timeout);

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let body: unknown = text;
  if (contentType.includes("application/json") && text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      // fall through as text
    }
  }

  const accepted = opts.acceptStatus ?? [];
  if (!res.ok && !accepted.includes(res.status)) {
    const message = typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `${res.status} ${res.statusText}`;
    throw new ApiError(message, res.status, body);
  }

  return { status: res.status, body: body as T };
}
