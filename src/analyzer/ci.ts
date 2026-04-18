import { exists, findFiles, rootPath } from "./fs.js";

export async function detectCi(root: string): Promise<{
  githubActions: boolean;
  workflows: string[];
  other: string[];
  evidence: string[];
}> {
  const evidence: string[] = [];
  const ghDir = rootPath(root, ".github", "workflows");
  const ghActions = await exists(ghDir);
  const workflows = ghActions
    ? await findFiles(root, [".github/workflows/*.yml", ".github/workflows/*.yaml"])
    : [];
  if (ghActions) evidence.push(`.github/workflows/ (${workflows.length} files)`);

  const otherCandidates = [".circleci/config.yml", ".gitlab-ci.yml", "azure-pipelines.yml"];
  const other: string[] = [];
  for (const c of otherCandidates) {
    if (await exists(rootPath(root, c))) {
      other.push(c);
      evidence.push(c);
    }
  }

  return { githubActions: ghActions, workflows, other, evidence };
}
