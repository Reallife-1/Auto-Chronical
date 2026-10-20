-- 001: base profiles table (applied to the dev/staging project on 2026-10-13)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text not null unique,
  username text not null unique,
  privacy_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(email)),
  check (username = lower(username))
);

alter table public.profiles enable row level security;
