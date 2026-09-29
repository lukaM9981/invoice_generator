insert into storage.buckets (id, name, public)
values ('invoice-pdfs', 'invoice-pdfs', false)
on conflict (id) do nothing;

create policy invoice_pdf_objects_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy invoice_pdf_objects_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'invoice-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
