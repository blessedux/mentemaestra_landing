# Mentemaestra backend (database)

SQL migrations and local Postgres for **booking / scheduling** (the Next.js app in `../frontend` uses `DATABASE_URL` and the `bookings` table).

## Requirements

- PostgreSQL 13 or newer (`gen_random_uuid()`).

## Local database (Docker)

From this directory:

```bash
docker compose up -d
```

Default connection string (see `.env.example`; Compose maps **host port 5433** → Postgres 5432 so it does not fight a Postgres already using `localhost:5432`):

`postgresql://mentemaestra:mentemaestra_dev@127.0.0.1:5433/mentemaestra`

## Apply migrations

With `DATABASE_URL` set (or pass connection flags to `psql`):

```bash
export DATABASE_URL='postgresql://mentemaestra:mentemaestra_dev@127.0.0.1:5433/mentemaestra'
psql "$DATABASE_URL" -f migrations/001_bookings.sql
```

On hosted Postgres (Supabase, Neon, etc.), paste the contents of `migrations/001_bookings.sql` into the SQL editor or use their migration tooling.

## Frontend env

In `frontend/.env.local`, set the same value:

`DATABASE_URL=...`

See also `frontend/src/lib/booking-env.ts` for booking-related variables (organizer email, Resend, iCloud CalDAV, etc.).

## Migrations order

| File | Purpose |
|------|---------|
| `001_bookings.sql` | Confirmed exploratory calls; unique `(booked_on, start_hm)`. |
| `002_client_onboarding.sql` | Planned: clients, projects, onboarding invites and submissions. See [`docs/client-access-onboarding-crm.md`](../docs/client-access-onboarding-crm.md). |

Add new files as `002_*.sql`, `003_*.sql`, … and document them here.

## Related docs

- [`docs/client-access-onboarding-crm.md`](../docs/client-access-onboarding-crm.md) — small internal CRM + tokenized access form that triggers per-client onboarding emails via Resend.
