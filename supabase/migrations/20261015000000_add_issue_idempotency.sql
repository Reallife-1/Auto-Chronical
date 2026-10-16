alter table public.issues
  add column idempotency_key text,
  add column request_hash text;

create unique index issues_idempotency_key_unique
  on public.issues (reported_by, vehicle_id, idempotency_key)
  where idempotency_key is not null;
