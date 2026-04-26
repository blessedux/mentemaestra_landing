import { after } from "next/server";
import { streamText, generateObject } from "ai";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { readPortalSession } from "@/lib/portal-access";
import { getChatModel } from "@/lib/analytics-llm";
import { getChatLog, upsertChatLog } from "@/lib/analytics-strategy-store";
import { sanitizeRevisedActionTitle } from "@/lib/revised-action-sanitize";

// ---------------------------------------------------------------------------
// Types shared with client
// ---------------------------------------------------------------------------

export type ChatContext = {
  summary: string | null;
  lastUserMsg: string | null;
  lastAssistantMsg: string | null;
  turnCount: number;
  revisedAction?: string | null;
};

type RouteParams = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function validateSession(slug: string): Promise<boolean> {
  const session = await readPortalSession();
  return Boolean(session && session.slug === slug);
}

/**
 * Short base for portal chat only. Do not concatenate with MASTER_PROMPT here:
 * long stacked rule lists cause models to narrate compliance instead of answering.
 */
const PORTAL_STRATEGIST_CHAT_CORE = `Eres el estratega de MenteMaestra (Chile). Español de Chile, tono directo. No inventes datos que no estén en el contexto de abajo. Prioriza acciones que ayuden a conversiones o leads por el sitio. Deja explícitas prioridades y acuerdos del cliente.`;

/**
 * Builds the system prompt for the strategist chat.
 * Injects the historical summary instead of raw messages — keeps token usage minimal.
 */
