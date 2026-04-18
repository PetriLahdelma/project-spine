import { defineCommand } from "citty";
import { apiFetch, ApiError } from "../cli-client/api.js";
import { readConfig } from "../cli-client/config.js";

type RationaleRow = {
  id: string;
  publicSlug: string;
  projectName: string;
  title: string;
  spineHash: string;
  contentHash: string;
  publishedAt: string;
  updatedAt: string;
  revokedAt: string | null;
  revoked: boolean;
  url: string;
};

const list = defineCommand({
  meta: { name: "list", description: "List rationales published from the active workspace." },
  args: {
    workspace: { type: "string", required: false, description: "Workspace slug (default: active)" },
    "show-revoked": {
      type: "boolean",
      required: false,
      description: "Include revoked rationales",
      default: false,
    },
  },
  async run({ args }) {
    const workspace = await resolveWorkspace(args.workspace);
    try {
      const { body } = await apiFetch<{ workspace: string; rationales: RationaleRow[] }>(
        `/api/workspaces/${encodeURIComponent(workspace)}/rationales`,
      );
      const visible = body.rationales.filter((r) => args["show-revoked"] || !r.revoked);
      if (visible.length === 0) {
        console.log(`workspace "${body.workspace}" has no${args["show-revoked"] ? "" : " active"} rationales.`);
        return;
      }
      for (const r of visible) {
        const status = r.revoked ? "[revoked]" : "        ";
        console.log(`${status}  ${r.projectName}`);
        console.log(`           ${r.url}`);
        console.log(`           title:  ${r.title}`);
        console.log(`           spine:  ${r.spineHash}`);
        console.log(`           updated: ${new Date(r.updatedAt).toISOString()}`);
        console.log("");
      }
    } catch (err) {
      handleError(err);
    }
  },
});

const revoke = defineCommand({
  meta: { name: "revoke", description: "Revoke a published rationale — the URL starts returning 404." },
  args: {
    slug: { type: "positional", required: true, description: "The public slug (from the URL or `rationale list`)" },
    workspace: { type: "string", required: false, description: "Workspace slug (default: active)" },
  },
  async run({ args }) {
    const workspace = await resolveWorkspace(args.workspace);
    try {
      await apiFetch(
        `/api/workspaces/${encodeURIComponent(workspace)}/rationales/${encodeURIComponent(args.slug)}`,
        { method: "DELETE" },
      );
      console.log(`revoked rationale ${args.slug}. the public URL now 404s.`);
    } catch (err) {
      handleError(err);
    }
  },
});

export default defineCommand({
  meta: { name: "rationale", description: "List and revoke published rationales." },
  subCommands: { list, revoke },
});

async function resolveWorkspace(arg: string | undefined): Promise<string> {
  const cfg = await readConfig();
  if (!cfg.auth?.token) {
    console.error("not signed in. run `spine login` first.");
    process.exit(1);
  }
  const workspace = arg ?? cfg.activeWorkspace;
  if (!workspace) {
    console.error("no workspace selected. run `spine workspace switch <slug>` or pass --workspace.");
    process.exit(1);
  }
  return workspace;
}

function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 401) console.error("token rejected. run `spine login` again.");
    else if (err.status === 404) console.error("not found (workspace or rationale).");
    else console.error(`api error ${err.status}: ${err.message}`);
  } else {
    console.error(`error: ${(err as Error).message}`);
  }
  process.exit(1);
}
