create table public.invoices (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid        not null references auth.users (id) on delete cascade,
  client_id                  uuid        references public.clients (id) on delete restrict,

  -- document status and payment status are independent
  status                     text        not null default 'draft'
                               check (status in ('draft', 'finalized')),
  payment_status             text        not null default 'unpaid'
                               check (payment_status in ('unpaid', 'paid')),
  paid_source                text        check (paid_source in ('stripe', 'manual')),
  paid_at                    timestamptz,

  -- assigned only at finalization
  invoice_number             text,
  number_year                smallint,
  number_sequence            integer,

  invoice_date               date        not null default current_date,
  due_date                   date        not null default (current_date + 14),
  currency                   text        not null default 'EUR'
                               check (currency in ('EUR', 'USD', 'GBP', 'CHF')),
  tax_rate                   numeric(5,2) not null default 0
                               check (tax_rate >= 0 and tax_rate <= 100),

  subtotal                   numeric(14,2) not null default 0,
  tax_amount                 numeric(14,2) not null default 0,
  total                      numeric(14,2) not null default 0,
  comments                   text,

  -- frozen copy of the profile at finalization
  sender_full_name           text,
  sender_company_name        text,
  sender_email               text,
  sender_address             text,
  sender_vat_id              text,
  sender_website             text,

  -- frozen copy of the client at finalization
  client_full_name           text,
  client_company_name        text,
  client_email               text,
  client_address             text,
  client_vat_id              text,

  stripe_payment_link_id     text,
  stripe_payment_link_url    text,
  stripe_checkout_session_id text,

  content_version            integer     not null default 1,
  finalized_at               timestamptz,
  first_sent_at              timestamptz,
  last_sent_at               timestamptz,
  send_count                 integer     not null default 0,

  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  -- lets child tables carry a composite foreign key on (invoice_id, user_id)
  constraint invoices_id_user_key unique (id, user_id),

  constraint invoices_due_after_issue
    check (due_date >= invoice_date),

  constraint invoices_finalized_has_number check (
    (status = 'draft'     and invoice_number is null     and finalized_at is null) or
    (status = 'finalized' and invoice_number is not null and finalized_at is not null)
  ),

  constraint invoices_paid_has_details check (
    (payment_status = 'unpaid' and paid_at is null     and paid_source is null) or
    (payment_status = 'paid'   and paid_at is not null and paid_source is not null)
  ),

  constraint invoices_draft_cannot_be_paid
    check (not (status = 'draft' and payment_status = 'paid'))
);

create unique index invoices_user_number_key
  on public.invoices (user_id, invoice_number)
  where invoice_number is not null;

create index invoices_user_created_idx on public.invoices (user_id, created_at desc);
create index invoices_user_status_idx  on public.invoices (user_id, status, payment_status);
create index invoices_client_id_idx    on public.invoices (client_id);

create unique index invoices_payment_link_idx
  on public.invoices (stripe_payment_link_id)
  where stripe_payment_link_id is not null;

create index invoices_overdue_idx
  on public.invoices (user_id, due_date)
  where status = 'finalized' and payment_status = 'unpaid';

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.tg_set_updated_at();

create table public.invoice_line_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid          not null,
  user_id     uuid          not null,

  position    integer       not null,
  description text          not null default '',
  quantity    numeric(12,2) not null default 1 check (quantity > 0),
  unit_type   text          not null default 'flat'
                check (unit_type in ('hours', 'flat')),
  unit_price  numeric(14,2) not null default 0 check (unit_price >= 0),
  line_total  numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,

  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),

  constraint invoice_line_items_invoice_fk
    foreign key (invoice_id, user_id)
    references public.invoices (id, user_id) on delete cascade,

  constraint invoice_line_items_position_key
    unique (invoice_id, position) deferrable initially deferred
);

create index invoice_line_items_invoice_idx on public.invoice_line_items (invoice_id);
create index invoice_line_items_user_idx    on public.invoice_line_items (user_id);

create trigger invoice_line_items_set_updated_at
  before update on public.invoice_line_items
  for each row execute function public.tg_set_updated_at();

alter table public.invoices           enable row level security;
alter table public.invoice_line_items enable row level security;

create policy invoices_select_own on public.invoices
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy invoices_insert_own on public.invoices
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy invoices_update_own on public.invoices
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy invoices_delete_unpaid on public.invoices
  for delete to authenticated
  using ((select auth.uid()) = user_id and payment_status <> 'paid');

create policy invoice_line_items_select_own on public.invoice_line_items
  for select to authenticated using ((select auth.uid()) = user_id);

create policy invoice_line_items_insert_own on public.invoice_line_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy invoice_line_items_update_own on public.invoice_line_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy invoice_line_items_delete_own on public.invoice_line_items
  for delete to authenticated using ((select auth.uid()) = user_id);
