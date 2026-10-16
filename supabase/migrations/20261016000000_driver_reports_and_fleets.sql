begin;

create table public.fleets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fleet_members (
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role = 'driver'),
  created_at timestamptz not null default now(),
  primary key (fleet_id, user_id)
);
create index fleet_members_user_idx on public.fleet_members (user_id, fleet_id);

alter table public.vehicles
  add column fleet_id uuid references public.fleets(id) on delete set null;
create index vehicles_fleet_idx on public.vehicles (fleet_id);

alter table public.issues
  add column fleet_id uuid references public.fleets(id) on delete set null;
create index issues_fleet_idx on public.issues (fleet_id, reported_at desc);

create table public.driver_reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  fleet_id uuid references public.fleets(id) on delete set null,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in (
    'warning_light','strange_sound','car_feels_different','leak_or_unusual_smell',
    'engine_or_starting_problem','brakes_or_braking','steering_or_handling',
    'tire_or_wheel_problem','battery_or_electrical_issue','heating_or_air_conditioning',
    'bodywork_or_windscreen','something_else')),
  severity text not null check (severity in
    ('can_still_drive','drive_with_care','cannot_be_driven','not_sure')),
  timing text not null check (timing in
    ('intermittent','constant','when_starting','while_driving','when_braking')),
  description text,
  odometer_reading integer check (odometer_reading >= 0),
  occurred_at timestamptz,
  status text not null default 'new'
    check (status in ('new','logged','dismissed')),
  logged_by uuid references public.profiles(id) on delete set null,
  logged_at timestamptz,
  dismissed_by uuid references public.profiles(id) on delete set null,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index driver_reports_vehicle_idx
  on public.driver_reports (vehicle_id, status, created_at desc);
create index driver_reports_fleet_idx
  on public.driver_reports (fleet_id, status, created_at desc);

create or replace function public.set_driver_report_fleet_id()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  select v.fleet_id into new.fleet_id
  from public.vehicles v
  where v.id = new.vehicle_id;
  return new;
end;
$$;

create trigger driver_reports_set_fleet_id
  before insert or update of vehicle_id, fleet_id on public.driver_reports
  for each row execute function public.set_driver_report_fleet_id();

create or replace function public.set_issue_fleet_id()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.source_driver_report_id is not null then
    select r.fleet_id into new.fleet_id
    from public.driver_reports r
    where r.id = new.source_driver_report_id;
  else
    select v.fleet_id into new.fleet_id
    from public.vehicles v
    where v.id = new.vehicle_id;
  end if;
  return new;
end;
$$;

create trigger issues_set_fleet_id
  before insert or update of vehicle_id, fleet_id, source_driver_report_id
  on public.issues
  for each row execute function public.set_issue_fleet_id();

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'issues'
      and indexdef ilike '%unique%'
      and indexdef ilike '%source_driver_report_id%'
  ) then
    create unique index issues_source_driver_report_id_unique
      on public.issues (source_driver_report_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.issues'::regclass
      and conname = 'issues_source_driver_report_id_fkey'
  ) then
    alter table public.issues
      add constraint issues_source_driver_report_id_fkey
      foreign key (source_driver_report_id)
      references public.driver_reports(id) on delete restrict;
  end if;
end $$;

alter table public.fleets enable row level security;
alter table public.fleet_members enable row level security;
alter table public.driver_reports enable row level security;

create policy fleets_read_member on public.fleets
  for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.fleet_members fm
      where fm.fleet_id = fleets.id and fm.user_id = auth.uid()
    )
  );
create policy fleets_owner_manage on public.fleets
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy vehicles_fleet_member_read on public.vehicles
  for select to authenticated
  using (
    exists (
      select 1 from public.fleet_members fm
      where fm.fleet_id = vehicles.fleet_id and fm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.fleets f
      where f.id = vehicles.fleet_id and f.owner_id = auth.uid()
    )
  );

create policy fleet_members_read on public.fleet_members
  for select to authenticated
  using (user_id = auth.uid());
create policy fleet_members_owner_manage on public.fleet_members
  for all to authenticated
  using (
    exists (
      select 1 from public.fleets f
      where f.id = fleet_id and f.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.fleets f
      where f.id = fleet_id and f.owner_id = auth.uid()
    )
  );

create policy driver_reports_read_accessible on public.driver_reports
  for select to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and (
          v.user_id = auth.uid()
          or exists (
            select 1 from public.fleet_members fm
            where fm.fleet_id = v.fleet_id and fm.user_id = auth.uid()
          )
          or exists (
            select 1 from public.fleets f
            where f.id = v.fleet_id and f.owner_id = auth.uid()
          )
        )
    )
  );
