create unique index clients_active_email_unique
  on public.clients (user_id, lower(email))
  where archived_at is null and email is not null;