function buildChatSystemPrompt(
  suggestionType: "seo" | "marketing",
  suggestionJson: string,
  strategyBrief: string,
  log: { summary: string; lastUserMsg?: string | null; lastAssistantMsg?: string | null } | null,
): string {
  const suggestionLabel = suggestionType === "seo" ? "SEO" : "Marketing";
  let suggestion = "";
  try {
    const parsed = JSON.parse(suggestionJson) as Record<string, string>;
    suggestion = Object.entries(parsed)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
  } catch {
    suggestion = suggestionJson;
  }

  const contextBlock =
    log?.summary
      ? `\nHISTORIAL PREVIO (resumido):\n${log.summary}${
          log.lastUserMsg
            ? `\n\nÚLTIMO INTERCAMBIO:\nCliente: ${log.lastUserMsg}\nEstratega: ${log.lastAssistantMsg ?? ""}`
            : ""
        }`
      : "";

  return `${PORTAL_STRATEGIST_CHAT_CORE}

[Contexto — no lo copies tal cual; úsalo para responder]
Tipo: ${suggestionLabel}
Sugerencia: ${suggestion}
Brief: ${strategyBrief}
${contextBlock}

Tu mensaje al cliente empieza ya contestando su último mensaje (sin preámbulos tipo "entendido", sin listar reglas, sin inglés, sin describir "lo que harás": hazlo). 2–4 oraciones concretas; luego tres líneas que empiecen con "- " (imperativo + detalle verificable). Si piden tarea para el equipo: una viñeta "- Para el equipo: …" y otra "- Listo cuando: …".

Cierra con exactamente:
---ACCIONES---
verbo | verbo | verbo
(tres imperativos en español, máx. 7 palabras cada uno.)`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips the ---ACCIONES--- section so it isn't included in chat summaries. */
function stripActionsSection(text: string): string {
  const idx = text.indexOf("---ACCIONES---");
  return idx >= 0 ? text.slice(0, idx).trim() : text.trim();
}

// ---------------------------------------------------------------------------
// Summarization schema — extracts summary + any corrected action
// ---------------------------------------------------------------------------

const SummarizationSchema = z.object({
  summary: z
    .string()
    .describe(
      "Resumen consolidado en español, máximo 90 palabras: acuerdos, prioridades, restricciones del cliente y próximo paso. Evita recapitular métricas del contexto salvo que el cliente las haya debatido.",
    ),
  revisedAction: z
    .string()
    .nullable()
    .describe(
      "SOLO si el cliente pidió explícitamente un título/acción distinto al original: el nuevo texto breve (máx. 14 palabras), en español. En cualquier otro caso (preguntas, matices, plan sin cambiar el titular) devuelve null exactamente. Nunca devuelvas puntuación sola, placeholders ni ':'",
    ),
});

/**
 * Summarizes the conversation and optionally extracts a revised action.
 * Runs in the background via after() — does NOT block the streaming response.
 */
async function summarizeConversation(
  existingSummary: string | null,
  sessionMessages: Array<{ role: string; content: string }>,
  newAssistantText: string,
  originalSuggestionTitle: string,
): Promise<{ summary: string; revisedAction: string | null }> {
  const transcript = [
    ...sessionMessages,
    { role: "assistant", content: newAssistantText },
  ]
    .map((m) => `${m.role === "user" ? "Cliente" : "Estratega"}: ${m.content}`)
    .join("\n");

  const contextPart = existingSummary
    ? `Resumen previo:\n${existingSummary}\n\nNueva conversación:\n${transcript}`
    : `Conversación:\n${transcript}`;

  const titleLine = originalSuggestionTitle
    ? `TÍTULO ACTUAL DE LA SUGERENCIA (referencia; revisedAction=null salvo cambio explícito):\n«${originalSuggestionTitle}»\n\n`
    : "";

  const { object } = await generateObject({
    model: getChatModel(),
    schema: SummarizationSchema,
    maxRetries: 0,
    prompt: `Analiza esta conversación de estrategia digital y genera el objeto JSON solicitado.

${titleLine}summary: texto claro en español (máx. 90 palabras). Prioriza **acuerdos**, **prioridades** y **restricciones** que el cliente expresó. No recapitules listas de métricas del contexto salvo que el cliente las haya discutido explícitamente. Sin relleno genérico.

${contextPart}`,
  });

  const summary = object.summary.trim();
  let revisedAction = sanitizeRevisedActionTitle(object.revisedAction);
  const orig = originalSuggestionTitle.trim();
  if (
    revisedAction &&
    orig &&
    revisedAction.localeCompare(orig, "es", { sensitivity: "accent" }) === 0
  ) {
    revisedAction = null;
  }

  return { summary, revisedAction };
}

function extractSuggestionTitle(
  suggestionJson: string,
  suggestionType: "seo" | "marketing",
): string {
  try {
    const o = JSON.parse(suggestionJson) as Record<string, unknown>;
    if (suggestionType === "seo") {
      return String(o.action ?? "").trim();
    }
    return String(o.idea ?? "").trim();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// GET — load existing chat context for a suggestion
// ---------------------------------------------------------------------------

export async function GET(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!(await validateSession(slug))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const analysisId = url.searchParams.get("analysisId");
  const type = url.searchParams.get("type") as "seo" | "marketing" | null;
  const idx = Number(url.searchParams.get("idx") ?? "0");

  if (!analysisId || !type) {
    return Response.json({
      summary: null,
      lastUserMsg: null,
      lastAssistantMsg: null,
      turnCount: 0,
      revisedAction: null,
    } satisfies ChatContext);
  }

  const sql = getDb();
  if (!sql) {
    return Response.json({
      summary: null,
      lastUserMsg: null,
      lastAssistantMsg: null,
      turnCount: 0,
      revisedAction: null,
    } satisfies ChatContext);
  }

  const log = await getChatLog(sql, analysisId, type, idx).catch(() => null);

  const ctx: ChatContext = {
    summary: log?.summary?.trim() ? log.summary.trim() : null,
    lastUserMsg: log?.lastUserMsg?.trim() ? log.lastUserMsg.trim() : null,
    lastAssistantMsg: log?.lastAssistantMsg?.trim()
      ? log.lastAssistantMsg.trim()
      : null,
    turnCount: log?.turnCount ?? 0,
    revisedAction: sanitizeRevisedActionTitle(log?.revisedAction ?? null),
  };
  return Response.json(ctx);
}

// ---------------------------------------------------------------------------
// POST — stream strategist response + background summarization
// ---------------------------------------------------------------------------

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!(await validateSession(slug))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    messages: Array<{ role: string; content: string }>;
    analysisId: string | null;
    suggestionType: "seo" | "marketing";
    idx: number;
    suggestionJson: string;
    strategyBrief: string;
    model?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const {
    messages,
    analysisId,
    suggestionType,
    idx,
    suggestionJson,
    strategyBrief,
    model: requestedModel,
  } = body;

  // Load existing summary for context (best-effort)
  const sql = getDb();
  const existingLog =
    sql && analysisId
      ? await getChatLog(sql, analysisId, suggestionType, idx).catch(() => null)
      : null;

  const systemPrompt = buildChatSystemPrompt(
    suggestionType,
    suggestionJson,
    strategyBrief,
    existingLog,
  );

  // Capture streamed text for background summarization
  let capturedText = "";
  let resolveFinish!: () => void;
  const waitForFinish = new Promise<void>((resolve) => {
    resolveFinish = resolve;
  });

  const result = streamText({
    model: getChatModel(requestedModel),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    temperature: 0.28,
    maxOutputTokens: 520,
    maxRetries: 0,
    onFinish: ({ text }) => {
      // Strip the ---ACCIONES--- section — it's UI-only, shouldn't enter summaries
      capturedText = stripActionsSection(text);
      resolveFinish();
    },
  });

  // Schedule background summarization + DB save (runs after response is sent)
  if (sql && analysisId) {
    after(async () => {
      await waitForFinish;
      try {
        const lastUserMsg =
          [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const originalTitle = extractSuggestionTitle(
          suggestionJson,
          suggestionType,
        );
        const { summary, revisedAction } = await summarizeConversation(
          existingLog?.summary ?? null,
          messages,
          capturedText,
          originalTitle,
        );
        const prevSan = sanitizeRevisedActionTitle(
          existingLog?.revisedAction ?? null,
        );
        const revisedToStore = revisedAction ?? prevSan ?? null;
        await upsertChatLog(
          sql,
          analysisId,
          suggestionType,
          idx,
          summary,
          lastUserMsg,
          capturedText,
          revisedToStore,
        );
      } catch (err) {
        console.error("[analytics-chat] background summarization failed", err);
      }
    });
  }

  return result.toTextStreamResponse();
}
