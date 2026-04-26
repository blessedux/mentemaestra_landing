/**
 * OpenRouter chat models we expose in the client portal strategist chat.
 * Every `id` must be a `:free` tier model on OpenRouter (enforced server-side).
 */

export const OPENROUTER_FREE_CHAT_MODELS = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super",
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    label: "Llama 3.2 · 3B",
  },
  {
    id: "google/gemma-2-9b-it:free",
    label: "Gemma 2 · 9B",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    label: "Mistral · 7B",
  },
] as const;

export type OpenRouterFreeChatModelId =
  (typeof OPENROUTER_FREE_CHAT_MODELS)[number]["id"];

const ALLOWED_IDS = new Set<string>(
  OPENROUTER_FREE_CHAT_MODELS.map((m) => m.id),
);

export const DEFAULT_OPENROUTER_CHAT_MODEL_ID: OpenRouterFreeChatModelId =
  "nvidia/nemotron-3-super-120b-a12b:free";

export function isAllowedOpenRouterFreeChatModel(
  id: string,
): id is OpenRouterFreeChatModelId {
  return ALLOWED_IDS.has(id);
}
