import type { GitHubPullRequestEvidence } from "./evidence.js";
import { FailureCaseSchema, type FailureCase, type LearningRule } from "../learning/index.js";

const shaPattern = /^[0-9a-f]{40}$/i;

export type GitHubRuleSpec = LearningRule;

export interface ExplicitReplayRefs {
  brokenRef: string;
  fixedRef: string;
}

export type ProposedFailureCase = FailureCase;

export function proposalFromPullRequest(
  evidence: GitHubPullRequestEvidence,
  ruleSpecs: readonly GitHubRuleSpec[] = [],
  replay?: ExplicitReplayRefs,
): ProposedFailureCase {
  if (!replay) {
    throw new Error(
      "Explicit replay refs are required. A pull request base/head pair is observed metadata and does not prove which revision is broken or fixed.",
    );
  }

  const brokenRef = validatedRef(replay.brokenRef, "brokenRef");
  const fixedRef = validatedRef(replay.fixedRef, "fixedRef");
  if (brokenRef === fixedRef) throw new Error("brokenRef and fixedRef must identify different revisions.");

  return FailureCaseSchema.parse({
    version: 1,
    id: `github-${slug(evidence.repository, 44)}-pr-${evidence.pullNumber}`,
    title: evidence.title.slice(0, 200),
    summary: `Candidate failure case sourced from reviewed evidence in ${evidence.repository}#${evidence.pullNumber}.`,
    source: {
      kind: "github",
      url: evidence.sourceUrl,
      revision: evidence.head.oid,
    },
    rules: ruleSpecs.map(validateRule),
    replay: { brokenRef, fixedRef },
  });
}

function validateRule(rule: GitHubRuleSpec, index: number): GitHubRuleSpec {
  const prefix = `rules[${index}]`;
  const id = boundedText(rule.id, `${prefix}.id`, 128);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(id)) {
    throw new Error(`${prefix}.id must use lowercase letters, numbers, dots, underscores, or hyphens.`);
  }
  const description = boundedText(rule.description, `${prefix}.description`, 1_000);
  const text = boundedText(rule.text, `${prefix}.text`, 16_000);
  if (rule.kind !== "forbid-text" && rule.kind !== "require-text") {
    throw new Error(`${prefix}.kind must be forbid-text or require-text.`);
  }
  if (!Array.isArray(rule.files) || rule.files.length === 0 || rule.files.length > 16) {
    throw new Error(`${prefix}.files must contain between 1 and 16 paths or glob patterns.`);
  }
  const files = rule.files.map((file, fileIndex) => boundedText(file, `${prefix}.files[${fileIndex}]`, 4_096));
  return { id, description, files, kind: rule.kind, text };
}

function validatedRef(value: string, label: string): string {
  const ref = boundedText(value, label, 255);
  if (ref.startsWith("-") || ref.includes("..") || /[\s~^:?*[\\]/.test(ref)) {
    throw new Error(`${label} is not a safe Git revision.`);
  }
  // Full SHAs are preferred, but named refs are useful for local draft cases.
  if (!shaPattern.test(ref) && !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref)) {
    throw new Error(`${label} is not a safe Git revision.`);
  }
  return ref;
}

function boundedText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} must be a non-empty string.`);
  if (value.length > maxLength) throw new Error(`${label} exceeds ${maxLength} characters.`);
  return value;
}

function slug(value: string, maxLength: number): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, maxLength);
}

export function evidenceToMarkdown(evidence: GitHubPullRequestEvidence): string {
  const lines = [
    `# GitHub evidence: ${evidence.title}`,
    "",
    `- Source: ${evidence.sourceUrl}`,
    `- Repository: ${evidence.repository}`,
    `- Observed base: \`${evidence.base.name}\` (\`${evidence.base.oid}\`)`,
    `- Observed head: \`${evidence.head.name}\` (\`${evidence.head.oid}\`)`,
    `- Fetched: ${evidence.fetchedAt}`,
    "",
    "> Base and head are observed pull request metadata. This report does not assert that either revision is a broken or fixed replay state.",
    "",
    "## Files",
    "",
    ...evidence.files.map((file) => `- \`${file.path}\` (+${file.additions}/-${file.deletions})`),
    "",
    "## Reviews",
    "",
    ...evidence.reviews.map((review) => `- ${review.author ?? "unknown"}: ${review.state}${review.body ? ` — ${singleLine(review.body)}` : ""}`),
    "",
    "## Inline review comments",
    "",
    ...evidence.reviewComments.map(
      (comment) => `- \`${comment.path}${comment.line === null ? "" : `:${comment.line}`}\` by ${comment.author ?? "unknown"}: ${singleLine(comment.body)}`,
    ),
    "",
    "## Candidate suggestions",
    "",
    ...(evidence.suggestions.length === 0
      ? ["No GitHub suggestion blocks were observed."]
      : evidence.suggestions.map((suggestion) => `- Comment ${suggestion.commentId}, \`${suggestion.path}\`: suggestion captured as untrusted candidate text.`)),
    "",
  ];
  return lines.join("\n");
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}
