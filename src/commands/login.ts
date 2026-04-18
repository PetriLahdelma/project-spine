import { defineCommand } from "citty";
import { exec } from "node:child_process";
import { hostname, platform } from "node:os";
import { readConfig, writeConfig } from "../cli-client/config.js";
import { apiFetchWithConfig, ApiError } from "../cli-client/api.js";

type DeviceStartResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

type PollResponse =
  | { access_token: string; token_type: string; scope: string; user_id: string }
  | { error: string };

type WhoAmI = {
  id: string;
  github_login: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
};

export default defineCommand({
  meta: {
    name: "login",
    description: "Sign in to a Project Spine hosted workspace via GitHub OAuth device flow.",
  },
  args: {
    label: {
      type: "string",
      description: "Label for this token in your account (default: hostname)",
      required: false,
    },
    "no-browser": {
      type: "boolean",
      description: "Don't attempt to open the browser; print the URL only",
      default: false,
    },
  },
  async run({ args }) {
    const cfg = await readConfig();
    if (cfg.auth?.token) {
      console.log(`already signed in as ${cfg.auth.githubLogin ?? "unknown"}`);
      console.log(`to sign in again, run \`spine logout\` first.`);
      process.exitCode = 0;
      return;
    }

    const label = args.label ?? `${hostname()} (${platform()})`;

    // 1. Start device flow
    let start: DeviceStartResponse;
    try {
      const res = await apiFetchWithConfig<DeviceStartResponse>(cfg, "/api/auth/device", {
        method: "POST",
        body: { label },
        token: null,
      });
      start = res.body;
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        console.error(`hosted backend is not yet configured (503). try again later.`);
        process.exitCode = 2;
        return;
      }
      console.error(`failed to start login: ${(err as Error).message}`);
      process.exitCode = 2;
      return;
    }

    console.log("");
    console.log("  user code:  " + bold(start.user_code));
    console.log("  verify at:  " + start.verification_uri);
    console.log("");
    console.log("opening your browser to approve…");
    console.log("");

    if (!args["no-browser"]) {
      openBrowser(start.verification_uri_complete);
    }

    // 2. Poll until approved or expired
    const deadline = Date.now() + start.expires_in * 1000;
    const intervalMs = Math.max(start.interval, 1) * 1000;

    let token: string | null = null;
    let userId: string | null = null;
    while (Date.now() < deadline) {
      await sleep(intervalMs);
      try {
        const { body } = await apiFetchWithConfig<PollResponse>(cfg, "/api/auth/device/poll", {
          method: "POST",
          body: { device_code: start.device_code, label },
          token: null,
          acceptStatus: [202, 410],
        });
        if ("access_token" in body) {
          token = body.access_token;
          userId = body.user_id;
          break;
        }
        if ("error" in body && body.error === "authorization_pending") continue;
        if ("error" in body && (body.error === "expired_token" || body.error === "already_consumed")) {
          console.error(`login failed: ${body.error}. run \`spine login\` again.`);
          process.exitCode = 2;
          return;
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          // Network glitch — keep trying.
          continue;
        }
        console.error(`poll failed: ${(err as Error).message}`);
        process.exitCode = 2;
        return;
      }
    }

    if (!token || !userId) {
      console.error("login timed out — run `spine login` again.");
      process.exitCode = 2;
      return;
    }

    // 3. Fetch whoami to store display info alongside the token
    let me: WhoAmI | null = null;
    try {
      const { body } = await apiFetchWithConfig<WhoAmI>(cfg, "/api/whoami", { token });
      me = body;
    } catch {
      // Non-fatal — save the token even if whoami hiccups
    }

    await writeConfig({
      ...cfg,
      auth: {
        token,
        userId,
        githubLogin: me?.github_login,
        issuedAt: new Date().toISOString(),
      },
    });

    console.log(`signed in as ${me?.github_login ?? userId}.`);
    console.log(`token saved to ~/.project-spine/config.json (user-only permissions).`);
  },
});

function bold(s: string): string {
  return process.stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    // If the browser open fails the printed URL is still there.
  });
}
