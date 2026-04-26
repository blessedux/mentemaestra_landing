import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import {
  DEFAULT_OPENROUTER_CHAT_MODEL_ID,
  isAllowedOpenRouterFreeChatModel,
} from "@/lib/openrouter-chat-models";

// ---------------------------------------------------------------------------
// Provider factories
// ---------------------------------------------------------------------------

function buildOpenRouterProvider(title: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://mentemaestra.cl";
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY!,
    headers: {
      "HTTP-Referer": siteUrl,
      "X-Title": title,
    },
  });
}

// ---------------------------------------------------------------------------
// Analytics model — for daily strategy generation (generateObject)
// ---------------------------------------------------------------------------

/**
 * Quality model used for daily cached strategy generation.
 *
 * Uses `provider(model)` (Responses API) because AI SDK v3 `generateObject`
 * works correctly with OpenRouter via the Responses API. Using `provider.chat()`
 * here would trigger tool-calling mode, which Nemotron's free tier doesn't support.
 *
 * Priority: OPENROUTER_API_KEY → OPENAI_API_KEY
 */
export function getAnalyticsModel(): LanguageModel {
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (openrouterKey) {
    const provider = buildOpenRouterProvider("MenteMaestra Analytics");
    const model =
      process.env.ANALYTICS_LLM_MODEL?.trim() ??
      "nvidia/nemotron-3-super-120b-a12b:free";
    // Uses AI SDK default (Responses API) — required for generateObject on OpenRouter
    return provider(model);
  }

  if (openaiKey) {
    const provider = createOpenAI({ apiKey: openaiKey });
    const model = process.env.ANALYTICS_LLM_MODEL?.trim() ?? "gpt-4o-mini";
    return provider(model);
  }

  throw new Error(
    "[analytics-llm] No LLM provider configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
  );
}

// ---------------------------------------------------------------------------
// Chat model — for real-time streaming chat responses
// ---------------------------------------------------------------------------

/**
 * True when OpenRouter is the configured provider (portal chat model picker applies).
 */
export function isOpenRouterApiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

/**
 * Fast model for real-time strategist chat.
 *
 * Uses `provider.chat(model)` on OpenRouter to force the Chat Completions API
 * (/v1/chat/completions), which `streamText` requires there.
 *
 * @param clientModelId — optional id from the portal UI; only applied when it
 *   passes `isAllowedOpenRouterFreeChatModel` (OpenRouter free tier only).
 *   Otherwise falls back to ANALYTICS_CHAT_MODEL → ANALYTICS_LLM_MODEL → default.
 */
export function getChatModel(clientModelId?: string | null): LanguageModel {
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (openrouterKey) {
    const provider = buildOpenRouterProvider("MenteMaestra Chat");
    const fromClient =
      clientModelId && isAllowedOpenRouterFreeChatModel(clientModelId)
        ? clientModelId
        : null;
    // Fallback chain: client pick → env overrides → default free tier
    const model =
      fromClient ??
      process.env.ANALYTICS_CHAT_MODEL?.trim() ??
      process.env.ANALYTICS_LLM_MODEL?.trim() ??
      DEFAULT_OPENROUTER_CHAT_MODEL_ID;
    // .chat() forces /v1/chat/completions — required for streamText on OpenRouter
    return provider.chat(model);
  }

  if (openaiKey) {
    const provider = createOpenAI({ apiKey: openaiKey });
    return provider("gpt-4o-mini");
  }

  throw new Error(
    "[analytics-llm] No LLM provider configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
  );
}

export function isAnalyticsLlmConfigured(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
}
