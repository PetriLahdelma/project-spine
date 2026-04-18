import { defineCommand } from "citty";
import { apiFetch, ApiError } from "../cli-client/api.js";
import { readConfig } from "../cli-client/config.js";

type WhoAmI = {
  id: string;
  github_login: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
};

export default defineCommand({
  meta: {
    name: "whoami",
    description: "Show the signed-in user and active workspace.",
  },
  args: {
    json: { type: "boolean", description: "Emit JSON", default: false },
  },
  async run({ args }) {
    const cfg = await readConfig();
    if (!cfg.auth?.token) {
      if (args.json) process.stdout.write(JSON.stringify({ signedIn: false }) + "\n");
      else console.log("not signed in. run `spine login`.");
      process.exitCode = 1;
      return;
    }
    try {
      const { body } = await apiFetch<WhoAmI>("/api/whoami");
      if (args.json) {
        process.stdout.write(
          JSON.stringify(
            { signedIn: true, user: body, activeWorkspace: cfg.activeWorkspace, apiUrl: cfg.apiUrl },
            null,
            2,
          ) + "\n",
        );
        return;
      }
      console.log(`  user:              ${body.github_login}`);
      if (body.name) console.log(`  name:              ${body.name}`);
      if (body.email) console.log(`  email:             ${body.email}`);
      console.log(`  active workspace:  ${cfg.activeWorkspace ?? "(none — use `spine workspace switch`)"}`);
      console.log(`  api:               ${cfg.apiUrl}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        console.error("token rejected by the server. run `spine login` again.");
        process.exitCode = 1;
        return;
      }
      console.error(`whoami failed: ${(err as Error).message}`);
      process.exitCode = 2;
    }
  },
});
