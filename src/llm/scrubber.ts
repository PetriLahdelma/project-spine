/**
 * Pre-flight secret scrubber. We run every string we'd send to an LLM through
 * a set of redaction patterns so a brief accidentally containing `.env`
 * contents, private keys, or auth tokens doesn't leak to a third-party API.
 *
 * This is conservative by design — false positives are cheap (a redacted
 * value stays `[redacted]` in the prompt and the LLM sees placeholder text);
 * false negatives are expensive (secret in the prompt, secret in the
 * provider's logs).
 */

type Pattern = { name: string; re: RegExp; replace?: string };

const PATTERNS: Pattern[] = [
  // Environment-style assignments
  {
    name: "env-assignment",
    // KEY=SOMETHING or KEY: something; keep the key, redact the value
    re: /\b([A-Z][A-Z0-9_]{4,}(?:_KEY|_SECRET|_TOKEN|_PASSWORD|_PASS|_PWD|_API|_ACCESS|_PRIVATE))\s*[=:]\s*["']?[^\s"']{8,}["']?/g,
    replace: "$1=[redacted]",
  },
  // GitHub tokens
  { name: "github-pat", re: /\bghp_[A-Za-z0-9]{36,}\b/g },
  { name: "github-oauth", re: /\bgho_[A-Za-z0-9]{36,}\b/g },
  { name: "github-user-token", re: /\bghu_[A-Za-z0-9]{36,}\b/g },
  { name: "github-server-token", re: /\bghs_[A-Za-z0-9]{36,}\b/g },
  { name: "github-refresh", re: /\bghr_[A-Za-z0-9]{76,}\b/g },
  // Anthropic / OpenAI
  { name: "anthropic-key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "openai-key", re: /\bsk-[A-Za-z0-9_-]{40,}\b/g },
  { name: "openai-project-key", re: /\bsk-proj-[A-Za-z0-9_-]{40,}\b/g },
  // Vercel / Stripe / Slack / generic
  { name: "vercel-token", re: /\bvercel_[a-z0-9_]{24,}\b/g },
  { name: "stripe-live", re: /\b(?:sk|pk|rk)_live_[A-Za-z0-9]{24,}\b/g },
  { name: "stripe-test", re: /\b(?:sk|pk|rk)_test_[A-Za-z0-9]{24,}\b/g },
  { name: "slack-token", re: /\bxox[aboprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "aws-access-key", re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  // Project Spine's own bearer format
  { name: "spine-token", re: /\bsps_[A-Za-z0-9_-]{20,}\b/g },
  // PEM blocks
  {
    name: "pem-block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END [^-]+-----/g,
  },
];

export type ScrubResult = {
  clean: string;
  hits: { name: string; count: number }[];
};

export function scrubSecrets(input: string): ScrubResult {
  let out = input;
  const hits: Record<string, number> = {};
  for (const p of PATTERNS) {
    let count = 0;
    out = out.replace(p.re, (match, ...groups) => {
      count++;
      if (p.replace) {
        // Substitute with capture groups ($1, $2, etc.)
        return p.replace.replace(/\$(\d+)/g, (_, n) => {
          const i = Number(n) - 1;
          return typeof groups[i] === "string" ? (groups[i] as string) : "";
        });
      }
      return `[redacted:${p.name}]`;
    });
    if (count > 0) hits[p.name] = (hits[p.name] ?? 0) + count;
  }
  return {
    clean: out,
    hits: Object.entries(hits).map(([name, count]) => ({ name, count })),
  };
}

/** Convenience: scrub every string in an array; return cleaned + total hit count. */
export function scrubStrings(inputs: string[]): { cleaned: string[]; totalHits: number } {
  let totalHits = 0;
  const cleaned = inputs.map((s) => {
    const r = scrubSecrets(s);
    totalHits += r.hits.reduce((a, b) => a + b.count, 0);
    return r.clean;
  });
  return { cleaned, totalHits };
}
