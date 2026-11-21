-- Cryptographically random 6-digit OTP for site access requests.
create extension if not exists pgcrypto;

create or replace function public.create_site_access_request_from_inquiry()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_otp text;
  v_bytes bytea;
  v_num bigint;
begin
  if new.access_token is null then
    return new;
  end if;

  v_bytes := gen_random_bytes(4);
  v_num :=
    (get_byte(v_bytes, 0)::bigint << 24)
    + (get_byte(v_bytes, 1)::bigint << 16)
    + (get_byte(v_bytes, 2)::bigint << 8)
    + get_byte(v_bytes, 3)::bigint;
  v_otp := lpad((v_num % 1000000)::text, 6, '0');

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

revoke all on function public.create_site_access_request_from_inquiry() from public;
revoke all on function public.create_site_access_request_from_inquiry() from anon, authenticated;
