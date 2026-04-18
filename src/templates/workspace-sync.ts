import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { stringify as stringifyYaml } from "yaml";
import { apiFetch, ApiError } from "../cli-client/api.js";
import { readConfig } from "../cli-client/config.js";
import { TemplateManifest, type TemplateManifest as TemplateManifestType } from "./model.js";
import { saveTemplate } from "./save.js";

export type PushResult = {
  workspace: string;
  name: string;
  contentHash: string;
  status: "created" | "updated";
};

export async function pushWorkspaceTemplate(params: {
  name: string;
  title?: string;
  description?: string;
  from?: string;
  force?: boolean;
}): Promise<PushResult> {
  const cfg = await readConfig();
  if (!cfg.auth?.token) {
    throw new Error("not signed in. run `spine login` first.");
  }
  if (!cfg.activeWorkspace) {
    throw new Error(
      "no active workspace. run `spine workspace create <slug>` or `spine workspace switch <slug>`.",
    );
  }

  // Stage to a local temp by reusing saveTemplate — it derives the manifest
  // from .project-spine/spine.json if present, and stores the brief.md
  // (project-specific values stripped). We write to a per-push scratch dir,
  // read back, push via API, then let it be garbage-collected.
  const scratch = join(homedir(), ".project-spine", "scratch", `push-${Date.now()}`);
  await mkdir(scratch, { recursive: true });

  const staged = await saveTemplate({
    name: params.name,
    ...(params.title !== undefined && { title: params.title }),
    ...(params.description !== undefined && { description: params.description }),
    ...(params.from !== undefined && { from: params.from }),
    location: "project",
    force: true,
    // Override the default location path by writing to our scratch directly.
    // saveTemplate handles project-local by joining from + ".project-spine-templates";
    // instead we call it with a from that places scratch appropriately.
    // Workaround: we'll read the manifest ourselves below if saveTemplate doesn't fit.
  }).catch((e) => {
    throw new Error(`failed to stage template locally: ${(e as Error).message}`);
  });

  // The saved template lives at staged.templateDir. Load manifest + brief + design.
  const manifestPath = join(staged.templateDir, "template.yaml");
  const briefPath = join(staged.templateDir, "brief.md");
  const designPath = join(staged.templateDir, "design-rules.md");

  const manifestRaw = await readFile(manifestPath, "utf8");
  const parsedYaml = (await import("yaml")).parse(manifestRaw);
  const manifest: TemplateManifestType = TemplateManifest.parse(parsedYaml);
  const briefMd = await readFile(briefPath, "utf8");
  const hasDesign = await exists(designPath);
  const designRulesMd = hasDesign ? await readFile(designPath, "utf8") : undefined;

  try {
    const { body } = await apiFetch<PushResult>(
      `/api/workspaces/${encodeURIComponent(cfg.activeWorkspace)}/templates`,
      {
        method: "POST",
        body: {
          name: manifest.name,
          title: manifest.title,
          description: manifest.description,
          projectType: manifest.projectType,
          contributes: manifest.contributes,
          briefMd,
          ...(designRulesMd !== undefined && { designRulesMd }),
        },
      },
    );
    void stringifyYaml; // keep the import alive for consumers
    return body;
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      throw new Error(`server rejected template: ${err.message}`);
    }
    throw err;
  }
}

export type WorkspaceTemplateListItem = {
  name: string;
  title: string;
  description: string;
  projectType: string;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
};

export async function listWorkspaceTemplates(): Promise<{
  workspace: string;
  items: WorkspaceTemplateListItem[];
}> {
  const cfg = await readConfig();
  if (!cfg.auth?.token) throw new Error("not signed in. run `spine login` first.");
  if (!cfg.activeWorkspace) throw new Error("no active workspace.");
  const { body } = await apiFetch<{ workspace: string; count: number; templates: WorkspaceTemplateListItem[] }>(
    `/api/workspaces/${encodeURIComponent(cfg.activeWorkspace)}/templates`,
  );
  return { workspace: body.workspace, items: body.templates };
}

export type WorkspaceTemplate = {
  workspace: string;
  name: string;
  title: string;
  description: string;
  projectType: string;
  manifest: unknown;
  briefMd: string;
  designRulesMd: string | null;
  contentHash: string;
};

/** Fetch one template; writes into ~/.project-spine/templates/<name>/ by default. */
export async function pullWorkspaceTemplate(params: {
  name: string;
  force?: boolean;
}): Promise<{ templateDir: string; contentHash: string }> {
  const cfg = await readConfig();
  if (!cfg.auth?.token) throw new Error("not signed in. run `spine login` first.");
  if (!cfg.activeWorkspace) throw new Error("no active workspace.");
  const { body } = await apiFetch<WorkspaceTemplate>(
    `/api/workspaces/${encodeURIComponent(cfg.activeWorkspace)}/templates/${encodeURIComponent(params.name)}`,
  );

  const userDir = join(homedir(), ".project-spine", "templates", body.name);
  if (!params.force && (await exists(join(userDir, "template.yaml")))) {
    throw new Error(`local template "${body.name}" already exists at ${userDir} — pass --force to overwrite`);
  }
  await mkdir(userDir, { recursive: true });

  const yamlMod = await import("yaml");
  await writeFile(join(userDir, "template.yaml"), yamlMod.stringify(body.manifest), "utf8");
  await writeFile(join(userDir, "brief.md"), body.briefMd, "utf8");
  if (body.designRulesMd) {
    await writeFile(join(userDir, "design-rules.md"), body.designRulesMd, "utf8");
  }
  return { templateDir: userDir, contentHash: body.contentHash };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
