"use client";

import { useEffect, useRef, useState } from "react";
import type { SeoPriority, MarketingIdea } from "@/lib/analytics-strategy";
import type { ChatContext } from "@/app/api/client/[slug]/analytics-chat/route";
import {
  DEFAULT_OPENROUTER_CHAT_MODEL_ID,
  OPENROUTER_FREE_CHAT_MODELS,
  isAllowedOpenRouterFreeChatModel,
  type OpenRouterFreeChatModelId,
} from "@/lib/openrouter-chat-models";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SuggestionItem = SeoPriority | MarketingIdea;
type SuggestionType = "seo" | "marketing";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Quick-follow-up suggestions parsed from ---ACCIONES--- section. */
  actions?: string[];
}

const CHAT_MODEL_STORAGE_KEY = "mm_portal_analytics_chat_model";

function readStoredChatModelId(): OpenRouterFreeChatModelId {
  if (typeof window === "undefined") return DEFAULT_OPENROUTER_CHAT_MODEL_ID;
  try {
    const raw = localStorage.getItem(CHAT_MODEL_STORAGE_KEY);
    if (raw && isAllowedOpenRouterFreeChatModel(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_OPENROUTER_CHAT_MODEL_ID;
}

interface Props {
  slug: string;
  analysisId: string | null;
  suggestionType: SuggestionType;
  suggestionIdx: number;
  suggestion: SuggestionItem;
  strategyBrief: string;
  showOpenRouterModelPicker?: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Math.random().toString(36).slice(2);
}

/**
 * Strips <think>…</think> blocks (complete or partial mid-stream).
 */
function stripThinkingBlocks(text: string): string {
  let result = text.replace(/<(think|thinking)>[\s\S]*?<\/(think|thinking)>/gi, "");
  result = result.replace(/<(think|thinking)>[\s\S]*$/i, "");
  return result.trimStart();
}

/**
 * Splits the model response into the visible text and the action suggestions.
 * The model is instructed to end with:
 *   ---ACCIONES---
 *   acción 1 | acción 2 | acción 3
 */
function parseResponse(raw: string): { text: string; actions: string[] } {
  const idx = raw.indexOf("---ACCIONES---");
  if (idx === -1) return { text: raw.trim(), actions: [] };
  const text = raw.slice(0, idx).trim();
  const actionsRaw = raw.slice(idx + "---ACCIONES---".length).trim();
  const actions = actionsRaw
    .split("|")
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 3);
  return { text, actions };
}

function truncateLine(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Copy for the header callout: prefer rolling summary; if empty, show the last
 * user + strategist lines so reopening a thread is never a blank card.
 */
function conversationInsight(ctx: ChatContext): string | null {
  const sum = ctx.summary?.trim();
  if (sum) return sum;
  const u = ctx.lastUserMsg?.trim();
  const a = ctx.lastAssistantMsg?.trim();
  if (!u && !a) return null;
  const parts: string[] = [];
  if (u) parts.push(`Tu último mensaje: «${truncateLine(u, 220)}»`);
  if (a) parts.push(`Estratega: «${truncateLine(a, 300)}»`);
  return parts.join("\n\n");
}

function isSeo(s: SuggestionItem): s is SeoPriority {
  return "action" in s;
}

const IMPACT: Record<string, string> = {
  alto: "text-emerald-400",
  medio: "text-[#c9a07a]",
  bajo: "text-zinc-500",
};
const EFFORT: Record<string, string> = {
  alto: "text-red-400",
  medio: "text-amber-400",
  bajo: "text-emerald-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SuggestionChatModal({
  slug,
  analysisId,
  suggestionType,
  suggestionIdx,
  suggestion,
  strategyBrief,
  showOpenRouterModelPicker = false,
  onClose,
}: Props) {
  const [chatModelId, setChatModelId] = useState<OpenRouterFreeChatModelId>(
    readStoredChatModelId,
  );
  const [ctx, setCtx] = useState<ChatContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing context on mount
  useEffect(() => {
    if (!analysisId) {
      setLoadingCtx(false);
      return;
    }
    const params = new URLSearchParams({
      analysisId,
      type: suggestionType,
      idx: String(suggestionIdx),
    });
    fetch(`/api/client/${slug}/analytics-chat?${params}`)
      .then((r) => r.json())
      .then((data: ChatContext) => setCtx(data))
      .catch(() => setCtx(null))
      .finally(() => setLoadingCtx(false));
  }, [analysisId, slug, suggestionType, suggestionIdx]);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Focus input after context loads
  useEffect(() => {
    if (!loadingCtx) inputRef.current?.focus();
  }, [loadingCtx]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Refresh model from storage when this window opens (picker visible)
  useEffect(() => {
    if (showOpenRouterModelPicker) setChatModelId(readStoredChatModelId());
  }, [showOpenRouterModelPicker]);

  function persistChatModelId(id: OpenRouterFreeChatModelId) {
    setChatModelId(id);
    try {
      localStorage.setItem(CHAT_MODEL_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  async function sendMessage(e: React.FormEvent | string) {
    let text: string;
    if (typeof e === "string") {
      text = e;
    } else {
      e.preventDefault();
      text = input.trim();
    }
    if (!text || isStreaming) return;

    const userMsg: Message = { id: uid(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch(`/api/client/${slug}/analytics-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          analysisId,
          suggestionType,
          idx: suggestionIdx,
          suggestionJson: JSON.stringify(suggestion),
          strategyBrief,
          ...(showOpenRouterModelPicker ? { model: chatModelId } : {}),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        // During streaming, show the text portion only (hide ---ACCIONES--- and below)
        const visible = stripThinkingBlocks(full).trimStart();
        const { text: visibleText } = parseResponse(visible);
        setStreamingText(visibleText || visible);
      }

      const cleaned = stripThinkingBlocks(full).trim();
      const { text: finalText, actions } = parseResponse(cleaned);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: finalText || cleaned,
          actions,
        },
      ]);
      setStreamingText("");
    } catch (err) {
      console.error("[SuggestionChatModal] stream error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "No pude procesar la solicitud. Intenta de nuevo.",
        },
      ]);
      setStreamingText("");
    }

    setIsStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(e as unknown as React.FormEvent);
    }
  }

  const insight =
    !loadingCtx && ctx ? conversationInsight(ctx) : null;
  const hasHistory = Boolean(insight);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div className="relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl shadow-black/60">

        {/* ── Header: suggestion card ─────────────────────────────── */}
        <div className="shrink-0 border-b border-zinc-800/60 p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              {suggestionType === "seo" ? "SEO" : "Marketing"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {isSeo(suggestion) ? (
            <>
              <p className="text-sm font-medium text-zinc-100">{suggestion.action}</p>
              <p className="mt-1 text-xs text-zinc-500">{suggestion.target}</p>
              <div className="mt-2 flex gap-3 text-[11px]">
                <span>
                  Impacto:{" "}
                  <span className={`font-semibold ${IMPACT[suggestion.impact] ?? ""}`}>
                    {suggestion.impact}
                  </span>
                </span>
                <span>
                  Esfuerzo:{" "}
                  <span className={`font-semibold ${EFFORT[suggestion.effort] ?? ""}`}>
                    {suggestion.effort}
                  </span>
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="mb-1.5 inline-block rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-zinc-400">
                {(suggestion as MarketingIdea).channel}
              </span>
              <p className="text-sm font-medium text-zinc-100">
                {(suggestion as MarketingIdea).idea}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                <span className="text-zinc-600">Dato base: </span>
                {(suggestion as MarketingIdea).dataAnchor}
              </p>
            </>
          )}

          {hasHistory && insight && (
            <div className="mt-3 space-y-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                {ctx?.summary?.trim()
                  ? "Resumen de la conversación"
                  : "Contexto de tu última charla"}
              </p>
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-zinc-500">
                {insight}
              </p>
              {ctx && ctx.turnCount > 0 && (
                <p className="text-[10px] text-zinc-700">
                  {ctx.turnCount} intercambio{ctx.turnCount !== 1 ? "s" : ""} · Puedes
                  continuar o empezar de nuevo
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Messages ───────────────────────────────────────────── */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loadingCtx && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-800" />
              ))}
            </div>
          )}

          {!loadingCtx && messages.length === 0 && !streamingText.trim() && (
            <p className="text-center text-xs text-zinc-600">
              Pregunta sobre esta sugerencia o pide un plan de acción concreto.
            </p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-zinc-800 text-zinc-100"
                    : "border border-zinc-800/60 bg-zinc-900/50 text-zinc-300"
                }`}
              >
                {m.content}
              </div>

              {/* Quick action buttons (assistant messages only) */}
              {m.role === "assistant" && m.actions && m.actions.length > 0 && (
                <div className="mt-2 flex max-w-[85%] flex-wrap gap-1.5">
                  {m.actions.map((action, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isStreaming}
                      onClick={() => {
                        setInput(action);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-zinc-700/70 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Streaming in progress */}
          {streamingText.trim() && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-300">
                {streamingText.trim()}
                <span className="ml-px inline-block h-[1em] w-[2px] translate-y-[1px] animate-pulse bg-zinc-500 opacity-70" />
              </div>
            </div>
          )}

          {isStreaming && !streamingText.trim() && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ─────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-zinc-800/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(e);
            }}
            className="flex items-end gap-2.5"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta, corrige o pide un plan…"
              rows={1}
              disabled={isStreaming || loadingCtx}
              className="flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-600 disabled:opacity-40"
              style={{ maxHeight: "7rem", overflowY: "auto" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming || loadingCtx}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Enviar"
            >
              <SendIcon />
            </button>
          </form>

          <div className="mt-3 flex items-center justify-end gap-2">
            {showOpenRouterModelPicker ? (
              <div className="relative mr-auto flex min-w-0 max-w-[min(100%,14rem)] items-center">
                <ModelIcon className="pointer-events-none absolute left-2 h-3 w-3 text-zinc-600" />
                <select
                  value={chatModelId}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (isAllowedOpenRouterFreeChatModel(v))
                      persistChatModelId(v);
                  }}
                  disabled={isStreaming || loadingCtx}
                  className="w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-6 pr-6 text-[11px] text-zinc-500 outline-none transition focus:border-zinc-700 hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Seleccionar modelo"
                >
                  {OPENROUTER_FREE_CHAT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronIcon className="pointer-events-none absolute right-1.5 h-3 w-3 text-zinc-600" />
              </div>
            ) : null}

            <button
              type="button"
              disabled
              title="Próximamente: crear una tarea desde esta conversación"
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-zinc-600 opacity-50"
            >
              <TicketIcon className="h-3 w-3" />
              Crear tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function ModelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
