-- Live table was created without updated_at; Railway claim/finalize patches require it.

alter table public.wp_followups
  add column if not exists updated_at timestamptz;

update public.wp_followups
set updated_at = coalesce(created_at, now())
where updated_at is null;

alter table public.wp_followups
  alter column updated_at set default now(),
  alter column updated_at set not null;

drop trigger if exists wp_followups_set_updated_at on public.wp_followups;
create trigger wp_followups_set_updated_at
before update on public.wp_followups
for each row execute function public.wp_set_updated_at();
