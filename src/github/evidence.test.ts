import { describe, expect, it, vi } from "vitest";
import {
  fetchPullRequestEvidence,
  parsePullRequestUrl,
  type GitHubCommandRunner,
} from "./evidence.js";

const url = "https://github.com/acme/widget/pull/42";
const baseSha = "a".repeat(40);
const headSha = "b".repeat(40);

function pullJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    url,
    title: "Keep tenant checks in jobs",
    body: "This PR restores the tenant boundary.",
    baseRefName: "main",
    baseRefOid: baseSha,
    headRefName: "fix/tenant-boundary",
    headRefOid: headSha,
    reviews: [
      {
        id: "PRR_1",
        author: { login: "reviewer" },
        state: "CHANGES_REQUESTED",
        body: "Background jobs must keep the authorization check.",
        submittedAt: "2026-09-20T12:00:00Z",
      },
    ],
    files: [{ path: "src/jobs/sync.ts", additions: 4, deletions: 1 }],
    ...overrides,
  });
}

function commentsJson(body = "Please keep this check.\n```suggestion\nauthorizeTenant(job.tenantId);\n```"): string {
  return JSON.stringify([
    [
      {
        id: 99,
        user: { login: "reviewer" },
        body,
        path: "src/jobs/sync.ts",
        line: 18,
        original_line: 17,
        side: "RIGHT",
        commit_id: headSha,
        created_at: "2026-09-20T12:05:00Z",
        html_url: `${url}#discussion_r99`,
      },
    ],
  ]);
}

function mockRunner(): GitHubCommandRunner {
  return vi.fn(async (_file, args) => {
    if (args[0] === "pr") return { stdout: pullJson() };
    return { stdout: commentsJson() };
  });
}

describe("parsePullRequestUrl", () => {
  it("accepts only canonical github.com pull request URLs", () => {
    expect(parsePullRequestUrl(url)).toEqual({ owner: "acme", repository: "widget", pullNumber: 42, url });

    for (const malicious of [
      "https://github.com/acme/widget/pull/42;touch-pwned",
      "https://github.com/acme/widget/pull/42?x=$(touch%20pwned)",
      "https://github.com/acme/widget/pull/42/",
      "https://evil.example/acme/widget/pull/42",
      "git@github.com:acme/widget/pull/42",
    ]) {
      expect(() => parsePullRequestUrl(malicious)).toThrow(/canonical GitHub pull request URL/);
    }
  });
});

describe("fetchPullRequestEvidence", () => {
  it("retrieves bounded PR metadata, reviews, files, comments, and candidate suggestions with argument arrays", async () => {
    const runner = mockRunner();
    const evidence = await fetchPullRequestEvidence(url, {
      runner,
      timeoutMs: 5_000,
      maxBufferBytes: 128 * 1024,
      now: () => new Date("2026-09-23T08:00:00Z"),
    });

    expect(runner).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenCalledWith(
      "gh",
      ["pr", "view", url, "--json", "url,title,body,baseRefName,baseRefOid,headRefName,headRefOid,reviews,files"],
      { timeout: 5_000, maxBuffer: 128 * 1024, encoding: "utf8" },
    );
    expect(runner).toHaveBeenCalledWith(
      "gh",
      ["api", "repos/acme/widget/pulls/42/comments", "--paginate", "--slurp"],
      { timeout: 5_000, maxBuffer: 128 * 1024, encoding: "utf8" },
    );
    expect(evidence).toMatchObject({
      version: 1,
      sourceUrl: url,
      repository: "acme/widget",
      pullNumber: 42,
      title: "Keep tenant checks in jobs",
      base: { name: "main", oid: baseSha },
      head: { name: "fix/tenant-boundary", oid: headSha },
      reviews: [{ author: "reviewer", state: "CHANGES_REQUESTED" }],
      files: [{ path: "src/jobs/sync.ts", additions: 4, deletions: 1 }],
      suggestions: [{ commentId: 99, path: "src/jobs/sync.ts", line: 18, text: "authorizeTenant(job.tenantId);" }],
      fetchedAt: "2026-09-23T08:00:00.000Z",
    });
  });

  it("treats retrieved comment content as data and never as a command", async () => {
    const commandText = "$(touch /tmp/project-spine-should-not-exist)";
    const runner: GitHubCommandRunner = vi.fn(async (_file, args) =>
      args[0] === "pr" ? { stdout: pullJson() } : { stdout: commentsJson(commandText) },
    );

    const evidence = await fetchPullRequestEvidence(url, { runner });
    expect(evidence.reviewComments[0]?.body).toBe(commandText);
    expect(evidence.suggestions).toEqual([]);
    expect(runner).toHaveBeenCalledWith("gh", expect.any(Array), expect.any(Object));
  });

  it("enforces safe timeout and output bounds before invoking gh", async () => {
    const runner = mockRunner();
    await expect(fetchPullRequestEvidence(url, { runner, timeoutMs: 999 })).rejects.toThrow(/timeoutMs/);
    await expect(fetchPullRequestEvidence(url, { runner, maxBufferBytes: 16 * 1024 })).rejects.toThrow(/maxBufferBytes/);
    expect(runner).not.toHaveBeenCalled();
  });

  it("returns actionable missing binary, authentication, timeout, and output-limit errors", async () => {
    const missing = Object.assign(new Error("spawn gh ENOENT"), { code: "ENOENT" });
    await expect(fetchPullRequestEvidence(url, { runner: vi.fn(async () => Promise.reject(missing)) })).rejects.toThrow(
      /GitHub CLI \(gh\) was not found/,
    );

    const auth = Object.assign(new Error("gh failed"), { code: 1, stderr: "HTTP 401: authentication required" });
    await expect(fetchPullRequestEvidence(url, { runner: vi.fn(async () => Promise.reject(auth)) })).rejects.toThrow(
      /gh auth status/,
    );

    const timeout = Object.assign(new Error("command timed out"), { code: "ETIMEDOUT", killed: true, signal: "SIGTERM" });
    await expect(fetchPullRequestEvidence(url, { runner: vi.fn(async () => Promise.reject(timeout)) })).rejects.toThrow(
      /timed out/,
    );

    const tooLarge = Object.assign(new Error("stdout maxBuffer length exceeded"), { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" });
    await expect(fetchPullRequestEvidence(url, { runner: vi.fn(async () => Promise.reject(tooLarge)) })).rejects.toThrow(
      /output limit/,
    );
  });

  it("rejects mismatched or malformed API evidence", async () => {
    const mismatched: GitHubCommandRunner = vi.fn(async (_file, args) =>
      args[0] === "pr"
        ? { stdout: pullJson({ url: "https://github.com/acme/other/pull/42" }) }
        : { stdout: commentsJson() },
    );
    await expect(fetchPullRequestEvidence(url, { runner: mismatched })).rejects.toThrow(/unexpected pull request URL/);

    const malformed: GitHubCommandRunner = vi.fn(async (_file, args) =>
      args[0] === "pr" ? { stdout: "not-json" } : { stdout: commentsJson() },
    );
    await expect(fetchPullRequestEvidence(url, { runner: malformed })).rejects.toThrow(/invalid JSON/);
  });
});
