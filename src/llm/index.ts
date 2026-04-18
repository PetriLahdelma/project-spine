import type { LlmConfig, LlmProvider } from "./model.js";
import { createAnthropicProvider } from "./anthropic.js";

export type { LlmConfig, LlmProvider, LlmRequest, LlmResponse, LlmMessage } from "./model.js";
export { createAnthropicProvider } from "./anthropic.js";
export { scrubSecrets, scrubStrings } from "./scrubber.js";

export type EnrichOptions = {
  /** Explicit provider. If omitted, we try to construct one from ANTHROPIC_API_KEY. */
  provider?: LlmProvider;
  /** Hard opt-out: `false` short-circuits every enrich call to return input unchanged. */
  enabled?: boolean;
};

/**
 * Build an LLM config from EnrichOptions, env vars, and defaults.
 * - enabled: true iff either a provider is passed OR ANTHROPIC_API_KEY is set
 *            AND opts.enabled !== false.
 */
export function resolveLlmConfig(opts: EnrichOptions = {}): LlmConfig | null {
  if (opts.enabled === false) return null;
  let provider = opts.provider;
  if (!provider) {
    const key = process.env["ANTHROPIC_API_KEY"];
    if (!key) return null;
    provider = createAnthropicProvider({
      apiKey: key,
      ...(process.env["ANTHROPIC_MODEL"] ? { model: process.env["ANTHROPIC_MODEL"] } : {}),
    });
  }
  return { provider, enabled: true };
}
