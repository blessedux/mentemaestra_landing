import "server-only";

import type postgres from "postgres";
import type { AnalyticsStrategy } from "./analytics-strategy";

type Sql = ReturnType<typeof postgres>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatLog = {
  id: string;
  summary: string;
  lastUserMsg: string | null;
  lastAssistantMsg: string | null;
  revisedAction: string | null;
  turnCount: number;
};

// ---------------------------------------------------------------------------
// strategy_analyses
// ---------------------------------------------------------------------------

/**
 * Upserts the daily strategy analysis for a project.
 * Uses ON CONFLICT DO UPDATE so every page load is idempotent.
 * Returns the stable UUID for this (project, date) pair.
 */
export type StrategyAnalysisUpsertResult = {
  id: string;
};

export async function upsertStrategyAnalysis(
  sql: Sql,
  projectId: string,
  strategy: AnalyticsStrategy,
  model: string | null,
): Promise<StrategyAnalysisUpsertResult> {
  const rows = await sql<{ id: string }[]>`
    INSERT INTO strategy_analyses (project_id, analysis_date, strategy, model)
    VALUES (
      ${projectId},
      CURRENT_DATE,
      ${sql.json(strategy as unknown as import("postgres").JSONValue)},
      ${model ?? null}
    )
    ON CONFLICT (project_id, analysis_date)
    DO UPDATE SET
      strategy   = EXCLUDED.strategy,
      model      = EXCLUDED.model,
      updated_at = now()
    RETURNING id
  `;
  return {
    id: rows[0].id,
  };
}

// ---------------------------------------------------------------------------
// strategy_chat_logs
// ---------------------------------------------------------------------------

/** Returns the existing summary log for a specific suggestion, or null. */
export async function getChatLog(
  sql: Sql,
  analysisId: string,
  suggestionType: "seo" | "marketing",
  suggestionIdx: number,
): Promise<ChatLog | null> {
  const rows = await sql<
    {
      id: string;
      summary: string;
      last_user_msg: string | null;
      last_assistant_msg: string | null;
      revised_action: string | null;
      turn_count: number;
    }[]
  >`
    SELECT id, summary, last_user_msg, last_assistant_msg, revised_action, turn_count
    FROM   strategy_chat_logs
    WHERE  analysis_id     = ${analysisId}
      AND  suggestion_type = ${suggestionType}
      AND  suggestion_idx  = ${suggestionIdx}
    LIMIT 1
  `;

  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    summary: r.summary,
    lastUserMsg: r.last_user_msg,
    lastAssistantMsg: r.last_assistant_msg,
    revisedAction: r.revised_action,
    turnCount: r.turn_count,
  };
}

/**
 * Upserts the rolling chat log for a suggestion.
 * Called after each assistant response (background, via `after()`).
 */
export async function upsertChatLog(
  sql: Sql,
  analysisId: string,
  suggestionType: "seo" | "marketing",
  suggestionIdx: number,
  summary: string,
  lastUserMsg: string,
  lastAssistantMsg: string,
  revisedAction: string | null,
): Promise<void> {
  await sql`
    INSERT INTO strategy_chat_logs
      (analysis_id, suggestion_type, suggestion_idx,
       summary, last_user_msg, last_assistant_msg, revised_action, turn_count)
    VALUES (
      ${analysisId}, ${suggestionType}, ${suggestionIdx},
      ${summary}, ${lastUserMsg}, ${lastAssistantMsg},
      ${revisedAction ?? null}, 1
    )
    ON CONFLICT (analysis_id, suggestion_type, suggestion_idx)
    DO UPDATE SET
      summary            = EXCLUDED.summary,
      last_user_msg      = EXCLUDED.last_user_msg,
      last_assistant_msg = EXCLUDED.last_assistant_msg,
      -- Caller passes the resolved title (new, kept previous, or null to clear junk).
      revised_action     = EXCLUDED.revised_action,
      turn_count         = strategy_chat_logs.turn_count + 1,
      updated_at         = now()
  `;
}
