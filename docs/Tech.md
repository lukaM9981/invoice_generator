# Invoice Generator — Architecture and Technical Implementation

This document describes how the product defined in [PRD.md](./PRD.md) is built. The
database schema itself lives in [DB.md](./DB.md).

## 1. Current state of the repository

The database schema from [DB.md](./DB.md) is applied, and authentication is built: the
`(auth)` screens, the `/confirm` callback, and the guarded `(app)` shell with a
placeholder dashboard. Everything from profile CRUD onwards is still to come.

**Installed and configured**

| Package                | Version | Notes                                                    |
| ---------------------- | ------- | -------------------------------------------------------- |
| `next`                 | 16.3.3  | App Router, TypeScript                                    |
| `react` / `react-dom`  | 19.2.8  |                                                           |
| `typescript`           | 5.x     | Strict mode, `@/*` path alias                             |
| `tailwindcss`          | 4.x     | Configured through `@tailwindcss/postcss`, no config file |
| `@supabase/supabase-js`| 2.112.4 |                                                           |
| `@supabase/ssr`        | 0.12.5  | Cookie-based session handling                             |
| `shadcn`               | 4.19.0  | CLI; `base-nova` style, `zinc` base colour                |
| `@base-ui/react`       | 1.7.0   | Primitive layer used by the shadcn preset                 |
| `@remixicon/react`     | 4.9.0   | Icon library configured in `components.json`              |
| `zod`                  | 4.5.4   | Schema validation shared by forms and server actions      |
| `react-hook-form`      | 7.87.0  | Form state, paired with the shadcn `field` primitives     |
| `@hookform/resolvers`  | 5.9.1   | Bridges the zod schemas into react-hook-form              |
| `server-only`          | 0.0.1   | Keeps server modules out of client bundles                |
| `sonner` / `next-themes` | 2.x / 0.4.x | Pulled in by the shadcn `sonner` toaster            |
| `eslint`               | 9.x     | `eslint-config-next`                                      |

Existing files that matter:

- `utils/supabase/client.ts` — browser client.
- `utils/supabase/server.ts` — server client bound to the Next.js cookie store.
- `utils/supabase/middleware.ts` — `updateSession()` that refreshes the auth token.
- `proxy.ts` — root proxy that refreshes the session and redirects optimistically.
- `components/ui/` — `button`, `input`, `label`, `card`, `field`, `separator`, `sonner`.
- `.env.local` — currently holds `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

The Supabase project is reachable and runs **Postgres 17.6**, with the eight tables from
[DB.md](./DB.md) in `public`, all with row-level security enabled.

**Packages still to install**

| Package                  | Version | Purpose                                            |
| ------------------------ | ------- | -------------------------------------------------- |
| `stripe`                 | 22.6.0  | Server-side Stripe SDK (Connect, payment links)     |
| `resend`                 | 6.25.0  | Transactional email delivery                        |
| `@react-pdf/renderer`    | 4.9.0   | PDF rendering in Node; peer-compatible with React 19|
| `@react-email/components`| 1.0.12  | Typed building blocks for the invoice email         |

Additional shadcn components will be pulled through the CLI as screens are built (select,
table, dialog, dropdown-menu, badge, and similar). Per the project UI rules, always check
the shadcn registry before hand-rolling a primitive, and keep the `base-nova` preset from
`components.json`. Note that `form` is empty in this preset: forms are composed from the
`field` primitives (`Field`, `FieldLabel`, `FieldError`, `FieldGroup`) plus
react-hook-form.

## 2. Next.js 16 specifics that shape the design

This is Next.js 16, which differs from older App Router material in ways that affect this
build:

- **Middleware is now Proxy.** The root file is `proxy.ts`, exporting a `proxy` function.
  It already exists and only refreshes the Supabase session. It must stay thin: the docs
  are explicit that proxy is not a session management or authorization solution, and
  optimistic redirects there are a UX nicety, never the security boundary.
- **Route Handlers** (`app/**/route.ts`) are uncached by default and run on the Node
  runtime, which is what the PDF renderer and the Stripe SDK need.
- **Server Functions / Server Actions** are the mutation path. They are reachable by
  direct `POST` regardless of the UI, so every action re-checks authentication and
  ownership itself.
- **Cache Components are not enabled** in `next.config.ts`, so pages behave dynamically by
  default. After a mutation, use `revalidatePath` for a specific route or `refresh()` from
  `next/cache` to refresh the current view.
- `RouteContext<'/path/[id]'>` is available for typing dynamic route handler params.

## 3. Stack overview

| Concern              | Choice                                                        |
| -------------------- | ------------------------------------------------------------- |
| Framework            | Next.js 16 App Router on the Node runtime                      |
| UI                   | React 19 Server Components, shadcn/ui, Tailwind v4             |
| Authentication       | Supabase Auth, email and password, cookie sessions             |
| Database             | Supabase Postgres with row-level security                      |
| File storage         | Supabase Storage, one private bucket for invoice PDFs          |
| Payments             | Stripe Connect (Standard accounts, direct charges)             |
| PDF                  | `@react-pdf/renderer` rendered server-side                     |
| Email                | Resend, with React Email for the template                      |
| Validation           | Zod schemas shared between client forms and server actions     |
| Hosting              | Vercel                                                         |

## 4. Directory structure

```
app/
  (marketing)/page.tsx              landing
  (auth)/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    verify-email/page.tsx           shown after sign-up, before confirmation
    confirm/route.ts                email confirmation + recovery callback
  (app)/
    layout.tsx                      auth guard + app shell
    dashboard/page.tsx
    invoices/
      page.tsx                      paginated list
      new/page.tsx
      [id]/page.tsx                 detail
      [id]/edit/page.tsx
    clients/
      page.tsx                      list, search, add and edit in a dialog
    settings/page.tsx               sender details
  api/
    stripe/
      connect/start/route.ts        creates the account link, redirects to Stripe
      connect/return/route.ts       return from onboarding, refreshes account state
      webhook/route.ts              Connect webhook receiver
    invoices/[id]/pdf/route.ts      streams the stored PDF
