-- WP Agent schema (WhatsApp only, no voice features)
-- Safe/idempotent migration: creates only missing objects.

create extension if not exists pgcrypto;

-- 1) Leads table
create table if not exists public.wp_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  event_type text,
  package_type text,
  urgency_level text,
  lead_score integer default 0,
  source_channel text default 'whatsapp',
  assigned_to uuid references public.admin_users(id) on delete set null,
  next_follow_up timestamptz,
  last_message text,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wp_leads_status on public.wp_leads(status);
create index if not exists idx_wp_leads_created on public.wp_leads(created_at desc);
create index if not exists idx_wp_leads_phone on public.wp_leads(phone);
create index if not exists idx_wp_leads_event_type on public.wp_leads(event_type);
create index if not exists idx_wp_leads_follow_up on public.wp_leads(next_follow_up);
create index if not exists idx_wp_leads_score on public.wp_leads(lead_score);

-- 2) Notifications table
create table if not exists public.wp_notifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.wp_leads(id) on delete cascade,
  type text not null default 'lead_update',
  priority text not null default 'medium',
  message text not null,
  lead_name text,
  lead_phone text,
  is_read boolean not null default false,
  scheduled_for timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wp_notifications_created on public.wp_notifications(created_at desc);
create index if not exists idx_wp_notifications_read on public.wp_notifications(is_read);
create index if not exists idx_wp_notifications_type on public.wp_notifications(type);
create index if not exists idx_wp_notifications_scheduled on public.wp_notifications(scheduled_for);

-- 3) Conversation log (for future UI expansion)
create table if not exists public.wp_conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.wp_leads(id) on delete cascade,
  lead_phone text,
  direction text not null check (direction in ('inbound', 'outbound')),
  message text not null,
  message_type text default 'text',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wp_conversations_lead on public.wp_conversations(lead_id, created_at desc);
create index if not exists idx_wp_conversations_phone on public.wp_conversations(lead_phone);

-- 4) Trigger helper: updated_at
create or replace function public.wp_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wp_leads_set_updated_at on public.wp_leads;
create trigger wp_leads_set_updated_at
before update on public.wp_leads
for each row execute function public.wp_set_updated_at();

-- 5) Trigger helper: automatic notification on lead insert
create or replace function public.wp_create_lead_notification()
returns trigger
language plpgsql
as $$
begin
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

drop trigger if exists wp_trigger_create_lead_notification on public.wp_leads;
create trigger wp_trigger_create_lead_notification
after insert on public.wp_leads
for each row execute function public.wp_create_lead_notification();

-- 6) Daily analytics materialization table + refresh function
create table if not exists public.wp_daily_stats (
  date date primary key,
  total_leads integer not null default 0,
  contacted_leads integer not null default 0,
  converted_leads integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.refresh_wp_daily_stats(days_back integer default 30)
returns void
language plpgsql
as $$
begin
  delete from public.wp_daily_stats
  where date >= (current_date - greatest(days_back, 1));

  insert into public.wp_daily_stats (date, total_leads, contacted_leads, converted_leads, updated_at)
  select
    d::date as date,
    count(l.id)::int as total_leads,
    count(*) filter (where l.status in ('contacted', 'qualified', 'converted', 'lost'))::int as contacted_leads,
    count(*) filter (where l.status = 'converted')::int as converted_leads,
    now()
  from generate_series(current_date - greatest(days_back, 1), current_date, interval '1 day') as d
  left join public.wp_leads l
    on (l.created_at at time zone 'utc')::date = d::date
  group by d
  order by d;
end;
$$;

-- Prime analytics immediately
select public.refresh_wp_daily_stats(30);

-- 7) RLS + policies (admin/authenticated only)
alter table public.wp_leads enable row level security;
alter table public.wp_notifications enable row level security;
alter table public.wp_conversations enable row level security;
alter table public.wp_daily_stats enable row level security;

drop policy if exists wp_leads_admin_all on public.wp_leads;
create policy wp_leads_admin_all on public.wp_leads
for all
to authenticated
using (auth.uid() in (select id from public.admin_users))
with check (auth.uid() in (select id from public.admin_users));

drop policy if exists wp_notifications_admin_all on public.wp_notifications;
create policy wp_notifications_admin_all on public.wp_notifications
for all
to authenticated
using (auth.uid() in (select id from public.admin_users))
with check (auth.uid() in (select id from public.admin_users));

drop policy if exists wp_conversations_admin_all on public.wp_conversations;
create policy wp_conversations_admin_all on public.wp_conversations
for all
to authenticated
using (auth.uid() in (select id from public.admin_users))
with check (auth.uid() in (select id from public.admin_users));

drop policy if exists wp_daily_stats_admin_read on public.wp_daily_stats;
create policy wp_daily_stats_admin_read on public.wp_daily_stats
for select
to authenticated
using (auth.uid() in (select id from public.admin_users));

-- Optional: realtime
do $$
begin
  begin
    alter publication supabase_realtime add table public.wp_leads;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.wp_notifications;
  exception when duplicate_object then null;
  end;
end $$;
