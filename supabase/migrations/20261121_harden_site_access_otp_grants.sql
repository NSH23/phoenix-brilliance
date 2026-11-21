-- Trigger function must not be callable as a public RPC.
revoke all on function public.create_site_access_request_from_inquiry() from public;
revoke all on function public.create_site_access_request_from_inquiry() from anon, authenticated;

grant execute on function public.get_access_status(uuid) to anon, authenticated;
grant execute on function public.verify_site_access_otp(uuid, text) to anon, authenticated;
