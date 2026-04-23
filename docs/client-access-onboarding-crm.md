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
| `clients`                | One row per **project engagement**, even when the email repeats. Each new project inserts a fresh `clients` row so names/emails stay editable per project. `primary_email` is indexed but intentionally **not** unique. | `id`, `name`, `primary_email`, `created_at`                                                                                                                                 |
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
- Internal CRM is operator-only. **v1 uses HTTP Basic Auth** via `CRM_BASIC_AUTH_USER` / `CRM_BASIC_AUTH_PASS`, enforced in [`src/middleware.ts`](../frontend/src/middleware.ts) for both:
  - `/internal/*` — the CRM pages, and
  - `/api/internal/*` — the CRM route handlers (so calling the API directly does not bypass the UI gate).
  Public routes `/client-access/*` and `/api/client-access/*` stay open. Basic Auth is the pragmatic choice for a single operator tool shipped behind HTTPS; see §10 for the planned upgrade path.

### Future: stronger operator auth (deferred)

Basic Auth is good enough for v1, but has real limits: a single shared account, no per-human audit trail, password replayed on every request, no MFA, clunky logout UX. When the CRM grows past one operator or starts handling more sensitive data, upgrade in this order:

1. **Signed `httpOnly` cookie** issued by `/internal/login` (secrets hashed at rest, short TTL, `Secure` + `SameSite=Lax`, rotating signing key).
2. **Per-operator accounts** with password hashing (`scrypt` / `argon2id`) plus login rate limiting and lockout.
3. **Audit log** on state-changing routes (`sent_by`, IP, user-agent).
4. **Second factor** (TOTP) for the admin role.
5. Optionally, swap the homegrown layer for a managed provider (Clerk / Auth.js) once you need OAuth / SSO.

Vercel Deployment Protection is **not** a viable sole mechanism here because this app also serves a public landing site on the same deployment; it can still be layered on **preview** URLs as defense-in-depth.

---

## 4. Email (Resend)

Reuse the pattern established in [`src/app/api/book-meeting/route.ts`](../frontend/src/app/api/book-meeting/route.ts) and [`src/lib/meeting-confirmation-email.ts`](../frontend/src/lib/meeting-confirmation-email.ts).

