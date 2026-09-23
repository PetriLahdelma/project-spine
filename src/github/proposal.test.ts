import { describe, expect, it } from "vitest";
import type { GitHubPullRequestEvidence } from "./evidence.js";
import { evidenceToMarkdown, proposalFromPullRequest } from "./proposal.js";

const baseSha = "a".repeat(40);
const headSha = "b".repeat(40);
const evidence: GitHubPullRequestEvidence = {
  version: 1,
  sourceUrl: "https://github.com/acme/widget/pull/42",
  repository: "acme/widget",
  pullNumber: 42,
  title: "Keep tenant checks in jobs",
  body: "Restores an authorization check.",
  base: { name: "main", oid: baseSha },
  head: { name: "fix/tenant-boundary", oid: headSha },
  reviews: [{ id: "PRR_1", author: "reviewer", state: "APPROVED", body: "Looks good", submittedAt: null }],
  reviewComments: [],
  files: [{ path: "src/jobs/sync.ts", additions: 4, deletions: 1 }],
  suggestions: [],
  fetchedAt: "2026-09-23T08:00:00.000Z",
};

describe("proposalFromPullRequest", () => {
  it("builds a source-linked candidate from reviewed rules and explicit replay refs", () => {
    const proposal = proposalFromPullRequest(
      evidence,
      [
        {
          id: "tenant-check",
          description: "Background jobs keep the tenant authorization call.",
          files: ["src/jobs/**/*.ts"],
          kind: "require-text",
          text: "authorizeTenant(",
        },
      ],
      { brokenRef: baseSha, fixedRef: headSha },
    );

    expect(proposal).toEqual({
      version: 1,
      id: "github-acme-widget-pr-42",
      title: evidence.title,
      summary: "Candidate failure case sourced from reviewed evidence in acme/widget#42.",
      source: { kind: "github", url: evidence.sourceUrl, revision: headSha },
      rules: [
        {
          id: "tenant-check",
          description: "Background jobs keep the tenant authorization call.",
          files: ["src/jobs/**/*.ts"],
          kind: "require-text",
          text: "authorizeTenant(",
        },
      ],
      replay: { brokenRef: baseSha, fixedRef: headSha },
    });
  });

  it("never infers broken/fixed meaning from PR base and head", () => {
    expect(() => proposalFromPullRequest(evidence)).toThrow(/Explicit replay refs are required/);
    expect(() => proposalFromPullRequest(evidence, [], { brokenRef: baseSha, fixedRef: baseSha })).toThrow(/different revisions/);
  });

  it("validates reviewed rules and refs", () => {
    expect(() =>
      proposalFromPullRequest(
        evidence,
        [{ id: "Bad Rule", description: "x", files: ["src/**"], kind: "require-text", text: "x" }],
        { brokenRef: baseSha, fixedRef: headSha },
      ),
    ).toThrow(/rules\[0\]\.id/);
    expect(() => proposalFromPullRequest(evidence, [], { brokenRef: "--exec=oops", fixedRef: headSha })).toThrow(/safe Git revision/);
  });
});

describe("evidenceToMarkdown", () => {
  it("labels revisions as observed metadata without assigning failure semantics", () => {
    const markdown = evidenceToMarkdown(evidence);
    expect(markdown).toContain(`Observed base: \`main\` (\`${baseSha}\`)`);
    expect(markdown).toContain("does not assert that either revision is a broken or fixed replay state");
    expect(markdown).toContain("`src/jobs/sync.ts` (+4/-1)");
  });
});
