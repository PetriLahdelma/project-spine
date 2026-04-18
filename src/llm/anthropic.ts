import type { LlmProvider, LlmRequest, LlmResponse } from "./model.js";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";
const BASE_URL = "https://api.anthropic.com/v1/messages";

export type AnthropicOptions = {
  apiKey: string;
  model?: string;
  maxTokens?: number;
};

export function createAnthropicProvider(opts: AnthropicOptions): LlmProvider {
  const model = opts.model ?? DEFAULT_MODEL;
  const defaultMax = opts.maxTokens ?? 1024;

  return {
    name: "anthropic",
    model,
    async complete(req: LlmRequest): Promise<LlmResponse> {
      const system = req.messages.find((m) => m.role === "system")?.content ?? undefined;
      const nonSystem = req.messages.filter((m) => m.role !== "system");
      const body = {
        model,
        max_tokens: req.maxTokens ?? defaultMax,
        temperature: req.temperature ?? 0.2,
        ...(system ? { system } : {}),
        messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
      };

      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "x-api-key": opts.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
          "user-agent": "project-spine-cli/llm",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`anthropic ${res.status}: ${text.slice(0, 400)}`);
      }
      const json = (await res.json()) as {
        content: Array<{ type: string; text?: string }>;
        model: string;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = (json.content ?? [])
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text as string)
        .join("");
      return {
        text,
        model: json.model,
        inputTokens: json.usage?.input_tokens ?? 0,
        outputTokens: json.usage?.output_tokens ?? 0,
      };
    },
  };
}
