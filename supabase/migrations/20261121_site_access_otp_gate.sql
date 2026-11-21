-- OTP-based site access gate (applied live as migration name: site_access_otp_gate).
-- Device-bound via access_token in localStorage; OTP valid 2h; unlock session 2h after verify.

create extension if not exists pgcrypto;

alter table public.inquiries
  add column if not exists access_token uuid;

create unique index if not exists inquiries_access_token_uidx
  on public.inquiries (access_token)
  where access_token is not null;
