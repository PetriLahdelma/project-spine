/**
 * LLM provider abstraction for Project Spine.
 *
 * Invariant: the LLM layer is **never load-bearing**. It can only *add*
 * non-structural fields (e.g. prose paragraphs) to artefacts that are
 * already complete without it. Everything in .project-spine/spine.json is
 * produced deterministically; enrichment runs *after* the compiler and is
 * marked with <!-- spine:ai-generated --> HTML comments so reviewers know
 * what to audit.
 *
 * Callers that need enrichment opt in explicitly via the --enrich flag
 * or a non-null provider in the compile input; otherwise enrichment is a
 * no-op and the offline output is unchanged.
 */

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmRequest = {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Optional label used for logging and rate-limit buckets (not sent to the provider). */
  purpose?: string;
};

export type LlmResponse = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  complete(req: LlmRequest): Promise<LlmResponse>;
}

export type LlmConfig = {
  provider: LlmProvider;
  /** Opt-out helper. If false, enrichment callers skip the LLM and return input unchanged. */
  enabled: boolean;
};
