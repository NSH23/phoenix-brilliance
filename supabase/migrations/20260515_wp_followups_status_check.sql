-- Railway agent uses processing / partial / failed; live DB only had pending | sent | cancelled.

alter table public.wp_followups drop constraint if exists wp_followups_status_check;

alter table public.wp_followups add constraint wp_followups_status_check
  check (status in ('pending', 'processing', 'sent', 'partial', 'failed', 'cancelled'));
