-- SLA alerts: notify admins when a lead's latest message is inbound and older than 6 hours with no outbound reply since.

create or replace function public.wp_refresh_sla_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
  r record;
begin
  for r in
    with latest_inbound as (
      select distinct on (coalesce(c.lead_id::text, c.lead_phone))
        c.lead_id,
        c.lead_phone,
        c.created_at as last_inbound_at
      from public.wp_conversations c
      where c.direction = 'inbound'
      order by coalesce(c.lead_id::text, c.lead_phone), c.created_at desc
    )
    select
      li.lead_id,
      li.lead_phone,
      l.name as lead_name,
      li.last_inbound_at
    from latest_inbound li
    left join public.wp_leads l on l.id = li.lead_id
    where li.last_inbound_at < now() - interval '6 hours'
      and not exists (
        select 1
        from public.wp_conversations o
        where o.direction = 'outbound'
          and o.created_at > li.last_inbound_at
          and (
            (li.lead_id is not null and o.lead_id = li.lead_id)
            or (li.lead_phone is not null and o.lead_phone = li.lead_phone)
          )
      )
  loop
    if not exists (
      select 1
      from public.wp_notifications n
      where n.type = 'sla_reply_due'
        and n.is_read = false
        and n.created_at > now() - interval '24 hours'
        and (
          (r.lead_id is not null and n.lead_id = r.lead_id)
          or (r.lead_phone is not null and n.lead_phone = r.lead_phone)
        )
    ) then
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
        r.lead_id,
        'sla_reply_due',
        'high',
        format(
          'Reply due: no outbound message in 6+ hours (last inbound %s)',
          to_char(r.last_inbound_at at time zone 'Asia/Kolkata', 'Mon DD, HH24:MI')
        ),
        r.lead_name,
        r.lead_phone,
        false
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return v_inserted;
end;
$$;

revoke all on function public.wp_refresh_sla_notifications() from public;
grant execute on function public.wp_refresh_sla_notifications() to authenticated;
grant execute on function public.wp_refresh_sla_notifications() to service_role;
