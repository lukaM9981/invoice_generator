create table public.stripe_events (
  id           text primary key,          -- Stripe event id, evt_...
  type         text        not null,
  account_id   text,                      -- connected account from event.account
  payload      jsonb,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);

-- RLS on with no policies: only the service role, which bypasses RLS, can reach this table
alter table public.stripe_events enable row level security;
