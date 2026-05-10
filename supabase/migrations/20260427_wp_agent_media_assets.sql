-- WP agent media assets table
-- Images are stored as Cloudinary URLs.
-- Videos are stored as YouTube IDs.

create table if not exists public.wp_media_assets (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('image', 'video')),
  title text,
  description text,
  cloudinary_url text,
  youtube_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wp_media_assets_url_check check (
    (media_type = 'image' and cloudinary_url is not null and youtube_id is null)
    or
    (media_type = 'video' and youtube_id is not null)
  )
);

create index if not exists idx_wp_media_assets_type on public.wp_media_assets(media_type);
create index if not exists idx_wp_media_assets_created on public.wp_media_assets(created_at desc);

create or replace function public.wp_media_assets_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wp_media_assets_updated_at on public.wp_media_assets;
create trigger wp_media_assets_updated_at
before update on public.wp_media_assets
for each row execute function public.wp_media_assets_set_updated_at();

alter table public.wp_media_assets enable row level security;

drop policy if exists wp_media_assets_admin_all on public.wp_media_assets;
create policy wp_media_assets_admin_all on public.wp_media_assets
for all
to authenticated
using (auth.uid() in (select id from public.admin_users))
with check (auth.uid() in (select id from public.admin_users));
