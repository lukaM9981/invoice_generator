create policy invoice_pdf_objects_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
