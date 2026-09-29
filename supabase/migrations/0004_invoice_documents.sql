create table public.invoice_pdfs (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid        not null,
  user_id      uuid        not null,

  version      integer     not null check (version > 0),
  storage_path text        not null unique,
  byte_size    integer,

  created_at   timestamptz not null default now(),

  constraint invoice_pdfs_invoice_fk
    foreign key (invoice_id, user_id)
    references public.invoices (id, user_id) on delete cascade,

  constraint invoice_pdfs_version_key unique (invoice_id, version)
);

create index invoice_pdfs_invoice_idx on public.invoice_pdfs (invoice_id, version desc);
create index invoice_pdfs_user_idx    on public.invoice_pdfs (user_id);

create table public.invoice_sends (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid        not null,
  user_id             uuid        not null,
  pdf_id              uuid        references public.invoice_pdfs (id) on delete set null,

  to_email            text        not null,
  subject             text        not null,
  body                text        not null,
  payment_link_url    text,

  status              text        not null check (status in ('sent', 'failed')),
  provider_message_id text,
  error_message       text,

  created_at          timestamptz not null default now(),

  constraint invoice_sends_invoice_fk
    foreign key (invoice_id, user_id)
    references public.invoices (id, user_id) on delete cascade
);

create index invoice_sends_invoice_idx on public.invoice_sends (invoice_id, created_at desc);
create index invoice_sends_user_idx    on public.invoice_sends (user_id);
create index invoice_sends_pdf_idx     on public.invoice_sends (pdf_id);

alter table public.invoice_pdfs  enable row level security;
alter table public.invoice_sends enable row level security;

-- PDFs and send records are append-only from the user's side
create policy invoice_pdfs_select_own on public.invoice_pdfs
  for select to authenticated using ((select auth.uid()) = user_id);

create policy invoice_pdfs_insert_own on public.invoice_pdfs
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy invoice_sends_select_own on public.invoice_sends
  for select to authenticated using ((select auth.uid()) = user_id);

create policy invoice_sends_insert_own on public.invoice_sends
  for insert to authenticated with check ((select auth.uid()) = user_id);
