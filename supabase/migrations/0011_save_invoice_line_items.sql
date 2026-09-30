create or replace function public.replace_invoice_line_items(p_invoice_id uuid, p_items jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_invoice public.invoices;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Line items must be an array' using errcode = 'invalid_parameter_value';
  end if;

  select * into v_invoice
    from public.invoices
   where id = p_invoice_id
     for update;

  if not found then
    raise exception 'Invoice not found' using errcode = 'no_data_found';
  end if;
  if v_invoice.payment_status = 'paid' then
    raise exception 'A paid invoice cannot be edited' using errcode = 'check_violation';
  end if;

  delete from public.invoice_line_items where invoice_id = p_invoice_id;

  insert into public.invoice_line_items
    (invoice_id, user_id, position, description, quantity, unit_type, unit_price)
  select p_invoice_id,
         v_invoice.user_id,
         (t.ordinality - 1)::integer,
         coalesce(t.item ->> 'description', ''),
         (t.item ->> 'quantity')::numeric(12,2),
         coalesce(t.item ->> 'unit_type', 'flat'),
         (t.item ->> 'unit_price')::numeric(14,2)
    from jsonb_array_elements(p_items) with ordinality as t(item, ordinality);

  perform public.recalculate_invoice_totals(p_invoice_id);

  if v_invoice.status = 'finalized' then
    update public.invoices
       set content_version = content_version + 1
     where id = p_invoice_id;
  end if;
end;
$$;

revoke execute on function public.replace_invoice_line_items(uuid, jsonb) from public, anon;
grant execute on function public.replace_invoice_line_items(uuid, jsonb) to authenticated;
