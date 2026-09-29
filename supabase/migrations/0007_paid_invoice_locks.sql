create or replace function public.tg_invoices_block_paid_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_mutable_keys text[] := array[
    'payment_status', 'paid_at', 'paid_source',
    'stripe_payment_link_id', 'stripe_payment_link_url', 'stripe_checkout_session_id',
    'first_sent_at', 'last_sent_at', 'send_count', 'updated_at'
  ];
begin
  if old.payment_status = 'paid' and new.payment_status = 'paid' then
    if (to_jsonb(new) - v_mutable_keys) is distinct from (to_jsonb(old) - v_mutable_keys) then
      raise exception 'A paid invoice cannot be edited'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger invoices_block_paid_changes
  before update on public.invoices
  for each row execute function public.tg_invoices_block_paid_changes();

create or replace function public.tg_line_items_block_when_paid()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_paid boolean;
begin
  select payment_status = 'paid' into v_paid
    from public.invoices
   where id = coalesce(new.invoice_id, old.invoice_id);

  if coalesce(v_paid, false) then
    raise exception 'Line items of a paid invoice cannot be changed'
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger invoice_line_items_block_when_paid
  before insert or update or delete on public.invoice_line_items
  for each row execute function public.tg_line_items_block_when_paid();
