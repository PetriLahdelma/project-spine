import { describe, it, expect } from "vitest";
import { scrubSecrets, scrubStrings } from "./scrubber.js";

// Test fixtures use clearly-synthetic tokens that can't be mistaken for real
// credentials by secret scanners. We only care that the regex *pattern* matches,
// not that the body is cryptographically valid.
const FAKE_GITHUB_PAT = "ghp_" + "F".repeat(40);
const FAKE_ANTHROPIC = "sk-ant-" + "Z".repeat(50);
const FAKE_STRIPE_LIVE = "sk_live_" + "Z".repeat(32);
const FAKE_SPINE_TOKEN = "sps_" + "Z".repeat(40);
const FAKE_ENV_VALUE = "Z".repeat(30);

describe("scrubSecrets", () => {
  it("redacts common env-style secrets by key name", () => {
    const input = `ANTHROPIC_API_KEY=${FAKE_ENV_VALUE}\n`;
    const r = scrubSecrets(input);
    expect(r.clean).not.toContain(FAKE_ENV_VALUE);
    expect(r.clean).toContain("[redacted");
    expect(r.hits.some((h) => h.count > 0)).toBe(true);
  });

  it("redacts a GitHub PAT", () => {
    const input = `here is my token ${FAKE_GITHUB_PAT} yes`;
    const r = scrubSecrets(input);
    expect(r.clean).not.toContain(FAKE_GITHUB_PAT);
    expect(r.hits.find((h) => h.name === "github-pat")?.count).toBe(1);
  });

  it("redacts an Anthropic key", () => {
    const r = scrubSecrets(FAKE_ANTHROPIC);
    expect(r.clean).toContain("[redacted:anthropic-key]");
    expect(r.clean).not.toContain(FAKE_ANTHROPIC);
  });

  it("redacts a Stripe live secret key", () => {
    const r = scrubSecrets(`Stripe: ${FAKE_STRIPE_LIVE} works`);
    expect(r.clean).not.toContain(FAKE_STRIPE_LIVE);
  });

  it("redacts a PEM private key block", () => {
    const input = "-----BEGIN RSA PRIVATE KEY-----\nAAAA\nBBBB\n-----END RSA PRIVATE KEY-----";
    const r = scrubSecrets(input);
    expect(r.clean).not.toContain("AAAA");
    expect(r.hits.find((h) => h.name === "pem-block")?.count).toBe(1);
  });

  it("redacts a Project Spine bearer token", () => {
    const r = scrubSecrets(`token: ${FAKE_SPINE_TOKEN}`);
    expect(r.clean).not.toContain(FAKE_SPINE_TOKEN);
  });

  it("leaves ordinary prose untouched", () => {
    const prose = "Launch the marketing site for Acme. The audience is SMB founders.";
    const r = scrubSecrets(prose);
    expect(r.clean).toBe(prose);
    expect(r.hits).toEqual([]);
  });

  it("scrubStrings aggregates hits across multiple inputs", () => {
    const { cleaned, totalHits } = scrubStrings([
      "no secret here",
      `leaked ${FAKE_GITHUB_PAT}`,
      `also leaked ${FAKE_ANTHROPIC}`,
    ]);
    expect(totalHits).toBe(2);
    expect(cleaned[0]).toBe("no secret here");
    expect(cleaned[1]).toContain("[redacted");
  });
});
