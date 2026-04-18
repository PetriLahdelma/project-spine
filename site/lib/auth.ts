import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";

/**
 * Hash a bearer token for storage. We never write plaintext to the DB.
 * Constant-time equality is checked at lookup; this hash is deterministic.
 */
export function hashToken(token: string): string {
  return "sha256:" + createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison helper. Both strings must be the same length. */
export function safeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export type AuthenticatedUser = {
  id: string;
  githubId: number;
  githubLogin: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  tokenId: string;
};

/**
 * Resolve a bearer token to a user. Returns null on any failure (missing,
 * revoked, unknown). Touches the token's `last_used_at` on success so the
 * caller can display session freshness later.
 */
export async function authenticateBearer(token: string | null): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  if (!token.startsWith("sps_")) return null;
  const hash = hashToken(token);

  const rows = await db
    .select({
      tokenId: authTokens.id,
      userId: authTokens.userId,
      revokedAt: authTokens.revokedAt,
      user: users,
    })
    .from(authTokens)
    .innerJoin(users, eq(users.id, authTokens.userId))
    .where(and(eq(authTokens.tokenHash, hash), isNull(authTokens.revokedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Fire-and-forget touch of last_used_at; don't block the caller on it.
  void db
    .update(authTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(authTokens.id, row.tokenId));

  return {
    id: row.user.id,
    githubId: Number(row.user.githubId),
    githubLogin: row.user.githubLogin,
    email: row.user.email,
    name: row.user.name,
    avatarUrl: row.user.avatarUrl,
    tokenId: row.tokenId,
  };
}

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1]!.trim() : null;
}
