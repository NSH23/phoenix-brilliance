-- Inquiry INSERT runs as anon; wp_leads RLS is authenticated-admin-only.
-- Without SECURITY DEFINER the AFTER INSERT trigger cannot insert into wp_leads
-- and the whole inquiry transaction rolls back (postgres error, often visible after API auth works).

create or replace function public.wp_capture_inquiry_as_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
begin
  select id into v_existing
  from public.wp_leads
  where metadata ->> 'inquiry_id' = new.id::text
  limit 1;

  if v_existing is not null then
    return new;
  end if;

  insert into public.wp_leads (
    name,
    phone,
    email,
    status,
    event_type,
    package_type,
    urgency_level,
    lead_score,
    source_channel,
    venue,
    last_message,
    metadata
  )
  values (
    coalesce(new.name, 'Unknown'),
    new.phone,
    nullif(new.email, ''),
    'new',
    new.event_type,
    null,
    null,
    0,
    'website',
    new.venue,
    coalesce(new.message, 'Website inquiry'),
    jsonb_build_object(
      'inquiry_id', new.id,
      'origin', 'website_inquiry_form',
      'instagram_id', new.instagram_id
    )
  );

  return new;
end;
$$;

grant execute on function public.wp_capture_inquiry_as_lead() to anon, authenticated;