create policy driver_reports_submit_accessible on public.driver_reports
  for insert to authenticated
  with check (
    reported_by = auth.uid()
    and status = 'new'
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and driver_reports.fleet_id is not distinct from v.fleet_id
        and (
          v.user_id = auth.uid()
          or exists (
            select 1 from public.fleet_members fm
            where fm.fleet_id = v.fleet_id and fm.user_id = auth.uid()
          )
          or exists (
            select 1 from public.fleets f
            where f.id = v.fleet_id and f.owner_id = auth.uid()
          )
        )
    )
  );
drop policy issues_owner_all on public.issues;
create policy issues_owner_all on public.issues
  for all to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and (
          v.user_id = auth.uid()
          or exists (
            select 1 from public.fleet_members fm
            where fm.fleet_id = v.fleet_id and fm.user_id = auth.uid()
          )
          or exists (
            select 1 from public.fleets f
            where f.id = v.fleet_id and f.owner_id = auth.uid()
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and (
          v.user_id = auth.uid()
          or exists (
            select 1 from public.fleet_members fm
            where fm.fleet_id = v.fleet_id and fm.user_id = auth.uid()
          )
          or exists (
            select 1 from public.fleets f
            where f.id = v.fleet_id and f.owner_id = auth.uid()
          )
        )
    )
  );

drop policy issue_history_owner_read on public.issue_status_history;
create policy issue_history_owner_read on public.issue_status_history
  for select to authenticated
  using (
    exists (
      select 1
      from public.issues i
      join public.vehicles v on v.id = i.vehicle_id
      where i.id = issue_id
        and (
          v.user_id = auth.uid()
          or exists (
            select 1 from public.fleet_members fm
            where fm.fleet_id = v.fleet_id and fm.user_id = auth.uid()
          )
          or exists (
            select 1 from public.fleets f
            where f.id = v.fleet_id and f.owner_id = auth.uid()
          )
        )
    )
  );

create or replace function public.convert_driver_report_to_issue(
  p_report_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.driver_reports%rowtype;
  v_issue public.issues%rowtype;
begin
  select * into v_report
  from public.driver_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'driver_report_not_found' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.vehicles v
    where v.id = v_report.vehicle_id
      and (
        (v.fleet_id is null and v.user_id = p_actor_id)
        or exists (
          select 1 from public.fleets f
          where f.id = v.fleet_id and f.owner_id = p_actor_id
        )
      )
  ) then
    raise exception 'driver_report_not_convertible' using errcode = 'P0001';
  end if;

  if v_report.status = 'logged' then
    select * into v_issue
    from public.issues
    where source_driver_report_id = p_report_id;

    if found then
      return to_jsonb(v_issue);
    end if;
    raise exception 'driver_report_not_convertible' using errcode = 'P0001';
  end if;

  if v_report.status <> 'new' then
    raise exception 'driver_report_not_convertible' using errcode = 'P0001';
  end if;

  insert into public.issues (
    vehicle_id,
    fleet_id,
    reported_by,
    category,
    severity,
    timing,
    description,
    odometer_reading,
    occurred_at,
    status,
    source_driver_report_id
  ) values (
    v_report.vehicle_id,
    v_report.fleet_id,
    v_report.reported_by,
    v_report.category,
    v_report.severity,
    v_report.timing,
    v_report.description,
    v_report.odometer_reading,
    v_report.occurred_at,
    'reported',
    v_report.id
  )
  returning * into v_issue;

  insert into public.issue_status_history (
    issue_id, changed_by, old_status, new_status
  ) values (
    v_issue.id, p_actor_id, null, 'reported'
  );

  update public.driver_reports
  set status = 'logged',
      logged_by = p_actor_id,
      logged_at = now(),
      updated_at = now()
  where id = v_report.id;

  return to_jsonb(v_issue);
end;
$$;

create or replace function public.dismiss_driver_report(
  p_report_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.driver_reports%rowtype;
begin
  select * into v_report
  from public.driver_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'driver_report_not_found' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.vehicles v
    where v.id = v_report.vehicle_id
      and (
        (v.fleet_id is null and v.user_id = p_actor_id)
        or exists (
          select 1 from public.fleets f
          where f.id = v.fleet_id and f.owner_id = p_actor_id
        )
      )
  ) then
    raise exception 'driver_report_not_dismissible' using errcode = 'P0001';
  end if;

  if v_report.status <> 'new' then
    raise exception 'driver_report_not_dismissible' using errcode = 'P0001';
  end if;

  update public.driver_reports
  set status = 'dismissed',
      dismissed_by = p_actor_id,
      dismissed_at = now(),
      updated_at = now()
  where id = p_report_id
  returning * into v_report;

  return to_jsonb(v_report);
end;
$$;

revoke all on function public.convert_driver_report_to_issue(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.convert_driver_report_to_issue(uuid, uuid)
  to service_role;
revoke all on function public.dismiss_driver_report(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.dismiss_driver_report(uuid, uuid)
  to service_role;

commit;
