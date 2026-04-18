import { NextResponse } from "next/server";

export type ServerConfig = {
  githubClientId: string;
  githubClientSecret: string;
  postgresUrl: string;
  baseUrl: string;
};

/**
 * Read server config from env. Returns null and a NextResponse 503 if any
 * required piece is missing — so route handlers can fail-fast during the
 * pre-provisioning window without crashing builds.
 */
export function requireServerConfig(): ServerConfig | NextResponse {
  const missing: string[] = [];
  const githubClientId = process.env["GITHUB_OAUTH_CLIENT_ID"];
  const githubClientSecret = process.env["GITHUB_OAUTH_CLIENT_SECRET"];
  const postgresUrl = process.env["POSTGRES_URL"];
  const baseUrl = process.env["NEXT_PUBLIC_BASE_URL"] ?? "https://projectspine.dev";
  if (!githubClientId) missing.push("GITHUB_OAUTH_CLIENT_ID");
  if (!githubClientSecret) missing.push("GITHUB_OAUTH_CLIENT_SECRET");
  if (!postgresUrl) missing.push("POSTGRES_URL");
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "backend-not-configured",
        message: `Server is missing required env vars: ${missing.join(", ")}. Provision Vercel Postgres and/or configure the GitHub OAuth app.`,
        missing,
      },
      { status: 503 },
    );
  }
  return {
    githubClientId: githubClientId!,
    githubClientSecret: githubClientSecret!,
    postgresUrl: postgresUrl!,
    baseUrl,
  };
}

export function isConfigured(): boolean {
  return Boolean(
    process.env["GITHUB_OAUTH_CLIENT_ID"] &&
      process.env["GITHUB_OAUTH_CLIENT_SECRET"] &&
      process.env["POSTGRES_URL"],
  );
}
