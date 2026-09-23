import { execFile as nodeExecFile } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(nodeExecFile);

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_BUFFER_BYTES = 4 * 1024 * 1024;
const MAX_BODY_LENGTH = 64_000;
const MAX_REVIEW_BODY_LENGTH = 16_000;
const MAX_REVIEWS = 200;
const MAX_FILES = 2_000;
const MAX_SUGGESTIONS = 100;

const pullRequestUrlPattern = /^https:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})\/pull\/([1-9][0-9]*)$/;
const shaPattern = /^[0-9a-f]{40}$/i;

export interface GitHubPullRequestLocator {
  owner: string;
  repository: string;
  pullNumber: number;
  url: string;
}

export interface GitHubRefEvidence {
  name: string;
  oid: string;
}

export interface GitHubReviewEvidence {
  id: string;
  author: string | null;
  state: string;
  body: string;
  submittedAt: string | null;
}

export interface GitHubReviewCommentEvidence {
  id: number;
  author: string | null;
  body: string;
  path: string;
  line: number | null;
  originalLine: number | null;
  side: string | null;
  commitId: string | null;
  createdAt: string | null;
  url: string | null;
}

export interface GitHubFileEvidence {
  path: string;
  additions: number;
  deletions: number;
}

export interface GitHubSuggestionEvidence {
  commentId: number;
  path: string;
  line: number | null;
  text: string;
}

export interface GitHubPullRequestEvidence {
  version: 1;
  sourceUrl: string;
  repository: string;
  pullNumber: number;
  title: string;
  body: string;
  base: GitHubRefEvidence;
  head: GitHubRefEvidence;
  reviews: GitHubReviewEvidence[];
  reviewComments: GitHubReviewCommentEvidence[];
  files: GitHubFileEvidence[];
  suggestions: GitHubSuggestionEvidence[];
  fetchedAt: string;
}

export interface GitHubCommandResult {
  stdout: string;
  stderr?: string;
}

export type GitHubCommandRunner = (
  file: string,
  args: readonly string[],
  options: { timeout: number; maxBuffer: number; encoding: "utf8" },
) => Promise<GitHubCommandResult>;

export interface FetchPullRequestEvidenceOptions {
  timeoutMs?: number;
  maxBufferBytes?: number;
  runner?: GitHubCommandRunner;
  now?: () => Date;
}

interface PullRequestJson {
  url?: unknown;
  title?: unknown;
  body?: unknown;
  baseRefName?: unknown;
  baseRefOid?: unknown;
  headRefName?: unknown;
  headRefOid?: unknown;
  reviews?: unknown;
  files?: unknown;
}

interface ReviewCommentJson {
  id?: unknown;
  user?: { login?: unknown } | null;
  body?: unknown;
  path?: unknown;
  line?: unknown;
  original_line?: unknown;
  side?: unknown;
  commit_id?: unknown;
  created_at?: unknown;
  html_url?: unknown;
}

export function parsePullRequestUrl(url: string): GitHubPullRequestLocator {
  const match = pullRequestUrlPattern.exec(url);
  if (!match) {
    throw new Error(
      "Expected a canonical GitHub pull request URL such as https://github.com/owner/repository/pull/123 (no query, fragment, trailing slash, or alternate host).",
    );
  }

  const owner = match[1];
  const repository = match[2];
  const pullNumberText = match[3];
  if (!owner || !repository || !pullNumberText || owner.endsWith("-") || repository === "." || repository === "..") {
    throw new Error("The GitHub pull request URL contains an invalid owner, repository, or pull request number.");
  }

  const pullNumber = Number(pullNumberText);
  if (!Number.isSafeInteger(pullNumber)) {
    throw new Error("The GitHub pull request number is outside the supported range.");
  }

  return { owner, repository, pullNumber, url };
}

const defaultRunner: GitHubCommandRunner = async (file, args, options) => {
  const result = await execFile(file, [...args], options);
  return { stdout: result.stdout, stderr: result.stderr };
};

