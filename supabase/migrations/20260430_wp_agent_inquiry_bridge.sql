-- Bridge website inquiries -> wp_leads for WP agent pipeline visibility.
-- This keeps existing inquiry flow intact while auto-creating a WP lead with source_channel='website'.

alter table public.wp_leads
  add column if not exists venue text;

create index if not exists idx_wp_leads_source_channel on public.wp_leads(source_channel);
create index if not exists idx_wp_leads_venue on public.wp_leads(venue);

create or replace function public.wp_capture_inquiry_as_lead()
returns trigger
language plpgsql
as $$
declare
  v_existing uuid;
begin
  -- Avoid duplicate website leads for same inquiry ID if this trigger runs again.
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

drop trigger if exists wp_capture_inquiry_as_lead on public.inquiries;
create trigger wp_capture_inquiry_as_lead
after insert on public.inquiries
for each row execute function public.wp_capture_inquiry_as_lead();