lib/
  auth/
    actions.ts                      'use server' sign-in / sign-up / reset / sign-out
    queries.ts                      getCurrentUser(), requireUser()
    schemas.ts                      zod schemas
    routes.ts                       path constants, safeRedirectPath(); proxy-safe
    urls.ts                         absolute origin for links Supabase emails
  invoices/
    actions.ts                      'use server' mutations
    queries.ts                      server-only reads
    calculations.ts                 subtotal / tax / total, pure functions
    schemas.ts                      zod schemas
    pdf/InvoiceDocument.tsx         react-pdf document
  clients/{actions,queries,schemas}.ts
  profile/{actions,queries,schemas}.ts
  stripe/{client,connect,payment-links}.ts
  email/{send-invoice.ts,templates/InvoiceEmail.tsx}
  supabase/admin.ts                 service-role client, webhook use only
utils/supabase/                     existing browser/server/proxy clients
components/
  ui/                               shadcn primitives
  invoices/, clients/, layout/      feature components
supabase/migrations/                SQL migrations
```

## 5. Authentication and route protection

Supabase Auth handles registration, sign-in, sign-out, and password recovery. Sessions
live in cookies and are refreshed by the existing proxy.

Defence in depth, from outermost to innermost:

1. **Proxy** refreshes the token on every request so server components see a valid
   session. It may also redirect signed-out visitors away from `(app)` routes, but this is
   only a redirect, not a guarantee.
2. **The `(app)` layout** calls the server client and redirects to `/login` when there is
   no authenticated user. Use `getClaims()` or `getUser()` on the server; never trust
   `getSession()` for authorization, since its contents are not revalidated.
3. **Every server action and route handler** independently resolves the current user
   before touching data.
4. **Row-level security** in Postgres is the real boundary. Even a bug in the layers above
   cannot return another user's rows.

Authorization data is never read from `user_metadata`, which the user can edit themselves.
This application has a single role, so no role claims are needed at all.

`lib/auth/queries.ts` is the one place that resolves the signed-in user, through
`getClaims()` wrapped in React `cache`, so a render pass verifies the token once.
`requireUser()` adds the redirect and is called by the `(app)` layout and by every page
and action below it.

Password recovery uses Supabase's recovery email; the link lands on
`app/(auth)/confirm/route.ts`, which exchanges the token and redirects to the
reset-password form. That handler accepts both link shapes: `?code=` from Supabase's stock
email templates, exchanged with `exchangeCodeForSession`, and `?token_hash=&type=` from
templates rewritten to point straight at `/confirm`, verified with `verifyOtp`. Only
`signup` and `recovery` are accepted as `type` values; anything else is treated as an
invalid link. A failed exchange lands on `/login?error=invalid_link`.

After a successful recovery exchange, `/confirm` sets a short-lived `recovery_grant`
httpOnly cookie. The reset-password page and the `resetPassword` server action require
both a valid session and that cookie, so a normal sign-in session cannot change the
password without the emailed link. The cookie is cleared after a successful password
change.

Redirect targets passed as `?next=` are validated by `safeRedirectPath`, which rejects
backslashes and control characters that browsers fold into external origins. The confirm
handler additionally checks that the resolved URL stays on the same origin.

Enumeration is avoided throughout: sign-in reports the same message for an unknown address
and a wrong password, `resetPasswordForEmail` always reports success, and sign-up always
ends on `/verify-email` because Supabase returns an obfuscated user for an address that
already exists.

Two settings live in the Supabase dashboard rather than in this repository: email
confirmation must stay enabled (`mailer_autoconfirm` off), and the redirect allow list must
cover `/confirm` on every environment origin.

## 6. Data access model

**Reads** happen in Server Components through `utils/supabase/server.ts`, using the
publishable key and the user's session. RLS scopes the results, so queries do not need to
add `where user_id = ...` for correctness — although they still should, so the planner can
use the indexes.

**Writes** happen in Server Actions in `lib/**/actions.ts`. Each action:

1. Resolves the user and rejects the call if there is none.
2. Parses input with the Zod schema for that form.
3. Performs the mutation through the RLS-bound client.
4. Calls `revalidatePath` for the affected routes, then `redirect` when appropriate.

**The service-role key is used in exactly one place**: `lib/supabase/admin.ts`, imported
only by the Stripe webhook handler, which has no user session but must update an invoice.
That module is `import 'server-only'` and never reaches a client bundle. Note that any
variable prefixed with `NEXT_PUBLIC_` is shipped to the browser, so the service key must
never carry that prefix.

## 7. Invoice lifecycle implementation

### 7.1 Drafts

A draft is a row in `invoices` with `status = 'draft'` and no invoice number. The editor
autosaves or saves explicitly through a server action. Validation for drafts is
deliberately loose.

### 7.2 Finalizing

Finalizing is a single database function call (`finalize_invoice`) rather than a sequence
of client-issued statements, so numbering and freezing happen atomically:

1. Validate the invoice is complete and still a draft.
2. Increment the per-user, per-year counter and format the number as `YYYY-NNNN`.
3. Copy the current profile fields into the invoice's `sender_*` columns and the current
   client fields into the `client_*` columns.
4. Set `status = 'finalized'` and `finalized_at = now()`.

The counter row is locked by the `insert ... on conflict do update` in that function, so
two concurrent finalizations cannot produce the same number.

Afterwards the application renders the PDF and stores it as version 1.

### 7.3 Editing and locking

- Drafts and finalized unpaid invoices are editable.
- Paid invoices are locked by a database trigger, not only by UI state. The trigger
  rejects any update to a paid invoice that changes anything other than the payment
  fields, so reverting to unpaid remains possible. Deletion of paid invoices is blocked by
  the RLS `delete` policy.
- Editing a finalized invoice bumps `content_version`. If the invoice had already been
  sent, the UI opens the re-send confirmation dialog after saving.

### 7.4 Money and rounding

Amounts are `numeric(14,2)` in Postgres and are handled as strings in TypeScript up to the
point of arithmetic, never as accumulated floats. All four supported currencies (EUR, USD,
GBP, CHF) use two decimal places, so the conversion to Stripe's minor units is a single
`Math.round(amount * 100)` applied once to the final total. Line totals, subtotal, tax,
and total are computed by the pure functions in `lib/invoices/calculations.ts` and
re-computed by a database trigger, so the screen, the PDF, and the charged amount cannot
drift apart.

Rounding rule: each line total is rounded to two decimals, the subtotal is the sum of
rounded line totals, tax is the rounded product of subtotal and rate, and total is their
sum.

## 8. PDF generation and storage

`lib/invoices/pdf/InvoiceDocument.tsx` defines the document with `@react-pdf/renderer`.
Rendering runs server-side, either at the end of the finalize action or in a dedicated
route handler on the Node runtime, and produces a buffer.

- The buffer is uploaded to the private Supabase Storage bucket `invoice-pdfs` at
  `{user_id}/{invoice_id}/v{version}.pdf`, and a row is inserted into `invoice_pdfs`.
- A new version is rendered whenever a finalized invoice is edited and re-sent. Old
  versions stay in place; `invoice_pdfs.version` identifies the latest.
- Downloads go through `app/api/invoices/[id]/pdf/route.ts`, which authenticates the user,
  confirms ownership, and either streams the object or issues a short-lived signed URL.
  The bucket is never public.
- Storage policies restrict every object to the owning user by matching the first path
  segment against `auth.uid()`. Because the app replaces rather than overwrites, only
  `insert` and `select` are needed; upsert would additionally require `update`.

Fonts are registered explicitly in the document module so output is identical on every
machine, and the layout is fixed to A4.

## 9. Stripe integration

### 9.1 Account model

The product requires that each freelancer is paid directly with no platform commission, so
the integration uses **Connect with Standard accounts and direct charges**. The connected
account is the merchant of record, owns the customer relationship, and pays Stripe's fees.
The platform account only orchestrates.

Onboarding:

1. `/api/stripe/connect/start` creates a Standard account (or reuses the stored one),
   creates an account link, and redirects the user to Stripe.
2. The user completes Stripe's hosted onboarding.
3. `/api/stripe/connect/return` retrieves the account and stores `charges_enabled` and
   `details_submitted` on the profile. The same fields are refreshed from the
   `account.updated` webhook, because onboarding can complete asynchronously.

Every API call that concerns a connected account passes `{ stripeAccount: accountId }` so
the request is authenticated as that account.

### 9.2 Payment links

Stripe's Payment Links API needs a `Price` object; it does not accept an inline amount. So
for each invoice, on the connected account:

1. Create a `Product` named after the invoice number.
2. Create a `Price` with `unit_amount` in minor units and the invoice currency.
3. Create a `PaymentLink` with that price, quantity 1, and metadata containing the invoice
   id and the owning user id.
4. Store `stripe_payment_link_id` and `stripe_payment_link_url` on the invoice.

This happens at send time, not at save time. Links are never deleted — Stripe does not
allow it — they are deactivated with `active: false`. Deactivation is triggered when the
amount changes, when the user marks the invoice paid manually, and when the invoice is
paid through Stripe. A new link is created on the next send.

All create calls pass an idempotency key derived from the invoice id and its content
version, so a retried send cannot produce two live links for the same invoice.

### 9.3 Webhooks

Because charges happen on connected accounts, the endpoint must be registered with the
**connected accounts** scope; events for direct charges are not delivered to a
platform-scoped endpoint. Each event carries a top-level `account` property identifying
the connected account.

`app/api/stripe/webhook/route.ts`:

1. Reads the raw body (no JSON parsing before verification) and verifies the signature
   with `stripe.webhooks.constructEvent` and the endpoint secret.
2. Inserts `event.id` into `stripe_events`. A unique-violation means the event was already
   handled, and the handler returns `200` immediately — this is the exactly-once guard the
   PRD requires.
3. Handles the event:
   - `checkout.session.completed` with `payment_status = 'paid'` — resolve the invoice
     from `session.payment_link` or the metadata, verify `event.account` matches the
     owner's stored account id, verify the amount and currency, then set the invoice to
     paid with `paid_source = 'stripe'` and deactivate the link.
   - `account.updated` — refresh the profile's capability flags.
4. Returns `200` quickly; anything slow is deferred rather than done inline, since Stripe
   retries on timeouts.

The handler writes with the service-role client because there is no user session on a
webhook request. It must therefore scope every statement by the invoice id it resolved and
never trust ids from the payload without checking they belong to the account in
`event.account`.

Local development uses `stripe listen --forward-connect-to` (not `--forward-to`), which is
the only way connected-account events reach a local endpoint.

## 10. Email

Resend sends the invoice. The message is built with React Email components in
`lib/email/templates/InvoiceEmail.tsx` and contains the user's message, the payment link
button when a link exists, and the PDF as an attachment.

- `from` is the application's verified sending domain, with the user's name as the display
  name.
- `reply_to` is the user's email so replies bypass the platform.
- The attachment is the stored PDF buffer, named `{invoice_number}.pdf`.
- Each attempt writes a row to `invoice_sends` with the Resend message id or the error, so
  the detail screen can show the send history and failures can be retried.
- Sending is the last step of the send action: the payment link is created first, and if
  the email fails the invoice stays consistent and the user sees a clear error.

## 11. Environment variables

| Variable                              | Where       | Purpose                             |
| ------------------------------------- | ----------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`            | client+server | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| client+server | Publishable key, RLS-bound         |
| `SUPABASE_SERVICE_ROLE_KEY`           | server only | Webhook writes; never `NEXT_PUBLIC_` |
| `STRIPE_SECRET_KEY`                   | server only | Platform secret key                  |
| `STRIPE_CONNECT_WEBHOOK_SECRET`       | server only | Signature verification               |
| `RESEND_API_KEY`                      | server only | Email delivery                       |
| `EMAIL_FROM`                          | server only | Verified sending address             |
| `NEXT_PUBLIC_APP_URL`                 | client+server | Absolute URLs for Stripe redirects and Supabase email links |