export async function fetchPullRequestEvidence(
  url: string,
  options: FetchPullRequestEvidenceOptions = {},
): Promise<GitHubPullRequestEvidence> {
  const locator = parsePullRequestUrl(url);
  const timeout = boundedPositiveInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, 120_000, "timeoutMs");
  const maxBuffer = boundedPositiveInteger(
    options.maxBufferBytes,
    DEFAULT_MAX_BUFFER_BYTES,
    64 * 1024,
    16 * 1024 * 1024,
    "maxBufferBytes",
  );
  const runner = options.runner ?? defaultRunner;
  const commandOptions = { timeout, maxBuffer, encoding: "utf8" as const };

  try {
    const [pullResult, reviewCommentsResult] = await Promise.all([
      runner(
        "gh",
        [
          "pr",
          "view",
          locator.url,
          "--json",
          "url,title,body,baseRefName,baseRefOid,headRefName,headRefOid,reviews,files",
        ],
        commandOptions,
      ),
      runner(
        "gh",
        [
          "api",
          `repos/${locator.owner}/${locator.repository}/pulls/${locator.pullNumber}/comments`,
          "--paginate",
          "--slurp",
        ],
        commandOptions,
      ),
    ]);

    const pull = parseJson<PullRequestJson>(pullResult.stdout, "pull request metadata");
    const reviewCommentPages = parseJson<unknown>(reviewCommentsResult.stdout, "pull request review comments");
    return normalizeEvidence(locator, pull, flattenPages(reviewCommentPages), options.now?.() ?? new Date());
  } catch (error) {
    throw githubCommandError(error);
  }
}

function normalizeEvidence(
  locator: GitHubPullRequestLocator,
  pull: PullRequestJson,
  rawReviewComments: unknown[],
  fetchedAt: Date,
): GitHubPullRequestEvidence {
  const returnedUrl = requiredString(pull.url, "url", 500);
  if (returnedUrl !== locator.url) {
    throw new Error(`GitHub returned evidence for an unexpected pull request URL: ${returnedUrl}`);
  }

  const reviews = arrayValue(pull.reviews, "reviews")
    .slice(0, MAX_REVIEWS)
    .map((value, index) => normalizeReview(value, index));
  const reviewComments = rawReviewComments
    .slice(0, MAX_REVIEWS)
    .map((value, index) => normalizeReviewComment(value, index));
  const files = arrayValue(pull.files, "files")
    .slice(0, MAX_FILES)
    .map((value, index) => normalizeFile(value, index));

  return {
    version: 1,
    sourceUrl: locator.url,
    repository: `${locator.owner}/${locator.repository}`,
    pullNumber: locator.pullNumber,
    title: requiredString(pull.title, "title", 512),
    body: optionalString(pull.body, "body", MAX_BODY_LENGTH) ?? "",
    base: {
      name: requiredString(pull.baseRefName, "baseRefName", 255),
      oid: requiredSha(pull.baseRefOid, "baseRefOid"),
    },
    head: {
      name: requiredString(pull.headRefName, "headRefName", 255),
      oid: requiredSha(pull.headRefOid, "headRefOid"),
    },
    reviews,
    reviewComments,
    files,
    suggestions: extractSuggestions(reviewComments),
    fetchedAt: validDate(fetchedAt, "fetchedAt").toISOString(),
  };
}

function normalizeReview(value: unknown, index: number): GitHubReviewEvidence {
  const review = recordValue(value, `reviews[${index}]`);
  const author = nullableAuthor(review.author, `reviews[${index}].author`);
  return {
    id: requiredString(review.id, `reviews[${index}].id`, 255),
    author,
    state: requiredString(review.state, `reviews[${index}].state`, 64),
    body: optionalString(review.body, `reviews[${index}].body`, MAX_REVIEW_BODY_LENGTH) ?? "",
    submittedAt: nullableIsoDate(review.submittedAt, `reviews[${index}].submittedAt`),
  };
}

function normalizeReviewComment(value: unknown, index: number): GitHubReviewCommentEvidence {
  const comment = recordValue(value, `reviewComments[${index}]`) as ReviewCommentJson;
  return {
    id: requiredNonNegativeInteger(comment.id, `reviewComments[${index}].id`),
    author: nullableLogin(comment.user, `reviewComments[${index}].user`),
    body: optionalString(comment.body, `reviewComments[${index}].body`, MAX_REVIEW_BODY_LENGTH) ?? "",
    path: requiredString(comment.path, `reviewComments[${index}].path`, 4_096),
    line: nullableNonNegativeInteger(comment.line, `reviewComments[${index}].line`),
    originalLine: nullableNonNegativeInteger(comment.original_line, `reviewComments[${index}].original_line`),
    side: optionalString(comment.side, `reviewComments[${index}].side`, 16) ?? null,
    commitId: optionalSha(comment.commit_id, `reviewComments[${index}].commit_id`),
    createdAt: nullableIsoDate(comment.created_at, `reviewComments[${index}].created_at`),
    url: optionalString(comment.html_url, `reviewComments[${index}].html_url`, 1_000) ?? null,
  };
}

