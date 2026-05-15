-- Website inquiries already surface in the inquiries bell + push flow.
-- Skip duplicate "New WhatsApp lead" wp_notifications for source_channel = website.

create or replace function public.wp_create_lead_notification()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.source_channel, '') = 'website' then
    return new;
  end if;

  insert into public.wp_notifications (
    lead_id,
    type,
    priority,
    message,
    lead_name,
    lead_phone,
    is_read
  )
  values (
    new.id,
    'new_lead',
    case
      when coalesce(new.urgency_level, '') in ('high', 'urgent') then 'high'
      else 'medium'
    end,
    format('New WhatsApp lead: %s', coalesce(new.name, 'Unknown')),
    new.name,
    new.phone,
    false
  );

  return new;
end;
$$;