The first two are already present in `.env.local`; the rest need to be added there and in
the Vercel project settings. `NEXT_PUBLIC_APP_URL` is optional in local development —
`lib/auth/urls.ts` falls back to the request's forwarded host, defaulting to `https` except
on `localhost` and `127.0.0.1` — but it must be set on any deployed environment so email
links point at the right origin.

## 12. Error handling and validation

- Zod schemas in `lib/**/schemas.ts` are the single source of truth, used by the client
  form and re-parsed inside the server action.
- Server actions return a typed `{ ok: false, error }` result for expected failures and
  throw only on genuinely exceptional ones.
- Forms are client components using react-hook-form with `zodResolver`, which renders
  per-field errors through `FieldError`. Submitting calls the server action directly and
  surfaces its returned error in a toast; `formState.isSubmitting` drives the pending
  state. On success the action redirects, so the form never has to navigate itself.
- `error.tsx` and `not-found.tsx` boundaries cover the `(app)` segment.
- Third-party failures (Stripe, Resend) are caught, written to the relevant history table,
  and shown to the user with a retry, rather than being swallowed.

## 13. Security checklist

- RLS enabled on every table in `public`, with policies that combine `to authenticated`
  with an `auth.uid()` ownership predicate. `to authenticated` alone is not authorization.
