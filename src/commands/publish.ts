import { defineCommand } from "citty";
import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { apiFetch, ApiError } from "../cli-client/api.js";
import { readConfig } from "../cli-client/config.js";
import { SpineModel } from "../model/spine.js";

const rationale = defineCommand({
  meta: {
    name: "rationale",
    description: "Publish rationale.md to a public, unguessable URL branded with your workspace.",
  },
  args: {
    repo: { type: "string", description: "Project root containing .project-spine/", default: "." },
    workspace: {
      type: "string",
      required: false,
      description: "Workspace slug (default: active workspace)",
    },
    title: {
      type: "string",
      required: false,
      description: "Title override (default: project name from spine.json)",
    },
  },
  async run({ args }) {
    const cfg = await readConfig();
    if (!cfg.auth?.token) {
      console.error("not signed in. run `spine login` first.");
      process.exit(1);
    }
    const workspace = args.workspace ?? cfg.activeWorkspace;
    if (!workspace) {
      console.error("no workspace selected. run `spine workspace switch <slug>` or pass --workspace.");
      process.exit(1);
    }

    const root = resolve(process.cwd(), args.repo);
    const spinePath = resolve(root, ".project-spine", "spine.json");
    const rationalePath = resolve(root, ".project-spine", "exports", "rationale.md");

    let spine: ReturnType<typeof SpineModel.parse>;
    let contentMd: string;
    try {
      spine = SpineModel.parse(JSON.parse(await readFile(spinePath, "utf8")));
    } catch (err) {
      console.error(`cannot read ${spinePath}: ${(err as Error).message}`);
      console.error(`run \`spine compile\` first to produce a spine.json.`);
      process.exit(1);
    }
    try {
      contentMd = await readFile(rationalePath, "utf8");
    } catch {
      console.error(`no rationale.md at ${rationalePath}. run \`spine compile\` (or \`spine export --targets rationale\`).`);
      process.exit(1);
    }

    const projectName = spine.metadata.name ?? basename(root);
    const title = args.title ?? `${projectName} — Project rationale`;

    try {
      const { body } = await apiFetch<{
        workspace: string;
        projectName: string;
        publicSlug: string;
        contentHash: string;
        url: string;
        status: "created" | "updated";
      }>(`/api/workspaces/${encodeURIComponent(workspace)}/rationales`, {
        method: "POST",
        body: {
          projectName,
          title,
          spineHash: spine.metadata.hash,
          contentMd,
        },
      });

      console.log(`${body.status} rationale for "${body.projectName}" in workspace "${body.workspace}"`);
      console.log("");
      console.log(`  ${body.url}`);
      console.log("");
      console.log(`  content hash: ${body.contentHash}`);
      console.log(`  revoke with: spine rationale revoke ${body.publicSlug}`);
    } catch (err) {
      handleError(err);
    }
  },
});

export default defineCommand({
  meta: { name: "publish", description: "Publish artefacts (rationale) to public URLs." },
  subCommands: { rationale },
});

function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 401) console.error("token rejected. run `spine login` again.");
    else if (err.status === 404) console.error("workspace not found (or you are not a member).");
    else if (err.status === 400) console.error(`invalid: ${err.message}`);
    else console.error(`api error ${err.status}: ${err.message}`);
  } else {
    console.error(`error: ${(err as Error).message}`);
  }
  process.exit(1);
}
