create table public.invoice_number_sequences (
  user_id     uuid     not null references auth.users (id) on delete cascade,
  year        smallint not null,
  last_number integer  not null default 0 check (last_number >= 0),

  primary key (user_id, year)
);

alter table public.invoice_number_sequences enable row level security;

create policy invoice_number_sequences_select_own on public.invoice_number_sequences
  for select to authenticated using ((select auth.uid()) = user_id);

create policy invoice_number_sequences_insert_own on public.invoice_number_sequences
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy invoice_number_sequences_update_own on public.invoice_number_sequences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- security invoker on purpose: RLS still applies to the calling user
create or replace function public.finalize_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql
set search_path = ''
as $$
declare
  v_invoice public.invoices;
  v_profile public.profiles;
  v_client  public.clients;
  v_year    smallint;
  v_seq     integer;
begin
  select * into v_invoice
    from public.invoices
   where id = p_invoice_id
     for update;

  if not found then
    raise exception 'Invoice not found' using errcode = 'no_data_found';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'Invoice is already finalized' using errcode = 'check_violation';
  end if;
  if v_invoice.client_id is null then
    raise exception 'Invoice has no client' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.invoice_line_items where invoice_id = p_invoice_id) then
    raise exception 'Invoice has no line items' using errcode = 'check_violation';
  end if;

  v_year := extract(year from v_invoice.invoice_date)::smallint;

  insert into public.invoice_number_sequences (user_id, year, last_number)
       values (v_invoice.user_id, v_year, 1)
  on conflict (user_id, year)
  do update set last_number = public.invoice_number_sequences.last_number + 1
    returning last_number into v_seq;

  select * into v_profile from public.profiles where id = v_invoice.user_id;
  select * into v_client  from public.clients  where id = v_invoice.client_id;

  update public.invoices set
      status              = 'finalized',
      finalized_at        = now(),
      number_year         = v_year,
      number_sequence     = v_seq,
      invoice_number      = v_year::text || '-' || lpad(v_seq::text, 4, '0'),
      sender_full_name    = v_profile.full_name,
      sender_company_name = v_profile.company_name,
      sender_email        = v_profile.email,
      sender_address      = v_profile.address,
      sender_vat_id       = v_profile.vat_id,
      sender_website      = v_profile.website,
      client_full_name    = v_client.full_name,
      client_company_name = v_client.company_name,
      client_email        = v_client.email,
      client_address      = v_client.address,
      client_vat_id       = v_client.vat_id
    where id = p_invoice_id
  returning * into v_invoice;

  return v_invoice;
end;
$$;
