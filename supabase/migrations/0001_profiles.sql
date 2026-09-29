-- shared updated_at maintenance helper, used by every table that has updated_at
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,

  full_name                text,
  company_name             text,
  email                    text,
  address                  text,
  vat_id                   text,
  website                  text,

  default_email_subject    text,
  default_email_body       text,

  stripe_account_id        text unique,
  stripe_charges_enabled   boolean     not null default false,
  stripe_details_submitted boolean     not null default false,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- one profile row per account, created automatically on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
