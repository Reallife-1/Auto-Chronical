begin;

alter table public.profiles
  alter column phone drop not null,
  alter column username drop not null;

create table public.fleet_invitations (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references public.fleets(id) on delete cascade,
  email text not null check (email = lower(email)),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index fleet_invitations_pending_email_unique
  on public.fleet_invitations (fleet_id, email)
  where accepted_at is null and revoked_at is null;
create index fleet_invitations_expiry_idx
  on public.fleet_invitations (expires_at)
  where accepted_at is null and revoked_at is null;

alter table public.fleet_invitations enable row level security;

create or replace function public.accept_fleet_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_terms_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.fleet_invitations%rowtype;
  v_email text;
  v_email_confirmed_at timestamptz;
  v_profile_email text;
begin
  select email, email_confirmed_at
    into v_email, v_email_confirmed_at
  from auth.users
  where id = p_user_id;

  if not found or v_email_confirmed_at is null then
    raise exception 'fleet_invitation_email_unverified' using errcode = 'P0001';
  end if;

  select * into v_invitation
  from public.fleet_invitations
  where token_hash = p_token_hash
  for update;

  if not found
    or v_invitation.revoked_at is not null
    or (v_invitation.accepted_at is null and v_invitation.expires_at <= now())
  then
    raise exception 'fleet_invitation_not_found' using errcode = 'P0001';
  end if;

  if lower(v_email) <> v_invitation.email then
    raise exception 'fleet_invitation_email_mismatch' using errcode = 'P0001';
  end if;

  if v_invitation.accepted_by is not null
    and v_invitation.accepted_by <> p_user_id
  then
    raise exception 'fleet_invitation_already_accepted' using errcode = 'P0001';
  end if;

  select email into v_profile_email
  from public.profiles
  where id = p_user_id;

  if found and lower(v_profile_email) <> lower(v_email) then
    raise exception 'fleet_invitation_email_mismatch' using errcode = 'P0001';
  end if;

  if not found then
    insert into public.profiles (
      id,
      first_name,
      last_name,
      email,
      phone,
      username,
      account_type,
      terms_version,
      terms_accepted_at
    ) values (
      p_user_id,
      btrim(p_first_name),
      btrim(p_last_name),
      lower(v_email),
      null,
      null,
      'fleet',
      p_terms_version,
      now()
    );
  end if;

  insert into public.fleet_members (fleet_id, user_id, role)
  values (v_invitation.fleet_id, p_user_id, 'driver')
  on conflict (fleet_id, user_id) do nothing;

  update public.fleet_invitations
  set accepted_by = p_user_id,
      accepted_at = coalesce(accepted_at, now())
  where id = v_invitation.id;

  update public.fleet_invitations
  set revoked_at = now()
  where fleet_id = v_invitation.fleet_id
    and email = v_invitation.email
    and id <> v_invitation.id
    and accepted_at is null
    and revoked_at is null;

  return jsonb_build_object(
    'fleetId', v_invitation.fleet_id,
    'userId', p_user_id
  );
end;
$$;

revoke all on function public.accept_fleet_invitation(
  text, uuid, text, text, text
) from public, anon, authenticated;
grant execute on function public.accept_fleet_invitation(
  text, uuid, text, text, text
) to service_role;

commit;
