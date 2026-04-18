/**
 * Thin wrapper over GitHub's OAuth + user endpoints. We deliberately don't
 * pull in an SDK — surface area is small and the dependency graph stays clean.
 */

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API = "https://api.github.com";

export type GitHubUser = {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
};

export function githubAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const u = new URL(GITHUB_AUTHORIZE_URL);
  u.searchParams.set("client_id", params.clientId);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("state", params.state);
  u.searchParams.set("scope", params.scope ?? "read:user user:email");
  u.searchParams.set("allow_signup", "true");
  return u.toString();
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; tokenType: string; scope: string }> {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "project-spine/0.4",
    },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!json.access_token) {
    throw new Error(`GitHub token exchange error: ${json.error ?? "unknown"} — ${json.error_description ?? ""}`);
  }
  return {
    accessToken: json.access_token,
    tokenType: json.token_type ?? "bearer",
    scope: json.scope ?? "",
  };
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "project-spine/0.4",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub /user failed: ${res.status} ${await res.text()}`);
  }
  const user = (await res.json()) as GitHubUser;

  // /user only returns a public email. If null, try /user/emails for the
  // primary verified one (requires user:email scope).
  if (user.email) return user;
  try {
    const emailsRes = await fetch(`${GITHUB_API}/user/emails`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "project-spine/0.4",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primary = emails.find((e) => e.primary && e.verified);
      if (primary) user.email = primary.email;
    }
  } catch {
    // Best-effort. Missing email is OK — we don't require it.
  }
  return user;
}