- **Template:** either a new [Resend dashboard template](https://resend.com/docs/dashboard/templates/introduction) with `RESEND_ONBOARDING_TEMPLATE_ID`, or a local HTML file mirrored at [`src/lib/email-templates/client-onboarding-es.html`](../frontend/src/lib/email-templates/client-onboarding-es.html) (same approach as `meeting-confirmation-es.html`). Placeholders use **triple braces** (`{{{VAR}}}`) when posting to a dashboard template.
- **Variables (minimum):**
  - `PREHEADER` — inbox preview text.
  - `HEADLINE` — "Bienvenido a tu proyecto con Mentemaestra".
  - `PROJECT_NAME` — human-readable.
  - `CLIENT_NAME` — recipient's first name or company.
  - `CTA_URL` — absolute tokenized URL (see §5).
  - `SUPPORT_EMAIL` — fallback contact.
  - Optional: `SOCIAL_*` mirrored from [`getSocialUrlsForEmail`](../frontend/src/lib/public-site-url.ts).
- **Copy:** one sentence + one button. Do not list stakeholder fields in the email; that's what the form is for.
- **Env:** reuse `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. The sending domain must be verified per the note in [`src/lib/booking-env.ts`](../frontend/src/lib/booking-env.ts).

---

## 5. Concrete files to touch (when implementing)

### Backend (SQL)

- `backend/migrations/002_client_onboarding.sql` — create `clients`, `projects`, `onboarding_invites`, `onboarding_submissions` (mirror PK/`TIMESTAMPTZ` style from `001_bookings.sql`).
- `backend/README.md` — add row to the migrations table and a "Related docs" link back to this file.

### Frontend library code

- [`src/lib/onboarding-token.ts`](../frontend/src/lib/onboarding-token.ts) — `generateInviteToken()`, `hashInviteToken(raw)`, `buildInviteUrl(token)` (reuses [`getPublicSiteUrl`](../frontend/src/lib/public-site-url.ts)).
- [`src/lib/onboarding-invite-store.ts`](../frontend/src/lib/onboarding-invite-store.ts) — thin data-access over [`getDb`](../frontend/src/lib/db.ts) for invites + submissions (parallels `bookings-store.ts`).
- [`src/lib/client-onboarding-email.ts`](../frontend/src/lib/client-onboarding-email.ts) — variable builder + local HTML render (parallels [`meeting-confirmation-email.ts`](../frontend/src/lib/meeting-confirmation-email.ts)).
- [`src/lib/email-templates/client-onboarding-es.html`](../frontend/src/lib/email-templates/client-onboarding-es.html) — HTML mirror of the Resend template.
- [`src/lib/onboarding-env.ts`](../frontend/src/lib/onboarding-env.ts) — declares the CRM-specific env surface (TTL, pepper, Basic Auth, optional template id).

### API routes

- [`src/app/api/internal/projects/route.ts`](../frontend/src/app/api/internal/projects/route.ts) — `GET` list, `POST` create/update (Basic Auth enforced by middleware).
- [`src/app/api/internal/projects/[id]/send-onboarding/route.ts`](../frontend/src/app/api/internal/projects/[id]/send-onboarding/route.ts) — `POST` creates invite, sends Resend email, returns invite status.
- [`src/app/api/client-access/[token]/route.ts`](../frontend/src/app/api/client-access/[token]/route.ts) — `GET` resolves invite + project context for the form; `POST` records the submission and marks the invite used. Rate-limited per-IP.

### Public + internal pages

- [`src/app/client-access/[token]/page.tsx`](../frontend/src/app/client-access/[token]/page.tsx) — public form (project name header, admin email, dynamic list of stakeholders with role + email, submit button). Server component fetches via the resolver above; form posts to the same route.
- [`src/app/internal/page.tsx`](../frontend/src/app/internal/page.tsx) + [`src/app/internal/projects/[id]/page.tsx`](../frontend/src/app/internal/projects/[id]/page.tsx) — minimal CRM: project list, detail with Notion URL field, **Send onboarding email** button, invite history.
- [`src/middleware.ts`](../frontend/src/middleware.ts) — Basic Auth guard for `/internal/*` and `/api/internal/*` (see §3).

### Environment variables (add to `frontend/.env.example` and declare in [`src/lib/onboarding-env.ts`](../frontend/src/lib/onboarding-env.ts))

| Var                                                                   | Purpose                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_ONBOARDING_TEMPLATE_ID`                                       | Optional Resend dashboard template; if unset, render local HTML.                                                                                                                                                          |
| `ONBOARDING_INVITE_TTL_DAYS`                                          | Default 30.                                                                                                                                                                                                               |
| `ONBOARDING_PUBLIC_BASE_URL`                                          | Falls back to `BOOKING_PUBLIC_BASE_URL` → `VERCEL_URL` → `http://localhost:3000` via [`getPublicSiteUrl`](../frontend/src/lib/public-site-url.ts). A dedicated var avoids coupling onboarding links to booking semantics.          |
| `CRM_BASIC_AUTH_USER` / `CRM_BASIC_AUTH_PASS`                         | **Required** operator auth for `/internal/*` and `/api/internal/*` (HTTP Basic Auth, v1). If unset in production the middleware fails closed.                                                                             |
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
- Client opens a link, submits emails, lands straight in the project portal (`/client/[slug]`) with a signed session cookie set automatically — no second email.
- Every allowlisted teammate receives a personal, HMAC-signed welcome email that drops them into the portal in one click.
- A submission row contains everything needed to provision Notion + Sanity + dashboard access with no back-and-forth.
- No coupling to the dashboard repo beyond the documented webhook payload.

---

## 10. Client dashboard (v2)

Where v1 ended at "submit → redirect to Notion URL", v2 adds a persistent,
authenticated portal at `/client/[slug]` so the client (and their teammates)
can see project content without being granted direct Notion access.

### 10.1 Architecture at a glance

```
[/client-access/<token>] — one-time public form (seeds the roster)
              │    └─ on submit: set HMAC session cookie + Resend welcome to every allowlisted email
              ▼
[onboarding_submissions.stakeholders] ← edited from /internal by the operator
              │   = live allowlist (admin_email ∪ stakeholders[*].email)
              ▼
Recipient clicks welcome-email link:
  ${BASE}/client/<slug>/enter?token=<HMAC-signed>
              │    └─ verify signature + expiry + live allowlist
              │       → set signed `mm_portal_session` cookie (30d)
              ▼
[/client/<slug>]  ← RSC re-checks live allowlist, then renders Notion content
```

Two distinct client-facing surfaces coexist:

- `/client-access/[token]` — existing one-time public form (token-gated).
- `/client/[slug]` — persistent dashboard, gated by an HMAC-signed cookie
  and cross-checked against the live allowlist on every request.

### 10.2 Team roster is the submission row

The **allowlist** for a project is computed from its latest
`onboarding_submissions` row: `{admin_email} ∪ {stakeholders[*].email}`.
Operators edit that same row from `/internal/projects/[id]` via the
`TeamMembersPanel` component, backed by:

- `GET /api/internal/projects/[id]/members` — `{ ready, admin_email, stakeholders[] }`.
- `POST /api/internal/projects/[id]/members` — add one stakeholder; triggers a
  welcome email (see §10.4).
- `PATCH /api/internal/projects/[id]/members` — replace accesses for an email.
- `DELETE /api/internal/projects/[id]/members` — remove an email.

Operators can only edit the roster **after** the client has submitted the
form at least once (the submission row must exist). Pre-submission the
panel renders a "Esperando envío del cliente" waiting state. See the v3
note in §10.7 for pre-submission roster support.

### 10.3 Portal auth (HMAC-signed, no third-party SDK)

The portal is intentionally access-link-only. There is no password, no OTP
form, no self-service signup — the **single welcome email is the login**.
We bootstrapped v2 on Supabase Auth (magic links) but that meant two emails
(our welcome email + Supabase's OTP email) and a PKCE round-trip that
regularly broke in dev (`localhost` vs `0.0.0.0` origin mismatch wiping the
`code_verifier` cookie). HMAC-signed links give us the same security
properties with less moving parts.

**Pieces:**

- [`src/lib/portal-access.ts`](../frontend/src/lib/portal-access.ts) —
  `signAccessToken`, `verifyAccessToken`, `buildPortalAccessUrl`,
  `setPortalSessionCookie`, `readPortalSession`,
  `clearPortalSessionCookie`. All HMAC-SHA256 with
  `PORTAL_SESSION_SECRET` (≥32 chars, `openssl rand -hex 32`).
- [`src/app/client/[slug]/enter/route.ts`](../frontend/src/app/client/[slug]/enter/route.ts) —
  redeems the `?token=` from the welcome email: verify signature +
  max-age, confirm the token's slug matches the URL, re-check the live
  allowlist, drop a 30-day `mm_portal_session` cookie, redirect to
  `/client/<slug>`.
- [`src/app/client/[slug]/logout/route.ts`](../frontend/src/app/client/[slug]/logout/route.ts) —
  POST clears the cookie.
- [`src/app/client/[slug]/page.tsx`](../frontend/src/app/client/[slug]/page.tsx) —
  reads `mm_portal_session`, rejects any session whose `slug` doesn't
  match the URL, re-checks the live allowlist on every render so revoked
  members lose access instantly.

**Security properties:**

- Tokens in email links are valid for 90 days; the session cookie is
  valid for 30 days.
- Removing a stakeholder from `/internal` revokes their access on their
  **next request** (allowlist is re-read from the DB, never cached).
- Rotating `PORTAL_SESSION_SECRET` invalidates every outstanding link and
  every outstanding session at once — the panic button for a leak.
- Cookie is `HttpOnly; SameSite=Lax; Secure` in production.
- Links carry the email in the token, so a leaked link only grants access
  for as long as that email stays on the allowlist.

**What we removed to get here:**

- `@supabase/supabase-js`, `@supabase/ssr` dependencies.
- `src/lib/supabase-browser.ts`, `src/lib/supabase-server.ts`,
  `src/lib/supabase-env.ts`, `src/app/auth/callback/route.ts`.
- The `/client/[slug]/login` OTP form and its `LoginForm.tsx`. The
  `/login` route still exists, but now just explains "check your email"
  with reason-specific copy if `/enter` rejected a token.
- The Supabase session-refresh branch in middleware.

### 10.4 Welcome email

On submit and on operator-add, we send a welcome email from
[`src/lib/team-member-welcome-email.ts`](../frontend/src/lib/team-member-welcome-email.ts)
using [`src/lib/email-templates/team-member-welcome-es.html`](../frontend/src/lib/email-templates/team-member-welcome-es.html).

- From / key: reuses `RESEND_FROM_EMAIL` and `RESEND_API_KEY`.
- Subject: `Te invitaron al proyecto <name> en MenteMaestra`.
- CTA: `${ONBOARDING_PUBLIC_BASE_URL}/client/<slug>/enter?token=<HMAC>` —
  a **personal, signed** link computed per recipient via
  `buildPortalAccessUrl`.
- Body lists the accesses granted (Notion / CMS / Ops) in Spanish.
- Failure is swallowed with `console.error`; the response carries
  `{ ok: true, email_sent: boolean }` so the UI can warn "member added but
  email not delivered".

`PATCH` and `DELETE` do **not** send emails — tweaks shouldn't spam
people. Operators can re-trigger a welcome by deleting + re-adding a
member, or (future) by adding a "Resend access email" button.

**Admin submitter fast-path:** `POST /api/client-access/[token]` additionally
calls `setPortalSessionCookie(slug, admin_email)` before returning, so the
form auto-redirects straight to `/client/<slug>` — no need for the admin to
reopen their own welcome email. They still receive one for future devices.

### 10.5 Middleware

[`src/middleware.ts`](../frontend/src/middleware.ts) only covers the CRM
now:

- `/internal/:path*` and `/api/internal/:path*` → HTTP Basic Auth (unchanged).
- `/client/:path*` is **not** in the matcher. The portal's auth is the
  cookie check inside the RSC — no per-request middleware is needed and
  the cookie is issued directly by our `/enter` Route Handler.

Authorization (allowlist check) is done **at the page level** inside
`app/client/[slug]/page.tsx`, not in middleware. This keeps per-request DB
calls out of the hot path and makes the check auditable alongside the
page code.

### 10.6 Notion "Project home" DB view

Read-only, minimal renderer. We call Notion's `/v1/databases/{id}/query`
REST endpoint directly (skipping `@notionhq/client`, whose v5 SDK removed
the `databases.query` helper in favor of a heavier data-sources model we
don't need). See:

- [`src/lib/notion-client.ts`](../frontend/src/lib/notion-client.ts) —
  `parseNotionDatabaseId`, `queryProjectDatabase`, typed `ProjectRow`.
  Responses are cached for 60 seconds with Next's `revalidate` fetch option
  to stay under Notion's ~3 req/s rate limit.
- [`src/components/notion/NotionRowList.tsx`](../frontend/src/components/notion/NotionRowList.tsx) —
  title + status pill + date + multi-select chips + short summary; nothing
  else. No block rendering, no rich text children.

**Setup (one-time per workspace):**

1. Notion → Settings → Connections → Develop or manage integrations →
   New internal integration → copy the Internal Integration Token.
2. Per project: open the Notion **database** → "•••" → Connect to → pick
   your integration. Without this, `queryProjectDatabase` returns
   `{ ok: false, reason: "unauthorized" }` and the UI shows an explanatory
   empty state.
3. Set `NOTION_API_KEY=...` in `frontend/.env.local`.

**Data convention:** `projects.notion_url` must point at a Notion
**database** URL, not a page. We parse the 32-char hex id out of the URL
at render time (`parseNotionDatabaseId`).

Error states surfaced gracefully:

- URL missing → "Tu operador aún no ha conectado el espacio Notion".
- Integration not shared with DB → "Nuestra integración de Notion aún no
  tiene acceso a esta base".
- Any other Notion failure → soft empty state with a retry hint.

### 10.7 Roadmap — v3 `project_members`

Today's model (roster = latest submission row) has two limitations:

- Operators can't edit the roster before the client submits the form once.
- `stakeholders` is unstructured JSONB — no per-member `added_at`,
  `last_notified_at`, or audit trail.

When those start hurting, introduce a dedicated table:

```sql
-- hypothetical v3 — do NOT create yet
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  accesses TEXT[] NOT NULL DEFAULT '{}',
  added_by TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,
  UNIQUE (project_id, email)
);
```

Migration path:

1. Backfill from the latest `onboarding_submissions` per project.
2. Switch `getAllowlistForProject` and the internal members API to read
   from `project_members`.
3. Keep `onboarding_submissions` for historical form payloads only.

### 10.8 New environment variables

Add to [`frontend/.env.example`](../frontend/.env.example):

| Var                      | Purpose                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `PORTAL_SESSION_SECRET`  | HMAC key for signing access-link tokens and session cookies. ≥32 chars, generate with `openssl rand -hex 32`. Rotate to nuke all.  |
| `NOTION_API_KEY`         | Internal integration token. Required for the dashboard to render Notion content.                                                   |

Reused without change: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`ONBOARDING_PUBLIC_BASE_URL`, `ONBOARDING_SUPPORT_EMAIL`.

### 10.9 Scope guardrails (v2, what's explicitly NOT included)

- Client self-editing their own team. Client form stays one-time; operators
  own the roster.
- A `project_members` table (see §10.7).
- OAuth providers (Google / GitHub). Access-link-only.
- Password login, OTP codes, MFA. Intentionally omitted — link-only.
- Pre-submission team roster editing (waiting state until client submits).
- Notion → DB write-back. Read-only.

---

## 11. Notion portal modes (v3)

`projects.notion_url` now drives the portal in two modes, auto-detected on each request:

| Mode | When | Portal renders |
|------|------|----------------|
| **Page** | The URL points at a Notion page (or the integration can't see a database at that id) | Full block tree: headings, paragraphs, toggles, callouts, lists, to-dos, code, images, external video embeds (YouTube / Vimeo / Loom), bookmarks, inline child databases, child-page links |
| **Database** | The URL points at a Notion database the integration can access | Row list (existing behavior — title, status, date, tags, summary) |

### 11.1 Setting up the integration (required per page/DB)

1. In your Notion workspace: **Settings → Connections → Develop/manage integrations** → create an *internal* integration → copy the token into `NOTION_API_KEY`.
2. For **each** portal page or database: open it in Notion → click `···` → **Connections** → pick your integration. Without this step the portal shows "integración sin acceso".
3. In the internal CRM, paste the page or database URL into the **Notion URL** field and save. The portal detects mode automatically — no migration needed.

### 11.2 Block types supported (v1)

`paragraph`, `heading_1/2/3`, `bulleted_list_item`, `numbered_list_item`, `to_do`, `toggle`, `callout`, `quote`, `code`, `divider`, `image`, `video` (external — YouTube/Vimeo/Loom), `bookmark`, `link_preview`, `child_database` (inline), `child_page` (link to nested route), `column_list` (stacked mobile / flex desktop).

All other block types render a neutral fallback in production; in dev the raw type name is shown so you can add support incrementally.

### 11.3 Sub-pages

`child_page` blocks render as a link → `/client/[slug]/notion/[pageId]`. That route re-runs the same auth/allowlist check before fetching the block tree for the sub-page, and shows a breadcrumb back to the main portal.

### 11.4 Caching

All Notion API requests use `next: { revalidate: 60 }` — blocks are cached for 60 seconds. On Next.js this means content updates in Notion appear in the portal within ~1 minute without any manual action. For instant publish, use `revalidatePath` from a future "Refresh" button in the CRM.

### 11.5 Known limitations

- Notion **file blocks** (uploaded images/videos) use expiring signed URLs (~1 hour). External hosted images/videos are permanent.
- **Column layout** is flattened to vertical stacks on mobile; full CSS column fidelity is available on md+ screens.
- Deeply nested pages increase server-side API calls. The block fetcher is capped at depth 4 to prevent runaway recursion.
