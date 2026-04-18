# LLM enrichment — opt-in, never load-bearing

Project Spine's compile pipeline is fully deterministic. The LLM layer only *adds* prose on top of artefacts that are already complete without it — it can never change the canonical `spine.json`, the export manifest, or any structural rule. If the LLM call fails, times out, or returns suspicious text, the deterministic output ships unchanged.

## Enable it

```bash
export ANTHROPIC_API_KEY=sk-ant-...
spine compile --brief ./brief.md --repo . --enrich
```

`--enrich` without the key is a silent no-op, not an error — the compile runs deterministically as always.

## What gets enriched today (v0.8.0)

| Artefact | Section | Size |
|---|---|---|
| `rationale.md` | Intro paragraph before "What we are building" | 1 call, ~400 tokens |

Every enriched block is wrapped in HTML comments so reviewers can see exactly what the model wrote:

```html
<!-- spine:ai-generated model=claude-sonnet-4-6 -->
… prose here …
<!-- /spine:ai-generated -->
```

Grep for `spine:ai-generated` to audit.

## Guarantees

- **Secrets scrubber** runs on every string before it hits the provider: env-style assignments (`*_KEY`, `*_SECRET`, …), GitHub PATs, Anthropic/OpenAI/Stripe/Slack/AWS keys, PEM private-key blocks, and Spine's own bearer tokens. See [`src/llm/scrubber.ts`](../src/llm/scrubber.ts) and its tests.
- **Opt-in only.** No LLM calls happen without `--enrich` AND an explicit API key in env.
- **No retries on failure.** A network error or policy refusal silently falls back to the deterministic baseline; no exponential-backoff loops that rack up cost.
- **Sanity checks on output.** Response must be 40–1600 chars and not contain common AI refusal patterns; otherwise the baseline ships.
- **Bounded cost.** Exactly 1 LLM call per `spine compile --enrich` today. Adding more enrichment sites is an explicit decision, not a gradient.

## What we explicitly *don't* enrich

- `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md` — agent instruction files need to reflect repo reality exactly. No prose padding.
- `spine.json` — canonical, reproducible, hashable. LLM contamination breaks drift detection by definition.
- `warnings.json` — the surface where Spine tells you what it detected. Must be deterministic.
- Source pointers — every rule traces back to `brief.md#…` or `inferred:…`. We won't let the LLM hallucinate a source.

## Cost and performance

Claude Sonnet 4.6 @ ~400 tokens in, ~200 out per compile. With current pricing that's on the order of USD 0.001 per `--enrich` run. A CI pipeline running drift+compile on every PR shouldn't see meaningful cost; a one-off agency kickoff is rounding error.

## Provider selection

- Default: Anthropic (Claude Sonnet 4.6) via `ANTHROPIC_API_KEY`.
- Model override: `ANTHROPIC_MODEL=claude-opus-4-7 spine compile --enrich`.
- Other providers: swap in a custom `LlmProvider` via the SDK-style import (`src/llm/index.ts`) and call `compileSpine` programmatically. No OpenAI/Gemini wrapper ships in v0.8.0.

## When NOT to use `--enrich`

- Hard-offline environments.
- CI pipelines where network access to `api.anthropic.com` isn't allowed.
- Production releases where reproducibility is a requirement — the same inputs produce the same hash with or without `--enrich`, but LLM prose can vary between runs (temperature > 0). Run compile without `--enrich` before tagging a release.
