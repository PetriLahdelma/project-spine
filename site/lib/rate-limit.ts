import { sql } from "drizzle-orm";
import { db } from "@/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInMs: number;
};

export type RateLimitParams = {
  /** Caller-defined key. Include the route and the caller identifier, e.g. `auth:device:1.2.3.4`. */
  key: string;
  /** Maximum requests allowed per window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
};

/**
 * Fixed-window rate limit backed by Postgres. Atomic via UPSERT so two
 * concurrent callers can't both sneak past the threshold.
 *
 * The window restarts when `NOW() - window_start >= windowMs`; we rewrite
 * the row in that case with count=1. Otherwise we increment.
 *
 * Failure-safe: if the DB is unavailable, we fail open (log + allow). Rate
 * limits are a defense-in-depth measure; we do not want a DB blip to take
 * down auth entirely.
 */
export async function rateLimit(params: RateLimitParams): Promise<RateLimitResult> {
  const { key, limit, windowMs } = params;
  try {
    const rows = await db.execute(sql`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, NOW(), 1)
      ON CONFLICT (key) DO UPDATE SET
        window_start = CASE
          WHEN rate_limits.window_start < NOW() - (${windowMs} || ' milliseconds')::interval
            THEN NOW()
          ELSE rate_limits.window_start
        END,
        count = CASE
          WHEN rate_limits.window_start < NOW() - (${windowMs} || ' milliseconds')::interval
            THEN 1
          ELSE rate_limits.count + 1
        END
      RETURNING count, window_start
    `);

    const row = (rows.rows ?? rows)[0] as { count: number; window_start: string } | undefined;
    if (!row) return failOpen(limit, windowMs);

    const count = Number(row.count);
    const windowStartMs = new Date(row.window_start).getTime();
    const resetInMs = Math.max(0, windowStartMs + windowMs - Date.now());
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    return { allowed, remaining, limit, resetInMs };
  } catch (err) {
    console.warn(`[rate-limit] failing open for key="${key}":`, (err as Error).message);
    return failOpen(limit, windowMs);
  }
}

/**
 * Extract a stable caller identifier from the request. Vercel sets
 * `x-forwarded-for` and `x-real-ip`; take the leftmost x-forwarded-for hop
 * (the original client). Falls back to a constant so missing headers don't
 * produce an unlimited pool of keys.
 */
export function callerIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function failOpen(limit: number, windowMs: number): RateLimitResult {
  return { allowed: true, remaining: limit, limit, resetInMs: windowMs };
}

/**
 * Wrap a result in standard rate-limit response headers. Use when returning
 * 429 so clients can back off correctly.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetInMs / 1000)),
    ...(result.allowed ? {} : { "Retry-After": String(Math.ceil(result.resetInMs / 1000)) }),
  };
}
