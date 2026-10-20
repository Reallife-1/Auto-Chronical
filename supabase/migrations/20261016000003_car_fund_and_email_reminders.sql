begin;

create table public.car_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  target_date date,
  contribution_cadence text check (
    contribution_cadence in ('daily', 'weekly', 'monthly')
  ),
  planned_contribution_amount numeric(12, 2)
    check (planned_contribution_amount > 0),
  reminders_enabled boolean not null default false,
  reminder_anchor_day smallint not null default 1
    check (reminder_anchor_day between 1 and 31),
  next_reminder_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (contribution_cadence is null and planned_contribution_amount is null)
    or
    (contribution_cadence is not null and planned_contribution_amount is not null)
  ),
  check (
    not reminders_enabled
    or (
      contribution_cadence is not null
      and planned_contribution_amount is not null
      and next_reminder_date is not null
    )
  )
);

create table public.car_fund_contributions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.car_funds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  contributed_at timestamptz not null default now(),
  note text check (length(note) <= 500),
  created_at timestamptz not null default now()
);
create index vehicles_service_reminder_idx
  on public.vehicles (next_service)
  where is_archived = false and next_service is not null;
create index car_fund_contributions_activity_idx
  on public.car_fund_contributions (fund_id, contributed_at desc, id desc);

create or replace function public.lock_car_fund_currency()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_currency text;
begin
  select currency into v_currency
  from public.car_funds
  where id = new.fund_id and user_id = new.user_id
  for update;

  if not found then
    raise exception 'car_fund_not_found';
  end if;
  return new;
end;
$$;

create trigger car_fund_contributions_lock_fund
  before insert on public.car_fund_contributions
  for each row execute function public.lock_car_fund_currency();

create or replace function public.prevent_car_fund_currency_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.currency <> old.currency and exists (
    select 1 from public.car_fund_contributions
    where fund_id = old.id
  ) then
    raise exception 'car_fund_currency_has_contributions';
  end if;
  return new;
end;
$$;

create trigger car_funds_currency_immutable_after_contribution
  before update of currency on public.car_funds
  for each row execute function public.prevent_car_fund_currency_change();

alter table public.car_funds enable row level security;
alter table public.car_fund_contributions enable row level security;

create policy car_funds_owner_all on public.car_funds
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy car_fund_contributions_owner_all
  on public.car_fund_contributions
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.car_funds f
      where f.id = fund_id and f.user_id = auth.uid()
    )
  );

create table public.email_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  reminder_key text not null unique,
  status text not null check (status in ('sending', 'sent', 'failed')),
  claimed_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.email_reminder_deliveries enable row level security;

create or replace function public.claim_email_reminder(p_reminder_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery_id uuid;
begin
  insert into public.email_reminder_deliveries (
    reminder_key, status, claimed_at
  ) values (
    p_reminder_key, 'sending', now()
  )
  on conflict (reminder_key) do update
    set status = 'sending', claimed_at = now(), sent_at = null
    where public.email_reminder_deliveries.status = 'failed'
      or (
        public.email_reminder_deliveries.status = 'sending'
        and public.email_reminder_deliveries.claimed_at
          < now() - interval '30 minutes'
      )
  returning id into v_delivery_id;

  return v_delivery_id;
end;
$$;

create or replace function public.fail_email_reminder(p_delivery_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.email_reminder_deliveries
  set status = 'failed'
  where id = p_delivery_id and status = 'sending';
$$;

create or replace function public.complete_email_reminder(p_delivery_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.email_reminder_deliveries
  set status = 'sent', sent_at = now()
  where id = p_delivery_id and status = 'sending';
$$;

create or replace function public.prepare_car_fund_reminder(
  p_fund_id uuid,
  p_expected_date date
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fund public.car_funds%rowtype;
  v_balance numeric(12, 2);
begin
  select * into v_fund
  from public.car_funds
  where id = p_fund_id
  for update;

  if not found
    or not v_fund.reminders_enabled
    or v_fund.next_reminder_date <> p_expected_date
  then
    return false;
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from public.car_fund_contributions
  where fund_id = p_fund_id;

  if v_balance >= v_fund.target_amount then
    update public.car_funds
    set reminders_enabled = false, next_reminder_date = null
    where id = p_fund_id;
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.complete_car_fund_reminder(
  p_delivery_id uuid,
  p_fund_id uuid,
  p_expected_date date,
  p_local_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fund public.car_funds%rowtype;
  v_next_date date;
  v_balance numeric(12, 2);
  v_month_start date;
  v_days_in_month integer;
begin
  select * into v_fund
  from public.car_funds
  where id = p_fund_id
  for update;

  if not found
    or not v_fund.reminders_enabled
    or v_fund.next_reminder_date <> p_expected_date
  then
    update public.email_reminder_deliveries
    set status = 'sent', sent_at = now()
    where id = p_delivery_id and status = 'sending';
    return;
  end if;

  update public.email_reminder_deliveries
  set status = 'sent', sent_at = now()
  where id = p_delivery_id and status = 'sending';

  select coalesce(sum(amount), 0) into v_balance
  from public.car_fund_contributions
  where fund_id = p_fund_id;

  if v_balance >= v_fund.target_amount then
    update public.car_funds
    set reminders_enabled = false, next_reminder_date = null
    where id = p_fund_id;
    return;
  end if;

  v_next_date := p_expected_date;
  loop
    if v_fund.contribution_cadence = 'daily' then
      v_next_date := v_next_date + 1;
    elsif v_fund.contribution_cadence = 'weekly' then
      v_next_date := v_next_date + 7;
    else
      v_month_start := date_trunc('month', v_next_date::timestamp)::date
        + interval '1 month';
      v_days_in_month := extract(
        day from (v_month_start + interval '1 month - 1 day')
      )::integer;
      v_next_date := v_month_start
        + least(v_fund.reminder_anchor_day, v_days_in_month) - 1;
    end if;
    exit when v_next_date > p_local_date;
  end loop;

  update public.car_funds
  set next_reminder_date = v_next_date, updated_at = now()
  where id = p_fund_id;
end;
$$;

revoke all on function public.claim_email_reminder(text)
  from public, anon, authenticated;
revoke all on function public.fail_email_reminder(uuid)
  from public, anon, authenticated;
revoke all on function public.complete_email_reminder(uuid)
  from public, anon, authenticated;
revoke all on function public.prepare_car_fund_reminder(uuid, date)
  from public, anon, authenticated;
revoke all on function public.complete_car_fund_reminder(uuid, uuid, date, date)
  from public, anon, authenticated;
grant execute on function public.claim_email_reminder(text) to service_role;
grant execute on function public.fail_email_reminder(uuid) to service_role;
grant execute on function public.complete_email_reminder(uuid) to service_role;
grant execute on function public.prepare_car_fund_reminder(uuid, date)
  to service_role;
grant execute on function public.complete_car_fund_reminder(uuid, uuid, date, date)
  to service_role;

commit;
