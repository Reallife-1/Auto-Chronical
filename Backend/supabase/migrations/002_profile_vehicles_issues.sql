begin;

-- profiles: columns the new auth/profile code uses
alter table public.profiles
  add column if not exists account_type text not null default 'personal'
    check (account_type in ('personal','fleet')),
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists preferred_currency text not null default 'NGN',
  add column if not exists locale text not null default 'en-NG',
  add column if not exists timezone text not null default 'Africa/Lagos',
  add column if not exists distance_unit text not null default 'km'
    check (distance_unit in ('km','mi'));

-- vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  plate_number text not null,
  vehicle_number text,
  vin text,
  make text not null,
  model text not null,
  year smallint not null check (year between 1900 and 2100),
  vehicle_type text not null
    check (vehicle_type in ('car','van','truck','bus','motorcycle','other')),
  registration_country text not null default 'Nigeria',
  fuel_type text check (fuel_type in ('petrol','diesel','electric','hybrid','other')),
  transmission text check (transmission in ('automatic','manual','cvt','other')),
  colour text,
  assigned_driver text,
  ownership text check (ownership in ('owned','leased','company','financed')),
  mileage_km integer check (mileage_km >= 0),
  last_serviced text
    check (last_serviced in ('under_6_months','6_12_months','over_a_year','not_sure')),
  insurance_expiry date,
  next_service date,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_user_idx on public.vehicles (user_id, is_archived, created_at desc);

-- issues
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
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
  status text not null default 'reported'
    check (status in ('reported','being_checked','being_fixed','fixed')),
  source_driver_report_id uuid unique,   -- foreign key added when driver_reports exists
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index issues_vehicle_idx on public.issues (vehicle_id, status, reported_at desc);

-- issue_status_history
create table public.issue_status_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  old_status text,
  new_status text not null
    check (new_status in ('reported','being_checked','being_fixed','fixed')),
  note text,
  changed_at timestamptz not null default now()
);
create index issue_history_idx on public.issue_status_history (issue_id, changed_at);

-- RLS (the API uses the service role and bypasses these; they protect direct access)
alter table public.vehicles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_status_history enable row level security;

create policy vehicles_owner_all on public.vehicles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy issues_owner_all on public.issues
  for all to authenticated
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()))
  with check (exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()));

create policy issue_history_owner_read on public.issue_status_history
  for select to authenticated
  using (exists (
    select 1 from public.issues i join public.vehicles v on v.id = i.vehicle_id
    where i.id = issue_id and v.user_id = auth.uid()));

commit;
