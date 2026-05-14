-- Single-round-trip WP dashboard metrics (avoids fetching every lead_score row in the client).
create or replace function public.get_wp_dashboard_summary()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'totalLeads', (select count(*)::int from public.wp_leads),
    'newLeads', (select count(*)::int from public.wp_leads where status = 'new'),
    'highPriorityLeads', (
      select count(*)::int
      from public.wp_leads
      where coalesce(urgency_level, '') in ('high', 'urgent')
    ),
    'callbacksDue', (
      select count(*)::int
      from public.wp_leads
      where next_follow_up is not null
        and next_follow_up <= now()
    ),
    'avgLeadScore', coalesce(
      (select round(avg(lead_score))::int from public.wp_leads where lead_score is not null),
      0
    )
  );
$$;

revoke all on function public.get_wp_dashboard_summary() from public;
grant execute on function public.get_wp_dashboard_summary() to authenticated;
