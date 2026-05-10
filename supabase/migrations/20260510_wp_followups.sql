-- Scheduled follow-ups for WP Agent (stored + queried by lead_phone)

create table if not exists public.wp_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.wp_leads(id) on delete cascade,
  lead_phone text not null,
  message text,
  scheduled_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wp_followups_phone on public.wp_followups(lead_phone);
create index if not exists idx_wp_followups_scheduled on public.wp_followups(scheduled_at);
create index if not exists idx_wp_followups_status_scheduled on public.wp_followups(status, scheduled_at);

drop trigger if exists wp_followups_set_updated_at on public.wp_followups;
create trigger wp_followups_set_updated_at
before update on public.wp_followups
for each row execute function public.wp_set_updated_at();

alter table public.wp_followups enable row level security;

drop policy if exists wp_followups_admin_all on public.wp_followups;
create policy wp_followups_admin_all on public.wp_followups
for all
to authenticated
using (auth.uid() in (select id from public.admin_users))
with check (auth.uid() in (select id from public.admin_users));

do $$
begin
  begin
    alter publication supabase_realtime add table public.wp_followups;
  exception when duplicate_object then null;
  end;
end $$;
