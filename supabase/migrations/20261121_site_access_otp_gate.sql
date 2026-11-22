-- OTP-based site access gate (applied live as migration name: site_access_otp_gate).
-- Device-bound via access_token in localStorage; OTP valid 2h; unlock session 2h after verify.
--
-- Live objects: inquiries.access_token, site_access_requests, create_site_access_request_from_inquiry,
-- get_access_status(uuid), verify_site_access_otp(uuid, text), RLS + realtime on site_access_requests.

create extension if not exists pgcrypto;

alter table public.inquiries
  add column if not exists access_token uuid;

create unique index if not exists inquiries_access_token_uidx
  on public.inquiries (access_token)
  where access_token is not null;

create table if not exists public.site_access_requests (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.inquiries(id) on delete set null,
  access_token uuid not null unique,
  visitor_name text,
  visitor_phone text,
  visitor_email text,
  event_type text,
  venue text,
  message text,
  otp_code text not null,
  otp_expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'expired')),
  verified_at timestamptz,
  unlock_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_access_requests_status_idx
  on public.site_access_requests (status, created_at desc);

create or replace function public.create_site_access_request_from_inquiry()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_otp text;
begin
  if new.access_token is null then
    return new;
  end if;

  v_otp := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.site_access_requests (
    inquiry_id, access_token, visitor_name, visitor_phone, visitor_email,
    event_type, venue, message, otp_code, otp_expires_at, status
  )
  values (
    new.id, new.access_token, new.name, new.phone, new.email,
    new.event_type, new.venue, new.message, v_otp,
    now() + interval '2 hours', 'pending'
  )
  on conflict (access_token) do nothing;

  return new;
end;
$$;

-- See live DB for get_access_status / verify_site_access_otp definitions.
