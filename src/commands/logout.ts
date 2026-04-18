import { defineCommand } from "citty";
import { clearAuth, readConfig } from "../cli-client/config.js";

export default defineCommand({
  meta: {
    name: "logout",
    description: "Forget the stored Project Spine bearer token on this machine.",
  },
  async run() {
    const cfg = await readConfig();
    if (!cfg.auth) {
      console.log("not signed in.");
      return;
    }
    await clearAuth();
    console.log(`signed out${cfg.auth.githubLogin ? ` (${cfg.auth.githubLogin})` : ""}.`);
    console.log("note: the token remains valid on the server until revoked.");
  },
});
