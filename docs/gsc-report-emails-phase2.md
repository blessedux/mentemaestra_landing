# GSC Report Emails — Phase 2 roadmap

This document describes the planned automated email reporting system that builds on the MVP GSC dashboard. **No scheduling code exists yet** — this is the design reference for when we implement it.

---

## Goal

Every project with GSC connected can opt into periodic email reports sent to their allowlisted stakeholders. Reports include:

- **Performance summary** — clicks, impressions, CTR, position vs. prior period.
- **Rule-based recommendations** — actionable SEO nudges (e.g. low-CTR high-impression queries, falling positions, thin-traffic pages).
- **Calendar-driven campaign nudges** — seasonal or date-triggered marketing suggestions (e.g. 2 weeks before Navidad, Día de la Madre, CyberMonday Chile, etc.).

---

## Architecture

### 1. Opt-in & frequency config (DB)

Add a `project_report_settings` table:

```sql
CREATE TABLE project_report_settings (
  project_id  UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  frequency   TEXT NOT NULL DEFAULT 'monthly',  -- 'weekly' | 'monthly'
  recipients  TEXT[] NOT NULL DEFAULT '{}',     -- subset of allowlist (empty = all)
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Operator toggles this from the internal project detail panel (future addition to `ProjectDetailPanel`).

### 2. Report generator (`src/lib/gsc-report-generator.ts`)

A pure function that takes `GscDashboardData` + prior period data and returns a structured `Report` object:

```ts
type ReportSection =
  | { kind: 'summary';       data: GscOverview;      prevData: GscOverview }
  | { kind: 'top_queries';   data: GscQueryRow[] }
  | { kind: 'top_pages';     data: GscPageRow[] }
  | { kind: 'recommendations'; items: string[] }
  | { kind: 'campaign_nudge';  message: string; date: string };

type Report = {
  projectId: string;
  projectName: string;
  propertyUrl: string;
  generatedAt: string;
  sections: ReportSection[];
};
```

**Recommendation rules (initial set):**
- Queries with impressions > 100 and CTR < 2% → "Optimiza el title/description para [query]."
- Pages that dropped > 3 positions vs. prior 28d → "La página [url] perdió posicionamiento."
- No clicks in 28d on pages that had clicks previously → "La página [url] dejó de recibir clics."

**Calendar nudges (Chile-centric, expandable):**
| Trigger window | Message |
|---|---|
| 2–3 weeks before Dec 25 | "Navidad se acerca — actualiza tu contenido de temporada." |
| 2 weeks before Día de la Madre (second Sunday of May) | "Día de la Madre es pronto — ¿tienes contenido relevante?" |
| 2 weeks before CyberMonday (first week of Nov) | "CyberMonday Chile: oportunidad para campañas de búsqueda pagada." |
| 2 weeks before 18 de septiembre | "Fiestas Patrias: si tu negocio tiene estacionalidad, actúa ahora." |

### 3. Email template

Extend the Resend-based email system (`src/lib/portal-magic-link-email.ts` pattern).

Create `src/lib/gsc-report-email.ts`:
- Uses Resend with a new template `gsc-report-es`.
- Renders the `Report` struct as clean HTML matching portal brand colors.
- Sent to each recipient with an unsubscribe link (toggle `enabled = false`).

### 4. Scheduler

Options (pick one based on deploy target):

| Option | How |
|---|---|
| **Vercel Cron Jobs** | Add `vercel.json` `crons` entry pointing to `/api/internal/gsc/send-reports`; runs on a schedule. |
| **GitHub Actions** | Scheduled workflow calling the same API route with `CRM_BASIC_AUTH`. |
| **Supabase pg_cron** | DB-native cron that calls a Supabase Edge Function. |

The API route `POST /api/internal/gsc/send-reports`:
1. Lists all projects with `project_report_settings.enabled = true` and GSC connected.
2. For each: fetches dashboard data + prior-period data, generates report, sends email.
3. Returns `{ ok: true, sent: number, errors: number }`.

---

## Implementation order (when ready)

1. DB migration: `project_report_settings` table.
2. `src/lib/gsc-report-generator.ts` — pure function, fully unit-testable.
3. `src/lib/gsc-report-email.ts` + Resend template.
4. `POST /api/internal/gsc/send-reports` route.
5. Opt-in toggle in `ProjectDetailPanel`.
6. Scheduler setup for chosen deploy target.
