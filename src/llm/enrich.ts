import type { LlmConfig } from "./model.js";
import { scrubStrings } from "./scrubber.js";

/**
 * Rewrite the client-facing rationale's intro paragraph with sharper prose,
 * grounded in the brief goals + audience. Input/output are plain strings
 * (not markdown-aware beyond reading the goal bullets we pass in) and
 * output is wrapped with <!-- spine:ai-generated --> markers so reviewers
 * can grep for LLM content.
 *
 * Returns the original baseline prose unchanged when:
 *   - cfg is null (enrichment disabled)
 *   - the LLM call throws (network, rate limit, etc.)
 *   - the response is suspiciously short or contains refusal text
 *
 * Enrichment is never load-bearing. If everything fails, the baseline
 * paragraph still ships.
 */
export async function enrichRationaleIntro(params: {
  baseline: string;
  projectName: string;
  goals: string[];
  audience: string[];
  cfg: LlmConfig | null;
}): Promise<{ text: string; enriched: boolean; scrubbedHits: number }> {
  if (!params.cfg) return { text: params.baseline, enriched: false, scrubbedHits: 0 };

  const { cleaned: cleanedGoals, totalHits: goalHits } = scrubStrings(params.goals);
  const { cleaned: cleanedAudience, totalHits: audHits } = scrubStrings(params.audience);
  const totalHits = goalHits + audHits;

  const system =
    "You are a technical writer producing a short, honest intro paragraph for a client rationale document. Be direct and specific. Do not invent goals, audiences, or metrics that aren't in the inputs. Match the tone: professional, 2-3 sentences max, no hype words (simple, easy, powerful, cutting-edge), no emoji. If inputs are thin, say so briefly rather than padding.";
  const user = [
    `Project: ${params.projectName}`,
    "",
    "Goals (verbatim from the brief):",
    ...cleanedGoals.map((g) => `- ${g}`),
    "",
    "Audience (verbatim from the brief):",
    ...cleanedAudience.map((a) => `- ${a}`),
    "",
    "Write a 2-3 sentence intro paragraph for a client-facing rationale document explaining what this project is and who it's for. Plain prose, no headings. Do not restate the goals as a list.",
  ].join("\n");

  let text = params.baseline;
  let enriched = false;
  try {
    const res = await params.cfg.provider.complete({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      maxTokens: 400,
      temperature: 0.3,
      purpose: "rationale-intro",
    });
    const candidate = res.text.trim();
    if (
      candidate.length >= 40 &&
      candidate.length <= 1600 &&
      !/^i (cannot|can't|am unable)/i.test(candidate) &&
      !/as an ai (model|language model|assistant)/i.test(candidate)
    ) {
      text = `<!-- spine:ai-generated model=${params.cfg.provider.model} -->\n${candidate}\n<!-- /spine:ai-generated -->`;
      enriched = true;
    }
  } catch {
    // Swallow — baseline already assigned. Enrichment is opportunistic.
  }
  return { text, enriched, scrubbedHits: totalHits };
}

/**
 * Sharpen a sprint-1 item's acceptance criterion line. Input is the raw
 * goal text; output is a single-sentence, testable acceptance criterion.
 * Falls back to the baseline on any issue.
 */
export async function enrichSprintAcceptance(params: {
  baseline: string;
  goalText: string;
  projectType: string;
  cfg: LlmConfig | null;
}): Promise<{ text: string; enriched: boolean }> {
  if (!params.cfg) return { text: params.baseline, enriched: false };
  const { cleaned } = scrubStrings([params.goalText]);
  const system =
    "You write one-sentence acceptance criteria that are concrete, testable, and avoid vague verbs like 'improve' or 'optimize'. Prefer observable behavior (a user sees X, a test passes, a metric hits Y). Never invent numbers.";
  const user = `Project type: ${params.projectType}\nGoal: ${cleaned[0]}\n\nWrite one sentence describing how you'd know this goal is done. No preamble.`;
  try {
    const res = await params.cfg.provider.complete({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      maxTokens: 120,
      temperature: 0.2,
      purpose: "sprint-acceptance",
    });
    const candidate = res.text.trim().replace(/^[-*•]\s*/, "").split("\n")[0]?.trim() ?? "";
    if (candidate.length >= 15 && candidate.length <= 300 && !/^i (cannot|can't|am)/i.test(candidate)) {
      return { text: candidate, enriched: true };
    }
  } catch {
    // fall through
  }
  return { text: params.baseline, enriched: false };
}