- `auth.uid()` wrapped in a subselect inside policies so it is evaluated once per query.
- Update policies always specify both `using` and `with check`, otherwise a user could
  reassign a row to someone else.
- `security definer` avoided unless a function genuinely must bypass RLS; where used, it
  sets `search_path = ''` and checks `auth.uid()` internally.
- Service-role key confined to the webhook path.
- Webhook signature verified before the payload is trusted, and event ids de-duplicated.
- Storage bucket private, with per-user path policies and signed URLs for downloads.
- Package versions pinned and the lockfile committed.

## 14. Deployment

Vercel hosts the app. The Stripe Connect webhook URL points at
`https://<domain>/api/stripe/webhook` and is registered with the connected-accounts scope.
Resend needs its sending domain verified with SPF and DKIM records before real invoices go
out. Supabase migrations live in `supabase/migrations/` and are applied per environment.

## 15. Suggested build order

1. Database schema, RLS policies, and the storage bucket from [DB.md](./DB.md).
2. Auth screens and the protected `(app)` shell.
3. Profile and client CRUD — the smallest complete slice.
4. Invoice editor with calculations, drafts, and finalizing with numbering.
5. PDF rendering, storage, and download.
6. Stripe Connect onboarding and profile connection state.
7. Payment links, sending by email, and the send history.
8. Webhook, automatic paid status, and manual status override.
9. Invoice list with filters and pagination, then the dashboard.
