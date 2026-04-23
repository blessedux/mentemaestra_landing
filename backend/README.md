# Mentemaestra database

SQL migrations for **booking / scheduling** and the **client-onboarding CRM**. The Next.js app in [`../frontend/`](../frontend/) reads `DATABASE_URL` at runtime; this folder only owns the schema.

**Database: Supabase Postgres** (same project for local dev and production, or separate projects per environment — the URL shape is identical).

## Requirements

- A Supabase project (Dashboard → New project).
- PostgreSQL 13 or newer (Supabase is on 15+; `gen_random_uuid()` is available out of the box).

## Apply migrations

Pick either route. Both hit the same Postgres.

### A) Supabase SQL Editor (simplest)

Dashboard → **SQL Editor** → paste each file's contents in filename order and run:

1. `migrations/001_bookings.sql`
2. `migrations/002_client_onboarding.sql`

### B) `psql` against Supabase (scriptable / reproducible)

Use the **Session mode** (or direct, port 5432) connection string from Dashboard → Project Settings → Database — **not** the transaction pooler, which is only for the serverless app.

```bash
export DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require'
psql "$DATABASE_URL" -f migrations/001_bookings.sql
psql "$DATABASE_URL" -f migrations/002_client_onboarding.sql
```

Apply new files in filename order (`003_*.sql`, …) and document them in the table below.

## Frontend env

`frontend/.env.local` needs the **transaction pooler** URI (port **6543**, `?pgbouncer=true&sslmode=require`) for the Next.js app. See [`frontend/.env.example`](../frontend/.env.example) and [`frontend/src/lib/db.ts`](../frontend/src/lib/db.ts), which auto-appends `pgbouncer=true` / `sslmode=require` for `pooler.supabase.com` hosts.

## Migrations

| File | Purpose |
|------|---------|
| `001_bookings.sql` | Confirmed exploratory calls; unique `(booked_on, start_hm)`. |
| `002_client_onboarding.sql` | `clients`, `projects`, `onboarding_invites`, `onboarding_submissions`. See [`docs/client-access-onboarding-crm.md`](../docs/client-access-onboarding-crm.md). |

> **v2 client dashboard** (Supabase Auth + Notion) does **not** need a new
> migration. Supabase Auth uses its own managed `auth` schema; the team
> roster is derived live from `onboarding_submissions.stakeholders`. See
> [`docs/client-access-onboarding-crm.md` §10](../docs/client-access-onboarding-crm.md#10-client-dashboard-v2).

## Related docs

- [`docs/client-access-onboarding-crm.md`](../docs/client-access-onboarding-crm.md) — small internal CRM + tokenized access form that triggers per-client onboarding emails via Resend.
- [`frontend/src/lib/booking-env.ts`](../frontend/src/lib/booking-env.ts) — booking vars.
- [`frontend/src/lib/onboarding-env.ts`](../frontend/src/lib/onboarding-env.ts) — CRM onboarding vars.