function normalizeFile(value: unknown, index: number): GitHubFileEvidence {
  const file = recordValue(value, `files[${index}]`);
  return {
    path: requiredString(file.path, `files[${index}].path`, 4_096),
    additions: requiredNonNegativeInteger(file.additions, `files[${index}].additions`),
    deletions: requiredNonNegativeInteger(file.deletions, `files[${index}].deletions`),
  };
}

function extractSuggestions(comments: readonly GitHubReviewCommentEvidence[]): GitHubSuggestionEvidence[] {
  const suggestions: GitHubSuggestionEvidence[] = [];
  const pattern = /```suggestion(?:\r?\n)([\s\S]*?)```/g;
  for (const comment of comments) {
    for (const match of comment.body.matchAll(pattern)) {
      const text = match[1]?.trimEnd();
      if (!text) continue;
      suggestions.push({ commentId: comment.id, path: comment.path, line: comment.line, text: text.slice(0, MAX_REVIEW_BODY_LENGTH) });
      if (suggestions.length >= MAX_SUGGESTIONS) return suggestions;
    }
  }
  return suggestions;
}

function flattenPages(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("GitHub returned invalid pull request review comments: expected an array.");
  if (value.every(Array.isArray)) return value.flatMap((page) => page);
  return value;
}

function githubCommandError(error: unknown): Error {
  if (error instanceof Error && !isExecError(error)) return error;
  if (!isExecError(error)) return new Error("Could not retrieve GitHub pull request evidence.");

  if (error.code === "ENOENT") {
    return new Error("GitHub CLI (gh) was not found. Install it from https://cli.github.com/ and run `gh auth login`.", { cause: error });
  }
  if (error.killed || error.signal === "SIGTERM" || /timed out/i.test(error.message)) {
    return new Error("GitHub CLI timed out while retrieving pull request evidence. Check network access and retry.", { cause: error });
  }

  const detail = typeof error.stderr === "string" ? error.stderr.slice(0, 1_000) : error.message.slice(0, 1_000);
  if (/auth|login|credential|token|HTTP 401|HTTP 403/i.test(detail)) {
    return new Error("GitHub CLI is not authenticated or cannot access this pull request. Run `gh auth status`, then `gh auth login` if needed.", { cause: error });
  }
  if (/maxBuffer|stdout maxBuffer|ENOBUFS/i.test(error.message)) {
    return new Error("GitHub pull request evidence exceeded the configured output limit.", { cause: error });
  }
  return new Error(`GitHub CLI could not retrieve pull request evidence: ${detail || "unknown error"}`, { cause: error });
}

interface ExecError extends Error {
  code?: string | number;
  killed?: boolean;
  signal?: string;
  stderr?: string;
}

function isExecError(value: unknown): value is ExecError {
  return value instanceof Error && ("code" in value || "killed" in value || "signal" in value || "stderr" in value);
}

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`GitHub returned invalid JSON for ${label}.`, { cause: error });
  }
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`GitHub response field ${label} must be an array.`);
  return value;
}

function recordValue(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`GitHub response field ${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`GitHub response field ${label} must be a non-empty string.`);
  if (value.length > maxLength) throw new Error(`GitHub response field ${label} exceeds ${maxLength} characters.`);
  return value;
}

function optionalString(value: unknown, label: string, maxLength: number): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`GitHub response field ${label} must be a string.`);
  if (value.length > maxLength) return value.slice(0, maxLength);
  return value;
}

function requiredSha(value: unknown, label: string): string {
  const sha = requiredString(value, label, 40);
  if (!shaPattern.test(sha)) throw new Error(`GitHub response field ${label} must be a 40-character commit SHA.`);
  return sha.toLowerCase();
}

function optionalSha(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  return requiredSha(value, label);
}

function requiredNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`GitHub response field ${label} must be a non-negative integer.`);
  }
  return value;
}

function nullableNonNegativeInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null;
  return requiredNonNegativeInteger(value, label);
}

function nullableAuthor(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  const author = recordValue(value, label);
  return optionalString(author.login, `${label}.login`, 255) ?? null;
}

function nullableLogin(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) throw new Error(`GitHub response field ${label} must be an object or null.`);
  return optionalString((value as { login?: unknown }).login, `${label}.login`, 255) ?? null;
}

function nullableIsoDate(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  const text = requiredString(value, label, 100);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`GitHub response field ${label} must be an ISO date.`);
  return date.toISOString();
}

function validDate(value: Date, label: string): Date {
  if (Number.isNaN(value.getTime())) throw new Error(`${label} must be a valid date.`);
  return value;
}

function boundedPositiveInteger(value: number | undefined, fallback: number, min: number, max: number, label: string): number {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result < min || result > max) {
    throw new Error(`${label} must be an integer between ${min} and ${max}.`);
  }
  return result;
}
