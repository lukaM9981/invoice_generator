# Invoice Generator — Product Requirements Document

## 1. Overview

Invoice Generator is a web application for freelancers who need to bill clients and get
paid. A user stores their own sender details, keeps a list of clients, builds an invoice
from line items, sends it to the client by email as a PDF attachment, and lets the client
pay online through a payment link. When the payment succeeds, the invoice is marked as
paid automatically.

The application is strictly single-user per account. There are no organizations, teams,
shared workspaces, or branding customization. Every user sees and manages only their own
profile, clients, invoices, and documents.

## 2. Goals

- Let a freelancer go from an empty account to a sent, payable invoice in a few minutes.
- Remove manual work around invoice numbering, tax calculation, and PDF creation.
- Make payment frictionless for the client: one link, correct amount, no account needed.
- Keep the payment status of every invoice accurate without manual bookkeeping.

## 3. Non-goals

The following are explicitly out of scope for this product:

- Multiple users, teams, roles, or permissions inside one account.
- Logo upload, colour themes, custom fonts, or any other invoice branding.
- Custom invoice templates or user-defined layouts.
- Recurring invoices, subscriptions, quotes, estimates, or credit notes.
- Partial payments, deposits, instalments, or payment plans.
- Discounts, shipping costs, late fees, or interest on overdue invoices.
- Expense tracking, time tracking, accounting reports, or tax filing.
- Multi-currency conversion or exchange rates.
- Client-facing portal or client login.
- Bank account details, payment terms text blocks, or invoice type fields on the document.

## 4. User role

There is exactly one role: **User**. A user can register, sign in, sign out, reset a
forgotten password, maintain their sender details, connect a payment account, manage
clients, create and send invoices, track payment status, and delete unpaid invoices.

## 5. Core concepts

### 5.1 Invoice lifecycle

An invoice carries two independent states.

**Document status** describes how finished the invoice is:

- **Draft** — a work in progress. It has no invoice number, is not visible to anyone but
  the user, and can be freely edited or deleted.
- **Finalized** — a real, issued invoice. It has a permanent invoice number and a frozen
  copy of the sender and client details.

**Payment status** describes whether the money arrived:

- **Unpaid** — the default for every finalized invoice.
- **Paid** — set automatically when an online payment succeeds, or manually by the user
  when they were paid another way (bank transfer, cash).

A finalized, unpaid invoice whose due date has passed is shown as **overdue**. Overdue is
not a third status; it is a visual indicator derived from the due date.

### 5.2 Frozen invoice details

When an invoice is finalized, it stores its own copy of the sender details and the client
details as they were at that moment. Editing the profile or the client afterwards changes
nothing on invoices that were already issued. This keeps every issued invoice identical to
the PDF that was sent to the client.

## 6. Features

### 6.1 Authentication

- Register with email address and password.
- Sign in and sign out.
- Reset a forgotten password by requesting a reset link sent to the registered email.
- All application screens except the landing page and the authentication screens require a
  signed-in user.

### 6.2 Profile and sender details

The profile holds the information printed in the "From" block of every invoice:

| Field        | Required |
| ------------ | -------- |
| Full name    | Optional |
| Company name | Optional |
| Email        | Optional |
| Address      | Optional |
| VAT ID       | Optional |
| Website      | Optional |

All fields are optional, and all of them are pre-filled into every new invoice. The
profile screen also holds the default email message used when sending invoices, and the
payment account connection described below.

### 6.3 Payment account connection

Each user connects their own payment provider account. Money from a paid invoice goes
directly to that user; the application never holds funds and takes no commission.

- The profile screen shows the connection state: not connected, incomplete onboarding, or
  ready to accept payments.
- Connecting opens the provider's hosted onboarding flow and returns the user to the
  profile screen afterwards.
- A user who has not finished onboarding can still create, finalize, and send invoices.
  Those invoices are sent without a payment link, and the user is warned about this before
  sending.
- A user can disconnect the account. Existing paid invoices are unaffected; unpaid
  invoices lose their payment links.

### 6.4 Client management

A user maintains their own list of clients.

| Field        | Required |
| ------------ | -------- |
| Full name    | Optional |
| Company name | Optional |
| Email        | Optional |
| Address      | Optional |
| VAT ID       | Optional |

Supported actions are create, view, edit, and delete. Deleting a client only hides it: the
client disappears from the list and from the invoice dropdown, but past invoices keep the
client details exactly as they were issued. A client without an email address can be put
on an invoice, but that invoice cannot be emailed until an address is supplied.

When creating an invoice, the client is chosen from a dropdown of the user's clients.

### 6.5 Invoice creation

Invoices follow one fixed layout with no customization options.

**Header**

- **From** — pre-filled from the profile.
- **To** — the selected client.
- **Invoice number** — generated by the system, never typed by the user.
- **Invoice date** — defaults to today.
- **Due date** — defaults to fourteen days after the invoice date.
- **Currency** — one of EUR, USD, GBP, CHF. One invoice has exactly one currency.
- **Tax rate** — a single percentage that applies to the whole invoice.

**Line items** — the user adds as many rows as needed. Each row has:

- Description
- Quantity
- Unit type: hours or flat
- Price per unit

**Totals** — calculated by the system and not editable:

- Subtotal — the sum of all line rows (quantity multiplied by unit price).
- Tax — the subtotal multiplied by the invoice tax rate.
- Total — subtotal plus tax.

**Footer** — a free-text comments field.

An invoice can be saved as a draft at any point, with no validation beyond what is needed
to store it. Finalizing requires a selected client, at least one line item with a
description and a positive amount, an invoice date, and a due date.

### 6.6 Invoice numbering

- The number is assigned only when an invoice is finalized, so deleted drafts never leave
  gaps in the sequence.
