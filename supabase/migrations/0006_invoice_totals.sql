create or replace function public.recalculate_invoice_totals(p_invoice_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.invoices i
     set subtotal   = t.subtotal,
         tax_amount = round(t.subtotal * i.tax_rate / 100, 2),
         total      = t.subtotal + round(t.subtotal * i.tax_rate / 100, 2)
    from (
      select coalesce(sum(line_total), 0) as subtotal
        from public.invoice_line_items
       where invoice_id = p_invoice_id
    ) t
   where i.id = p_invoice_id;
$$;

create or replace function public.tg_line_items_recalculate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.recalculate_invoice_totals(coalesce(new.invoice_id, old.invoice_id));
  return null;
end;
$$;

create trigger invoice_line_items_recalculate
  after insert or update or delete on public.invoice_line_items
  for each row execute function public.tg_line_items_recalculate();

create or replace function public.tg_invoice_recalculate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.recalculate_invoice_totals(new.id);
  return null;
end;
$$;

-- does not recurse: the update it performs never touches tax_rate
create trigger invoices_tax_rate_recalculate
  after update of tax_rate on public.invoices
  for each row when (old.tax_rate is distinct from new.tax_rate)
  execute function public.tg_invoice_recalculate();
