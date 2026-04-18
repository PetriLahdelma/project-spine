import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { authenticateBearer, extractBearer, type AuthenticatedUser } from "@/lib/auth";
import { requireServerConfig, type ServerConfig } from "@/lib/config";

export type ApiContext = {
  user: AuthenticatedUser;
  config: ServerConfig;
};

/**
 * Auth + config guard for API route handlers. Returns a populated context
 * or a ready-to-return NextResponse (401 / 503). Callers do:
 *
 *   const ctx = await requireApiContext(req);
 *   if (ctx instanceof NextResponse) return ctx;
 */
export async function requireApiContext(req: Request): Promise<ApiContext | NextResponse> {
  const config = requireServerConfig();
  if (config instanceof NextResponse) return config;

  const token = extractBearer(req.headers.get("authorization"));
  const user = await authenticateBearer(token);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return { user, config };
}

export type WorkspaceAccess = {
  workspace: typeof workspaces.$inferSelect;
  role: "owner" | "admin" | "member";
};

/** Load a workspace by slug and verify the user has a membership. */
export async function requireWorkspaceMember(
  slug: string,
  user: AuthenticatedUser,
): Promise<WorkspaceAccess | NextResponse> {
  const [row] = await db
    .select({ ws: workspaces, role: memberships.role })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(workspaces.slug, slug), eq(memberships.userId, user.id)))
    .limit(1);

  if (!row) {
    // We don't reveal existence of the workspace to non-members.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return { workspace: row.ws, role: row.role };
}

export function requireWriteAccess(access: WorkspaceAccess): NextResponse | null {
  if (access.role === "owner" || access.role === "admin" || access.role === "member") {
    // MVP: all members can write templates. Revisit when we have admin-only
    // concerns (billing, member management).
    return null;
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

/** Parse a JSON body with a zod schema; return a NextResponse 400 on failure. */
export async function parseJsonBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<z.infer<T> | NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request", message: "invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "bad_request",
        message: "validation failed",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }
  return parsed.data;
}