- The format is the year of the invoice date followed by a four-digit counter, for example
  `2026-0001`.
- The counter restarts at `0001` at the start of each year and is independent per user.
- Once assigned, the number never changes, not even if the invoice date is later edited
  into a different year.

### 6.7 PDF document

Every finalized invoice is rendered as a PDF that mirrors the on-screen layout: header,
sender and client blocks, invoice metadata, line items, subtotal, tax, total, and the
comments footer.

- The PDF is generated when the invoice is finalized and stored permanently.
- Editing and re-sending a finalized invoice produces a new version. Older versions are
  kept, so it stays possible to see exactly what the client received and when.
- The user can download the current version from the invoice list and from the invoice
  detail screen.

### 6.8 Payment link

- A payment link for the exact invoice total is created at the moment the invoice is
  sent, not when it is saved. It is tied to that specific invoice, that client, and that
  amount, and it charges into the user's connected payment account.
- If the user edits a sent invoice in a way that changes the amount, the old link is
  cancelled and a new link is created the next time the invoice is sent.
- When the user manually marks an invoice as paid, the open link is cancelled so the
  client cannot pay twice.
- If the user reverts an invoice back to unpaid, a fresh link is created on the next send.

### 6.9 Sending the invoice

One action sends the invoice to the client's email address. The email contains:

- A short message body, pre-filled from the user's default message and editable before
  every send.
- The invoice PDF as an attachment.
- The payment link, when one is available.

Mail is sent from the application's own sending address, with the reply-to header set to
the user's email so client replies reach the user directly. Sending failures are surfaced
to the user with the reason and can be retried. Every send attempt is recorded, so the
invoice detail screen shows when the invoice was sent and how many times.

### 6.10 Re-sending after an edit

If the user edits an invoice that was already sent, saving it opens a confirmation dialog
asking whether to re-send it to the client. Nothing is sent without that confirmation. The
user can also re-send at any time from the invoice list.

### 6.11 Payment status

An invoice becomes paid in one of two ways:

1. Automatically, when the payment provider confirms a successful payment for its link.
2. Manually, when the user marks it as paid.

A paid invoice is locked: it cannot be edited or deleted, and its line items cannot be
changed. The user can still view it, download the PDF, and re-send it. The only permitted
change is reverting the payment status back to unpaid, which unlocks the invoice again.

No separate payment confirmation email is sent to the client.

### 6.12 Invoice list

A paginated list of all invoices, newest first, showing invoice number, client, invoice
date, due date, total, and status. Overdue invoices are visually marked. The list can be
filtered by status and searched by client name or invoice number.

Available actions per invoice:

| Action       | Draft | Finalized & unpaid | Paid |
| ------------ | ----- | ------------------ | ---- |
| View         | Yes   | Yes                | Yes  |
| Edit         | Yes   | Yes                | No   |
| Delete       | Yes   | Yes                | No   |
| Send         | No    | Yes                | Yes  |
| Download PDF | No    | Yes                | Yes  |
| Mark as paid | No    | Yes                | —    |

### 6.13 Dashboard

The landing screen after sign-in shows:

- Total amount paid, total amount outstanding, and total amount overdue.
- Number of clients and number of invoices issued.
- The most recent invoices with their status.
- A prompt to finish setting up the profile or connect the payment account when either is
  incomplete.

## 7. Business rules

1. A user can only ever see and act on their own profile, clients, invoices, and PDFs.
2. Drafts have no invoice number; finalized invoices always have one.
3. Invoice numbers are unique per user and are never reused or renumbered.
4. An invoice has exactly one currency and one tax rate.
5. Sender and client details on a finalized invoice are frozen copies and never change
   retroactively.
6. Paid invoices cannot be edited or deleted.
7. Deleting a client hides it but preserves the client details already on issued invoices.
8. At most one payment link is active per invoice at any time.
9. Totals are always computed by the system and never entered by hand.

## 8. Screens

| Screen                | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| Landing               | Product introduction and entry point to sign in or register    |
| Register              | Create an account                                              |
| Sign in               | Authenticate                                                   |
| Forgot password       | Request a reset link                                           |
| Reset password        | Set a new password from the emailed link                       |
| Dashboard             | Summary figures and recent invoices                            |
| Invoice list          | Paginated history with filters and per-invoice actions         |
| Invoice editor        | Create or edit an invoice, save as draft, or finalize          |
| Invoice detail        | Read-only view with PDF preview, send history, status controls |
| Send invoice dialog   | Confirm recipient, edit the message, send                      |
| Clients list          | All clients with create, edit, and delete                      |
| Client editor         | Add or edit a single client                                    |
| Profile settings      | Sender details, default email message, payment connection      |

## 9. Non-functional requirements

- **Responsive** — usable on phone, tablet, and desktop; the invoice editor stays workable
  on a small screen.
- **Validation** — every form validates before submitting and shows field-level errors.
- **Consistent PDF** — the document renders identically regardless of who opens it and
  stays readable when printed on A4.
- **Reliable payment confirmation** — payment notifications are verified as authentic and
  processed exactly once, even if the provider delivers the same notification twice.
- **Email error handling** — a failed send never leaves the invoice in an unclear state,
  and the user always learns whether the email went out.
- **Data protection** — every request is authenticated, and data access is restricted at
  the storage layer so one user's data can never be reached from another user's session.
- **Money accuracy** — amounts are stored and calculated exactly, with no floating point
  rounding drift between the screen, the PDF, and the charged amount.

## 10. Open questions

| Question                                                              | Proposed default             |
| --------------------------------------------------------------------- | ---------------------------- |
| Must a new user confirm their email address before signing in?         | Yes, confirmation required   |
| How many invoices per page in the list?                                | 20                           |
| What language is the user interface written in?                        | English                      |
