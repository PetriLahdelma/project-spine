import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, webSessions } from "@/db/schema";

const SESSION_COOKIE = "spine_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export async function createWebSession(userId: string, userAgent: string | null = null): Promise<string> {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(webSessions).values({ id, userId, expiresAt, userAgent });
  return id;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type WebUser = {
  id: string;
  githubLogin: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  sessionId: string;
};

export async function getWebSessionUser(): Promise<WebUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const [row] = await db
    .select({
      sessionId: webSessions.id,
      expiresAt: webSessions.expiresAt,
      user: users,
    })
    .from(webSessions)
    .innerJoin(users, eq(users.id, webSessions.userId))
    .where(
      and(
        eq(webSessions.id, sessionId),
        isNull(webSessions.revokedAt),
        gt(webSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;

  // Fire-and-forget last-used bump
  void db
    .update(webSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(webSessions.id, row.sessionId));

  return {
    id: row.user.id,
    githubLogin: row.user.githubLogin,
    email: row.user.email,
    name: row.user.name,
    avatarUrl: row.user.avatarUrl,
    sessionId: row.sessionId,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(webSessions)
    .set({ revokedAt: new Date() })
    .where(eq(webSessions.id, sessionId));
}
