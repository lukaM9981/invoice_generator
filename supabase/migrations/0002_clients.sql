create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,

  full_name    text,
  company_name text,
  email        text,
  address      text,
  vat_id       text,

  archived_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index clients_user_id_idx on public.clients (user_id);
create index clients_active_idx  on public.clients (user_id, created_at desc)
  where archived_at is null;

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.tg_set_updated_at();

alter table public.clients enable row level security;

create policy clients_select_own on public.clients
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy clients_insert_own on public.clients
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy clients_update_own on public.clients
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy clients_delete_own on public.clients
  for delete to authenticated
  using ((select auth.uid()) = user_id);
