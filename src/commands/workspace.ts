import { defineCommand } from "citty";
import { apiFetch, ApiError } from "../cli-client/api.js";
import { readConfig, writeConfig } from "../cli-client/config.js";

type WorkspaceSummary = {
  slug: string;
  name: string;
  description: string | null;
  brandColor: string | null;
  role: "owner" | "admin" | "member";
  createdAt: string;
};

const create = defineCommand({
  meta: { name: "create", description: "Create a new workspace and set it active." },
  args: {
    slug: {
      type: "positional",
      required: true,
      description: "URL-safe slug (lowercase-kebab, 2-48 chars)",
    },
    name: { type: "string", description: "Display name (default: slug)", required: false },
    description: { type: "string", description: "One-line description", required: false },
    "brand-color": { type: "string", description: "Hex color (#RRGGBB) for future branding", required: false },
  },
  async run({ args }) {
    await requireAuth();
    try {
      const { body } = await apiFetch<{ slug: string; name: string; role: string; url: string }>(
        "/api/workspaces",
        {
          method: "POST",
          body: {
            slug: args.slug,
            name: args.name ?? args.slug,
            ...(args.description !== undefined && { description: args.description }),
            ...(args["brand-color"] !== undefined && { brandColor: args["brand-color"] }),
          },
        },
      );
      const cfg = await readConfig();
      await writeConfig({ ...cfg, activeWorkspace: body.slug });
      console.log(`created workspace "${body.slug}" — you are ${body.role}`);
      console.log(`  ${body.url}`);
      console.log(`  (now active; \`spine template save --location workspace\` pushes here)`);
    } catch (err) {
      handleError(err);
    }
  },
});

const list = defineCommand({
  meta: { name: "list", description: "List workspaces you are a member of." },
  async run() {
    await requireAuth();
    try {
      const { body } = await apiFetch<{ workspaces: WorkspaceSummary[] }>("/api/workspaces");
      const cfg = await readConfig();
      if (body.workspaces.length === 0) {
        console.log("no workspaces yet. create one with `spine workspace create <slug>`.");
        return;
      }
      const slugWidth = Math.max(...body.workspaces.map((w) => w.slug.length), 4);
      const roleWidth = Math.max(...body.workspaces.map((w) => w.role.length), 4);
      for (const w of body.workspaces) {
        const active = w.slug === cfg.activeWorkspace ? "*" : " ";
        console.log(`${active} ${w.slug.padEnd(slugWidth)}  [${w.role.padEnd(roleWidth)}]  ${w.name}`);
      }
      if (cfg.activeWorkspace) console.log(`\n* = active`);
    } catch (err) {
      handleError(err);
    }
  },
});

const switchWs = defineCommand({
  meta: { name: "switch", description: "Set an active workspace for template sync." },
  args: {
    slug: { type: "positional", required: true, description: "Workspace slug" },
  },
  async run({ args }) {
    await requireAuth();
    try {
      // Verify membership before saving.
      await apiFetch(`/api/workspaces/${encodeURIComponent(args.slug)}`);
      const cfg = await readConfig();
      await writeConfig({ ...cfg, activeWorkspace: args.slug });
      console.log(`active workspace set to "${args.slug}".`);
    } catch (err) {
      handleError(err);
    }
  },
});

const current = defineCommand({
  meta: { name: "current", description: "Show the active workspace on this machine." },
  async run() {
    const cfg = await readConfig();
    if (!cfg.activeWorkspace) {
      console.log("no active workspace. run `spine workspace switch <slug>`.");
      process.exitCode = 1;
      return;
    }
    console.log(cfg.activeWorkspace);
  },
});

export default defineCommand({
  meta: { name: "workspace", description: "Create and switch hosted workspaces." },
  subCommands: { create, list, switch: switchWs, current },
});

async function requireAuth(): Promise<void> {
  const cfg = await readConfig();
  if (!cfg.auth?.token) {
    console.error("not signed in. run `spine login` first.");
    process.exit(1);
  }
}

function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      console.error("token rejected. run `spine login` again.");
    } else if (err.status === 404) {
      console.error("not found (or you are not a member).");
    } else if (err.status === 409) {
      console.error(err.message);
    } else if (err.status === 400) {
      console.error(`invalid: ${err.message}`);
    } else {
      console.error(`api error ${err.status}: ${err.message}`);
    }
  } else {
    console.error(`error: ${(err as Error).message}`);
  }
  process.exit(err instanceof ApiError ? Math.min(Math.floor(err.status / 100), 2) : 2);
}
