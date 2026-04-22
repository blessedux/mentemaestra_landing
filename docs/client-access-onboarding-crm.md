# Client access onboarding — small CRM + tokenized form

**Goal:** After internal onboarding of a new client is complete, the operator triggers a single email from a small internal CRM. The client receives a minimal email with one CTA that opens a personalized form. On the form the client enters their own email plus stakeholder emails for Notion, Sanity, and the [mentemaestra_dashboard](https://github.com/blessedux/mentemaestra_dashboard). The operator uses the submitted data to finish provisioning. After submit, the client is redirected to the project's Notion URL stored in the CRM.

**Out of scope:** User/role creation inside the dashboard repo. This spec defines only the handoff data the dashboard consumes later (admin email + stakeholder list).

---

## 1. User-visible flow

1. Operator opens the internal CRM, picks a client/project, clicks **Send onboarding email**.
2. Client receives one Resend email with a CTA button to a personalized URL.
3. CTA opens a public page (`/client-access/[token]`) pre-labeled with the project name.
4. Client submits their own email and a short list of stakeholder emails (role + email).
5. On success, the page redirects to `project.notion_url` and the invite is marked used.

```mermaid
sequenceDiagram
  participant Operator
  participant CRM as NextInternalCRM
  participant DB as Postgres
  participant Resend
  participant Client
  participant Form as PublicAccessForm

  Operator->>CRM: Select project, click send onboarding
  CRM->>DB: Insert onboarding_invites row with token_hash
  CRM->>Resend: POST /emails with CTA_URL and project vars
  Resend->>Client: Email with single CTA
  Client->>Form: GET /client-access/[token]
  Form->>DB: Resolve invite by token_hash, load project
  Client->>Form: Submit admin email and stakeholders
  Form->>DB: Insert onboarding_submissions, mark invite used
  Form-->>Client: Redirect to project.notion_url
  Note over Operator: Manual provisioning today; future automations hook off submissions
```

---

## 2. Data model

New migration: [`backend/migrations/002_client_onboarding.sql`](../backend/migrations/002_client_onboarding.sql) (add an entry to the migrations table in [`backend/README.md`](../backend/README.md)).

Conceptual tables (exact column types kept consistent with [`backend/migrations/001_bookings.sql`](../backend/migrations/001_bookings.sql) conventions — `UUID` primary keys, `TIMESTAMPTZ`, defaults via `gen_random_uuid()` / `NOW()`):

| Table                    | Purpose                                                           | Key columns                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clients`                | One row per client company/person.                                | `id`, `name`, `primary_email`, `created_at`                                                                                                                                 |
| `projects`               | One row per engagement. The operator maintains `notion_url` here. | `id`, `client_id` FK, `slug` (unique), `name`, `notion_url`, `sanity_dataset` (nullable), `dashboard_project_key` (nullable), `created_at`                                  |
| `onboarding_invites`     | One row each time the operator sends the email.                   | `id`, `project_id` FK, `token_hash` (bytea / text, **never** raw token), `sent_to_email`, `sent_by` (operator identifier), `expires_at`, `used_at` (nullable), `created_at` |
| `onboarding_submissions` | Form submission payload.                                          | `id`, `invite_id` FK, `admin_email`, `stakeholders` JSONB (`[{ role, email }]`), `submitted_at`                                                                             |

Hashing rationale: the email link contains the raw token; the database stores only `sha256(token)` so a DB read never leaks valid links.

---

## 3. Link + security

- URL shape: `/client-access/<token>` — opaque token, path segment (easier to share and log-filter than a long query string).
- Token: 32 bytes from `crypto.randomBytes`, base64url-encoded. Store `sha256(token)` as `token_hash`.
- TTL: 30 days by default (`ONBOARDING_INVITE_TTL_DAYS`). `GET` rejects if `expires_at < now()` or `used_at` is set.
- Single-use: set `used_at = now()` on successful submit; re-opening the link shows a "this invite is already used" state.
- Rate limit the public `POST` (e.g. 5/min/IP) to blunt trivial abuse.
- Public form is stateless (token-in-URL); no cookie session, so CSRF is not applicable beyond verifying the `Origin` header.
- Internal CRM is operator-only. Pick **one** guard for v1 to avoid scope creep:
  - Vercel deployment protection on `/internal/*`, or
  - `middleware.ts` checking a signed cookie issued via a simple `/internal/login` reading `CRM_ADMIN_PASSWORD`, or
  - Basic Auth via `CRM_BASIC_AUTH_USER` / `CRM_BASIC_AUTH_PASS`.

---

## 4. Email (Resend)

Reuse the pattern established in [`frontend/src/app/api/book-meeting/route.ts`](../frontend/src/app/api/book-meeting/route.ts) and [`frontend/src/lib/meeting-confirmation-email.ts`](../frontend/src/lib/meeting-confirmation-email.ts).

- **Template:** either a new [Resend dashboard template](https://resend.com/docs/dashboard/templates/introduction) with `RESEND_ONBOARDING_TEMPLATE_ID`, or a local HTML file mirrored at `frontend/src/lib/email-templates/client-onboarding-es.html` (same approach as `meeting-confirmation-es.html`). Placeholders use **triple braces** (`{{{VAR}}}`) when posting to a dashboard template.
- **Variables (minimum):**
  - `PREHEADER` — inbox preview text.
  - `HEADLINE` — "Bienvenido a tu proyecto con Mentemaestra".
  - `PROJECT_NAME` — human-readable.
  - `CLIENT_NAME` — recipient's first name or company.
  - `CTA_URL` — absolute tokenized URL (see §5).
  - `SUPPORT_EMAIL` — fallback contact.
  - Optional: `SOCIAL_*` mirrored from [`getSocialUrlsForEmail`](../frontend/src/lib/public-site-url.ts).
- **Copy:** one sentence + one button. Do not list stakeholder fields in the email; that's what the form is for.
- **Env:** reuse `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. The sending domain must be verified per the note in [`frontend/src/lib/booking-env.ts`](../frontend/src/lib/booking-env.ts).

---

## 5. Concrete files to touch (when implementing)

### Backend (SQL)

- `backend/migrations/002_client_onboarding.sql` — create `clients`, `projects`, `onboarding_invites`, `onboarding_submissions` (mirror PK/`TIMESTAMPTZ` style from `001_bookings.sql`).
- `backend/README.md` — add row to the migrations table and a "Related docs" link back to this file.

### Frontend library code

- `frontend/src/lib/onboarding-token.ts` — `generateInviteToken()`, `hashInviteToken(raw)`, `buildInviteUrl(token)` (reuses [`getPublicSiteUrl`](../frontend/src/lib/public-site-url.ts)).
- `frontend/src/lib/onboarding-invite-store.ts` — thin data-access over [`getDb`](../frontend/src/lib/db.ts) for invites + submissions (parallels `bookings-store.ts`).
- `frontend/src/lib/client-onboarding-email.ts` — variable builder + local HTML render (parallels [`meeting-confirmation-email.ts`](../frontend/src/lib/meeting-confirmation-email.ts)).
- `frontend/src/lib/email-templates/client-onboarding-es.html` — HTML mirror of the Resend template.
- Optional: extract `postResendEmail` from [`frontend/src/app/api/book-meeting/route.ts`](../frontend/src/app/api/book-meeting/route.ts) into `frontend/src/lib/resend-client.ts` only if the diff stays small; otherwise duplicate locally to keep booking untouched.

### API routes

- `frontend/src/app/api/internal/projects/route.ts` — `GET` list, `POST` create/update (operator auth required).
- `frontend/src/app/api/internal/projects/[id]/send-onboarding/route.ts` — `POST` creates invite, sends Resend email, returns invite status.
- `frontend/src/app/api/client-access/[token]/route.ts` — `GET` resolves invite + project context for the form; `POST` records the submission and marks the invite used.

### Public + internal pages

- `frontend/src/app/client-access/[token]/page.tsx` — public form (project name header, admin email, dynamic list of stakeholders with role + email, submit button). Server component fetches via the resolver above; form posts to the same route.
- `frontend/src/app/internal/page.tsx` + `frontend/src/app/internal/projects/[id]/page.tsx` — minimal CRM: project list, detail with Notion URL field, **Send onboarding email** button, invite history.
- `frontend/src/middleware.ts` — guard `/internal/*` with the chosen auth strategy.

### Environment variables (add to `frontend/.env.example` and annotate in [`booking-env.ts`](../frontend/src/lib/booking-env.ts) or a new `src/lib/onboarding-env.ts`)

| Var                                                                   | Purpose                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_ONBOARDING_TEMPLATE_ID`                                       | Optional Resend dashboard template; if unset, render local HTML.                                                                                                                                                          |
| `ONBOARDING_INVITE_TTL_DAYS`                                          | Default 30.                                                                                                                                                                                                               |
| `ONBOARDING_PUBLIC_BASE_URL`                                          | Falls back to `BOOKING_PUBLIC_BASE_URL` → `VERCEL_URL` → `http://localhost:3000` via [`getPublicSiteUrl`](../frontend/src/lib/public-site-url.ts). A dedicated var avoids coupling onboarding links to booking semantics. |
| `CRM_ADMIN_PASSWORD` or `CRM_BASIC_AUTH_USER` / `CRM_BASIC_AUTH_PASS` | Operator auth for `/internal/*` (pick one strategy).                                                                                                                                                                      |
| `ONBOARDING_TOKEN_HASH_PEPPER`                                        | Optional extra secret mixed into the `sha256` so a stolen DB row alone can't be brute-forced against a leaked URL format.                                                                                                 |

Reused without change: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `DATABASE_URL`.

---

## 6. Handoff to the dashboard repo

The dashboard lives at [blessedux/mentemaestra_dashboard](https://github.com/blessedux/mentemaestra_dashboard) and is **out of scope** for this repo. Keep the boundary testable:

- Every `onboarding_submissions` row contains a canonical `admin_email` and the stakeholder list.
- On submit, this repo can optionally `POST` the submission payload to a dashboard webhook (`DASHBOARD_SUBMISSION_WEBHOOK_URL`) — behind a feature flag, so v1 can ship without a live dashboard endpoint.
- Until the webhook exists, the operator reads the submission from the CRM UI and provisions the dashboard manually.

---

## 7. Implementation phases

| Phase                  | What lands                                                                                    | Notes                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A — Data               | Migration `002_client_onboarding.sql`, seed a first project manually.                         | Smallest unit that unblocks everything else.                                      |
| B — Token + URL helper | `onboarding-token.ts` + unit coverage of hash/verify.                                         | Pure functions, easy to test.                                                     |
| C — Resend wiring      | Variable builder, HTML template, local-render fallback.                                       | Copy pattern from `meeting-confirmation-email.ts`.                                |
| D — Public form + API  | `/client-access/[token]` page and its route handlers.                                         | Ship before the CRM UI — you can trigger sends via `psql` + `curl` while testing. |
| E — Internal CRM UI    | `/internal` list + project detail + send button.                                              | Pick one auth strategy.                                                           |
| F — Ops hooks          | Operator notification on submit (second Resend or Slack webhook); optional dashboard webhook. | Notion/Sanity invites stay manual until their APIs are added.                     |

---

## 8. Non-goals (explicit)

- Automated Notion or Sanity member invites (manual for v1; future epic).
- Role-based access inside the dashboard repo.
- A full multi-tenant CRM — this is intentionally a 1-operator tool.

---

## 9. Success criteria

- Operator can send a branded onboarding email from the CRM in under 30 seconds.
- Client opens a link, submits emails, lands on the correct Notion URL.
- A submission row contains everything needed to provision Notion + Sanity + dashboard access with no back-and-forth.
- No coupling to the dashboard repo beyond the documented webhook payload.
