-- Add slot/entity metadata to wp_media_assets
-- Enables per-event/per-venue/per-service slot packages (6 images + 2 videos).

create extension if not exists pgcrypto;

alter table public.wp_media_assets
  add column if not exists entity_kind text not null default 'global',
  add column if not exists entity_id uuid null,
  add column if not exists slot_index integer not null default 1;

-- Ensure slot_index matches media_type.
-- Note: constraint name is fixed; IF NOT EXISTS isn't available for constraints in alter table easily,
-- so we guard with a conditional drop first.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'wp_media_assets_slot_index_check'
  ) then
    alter table public.wp_media_assets drop constraint wp_media_assets_slot_index_check;
  end if;
end $$;

alter table public.wp_media_assets
  add constraint wp_media_assets_slot_index_check
  check (
    (media_type = 'image' and slot_index between 1 and 6)
    or
    (media_type = 'video' and slot_index between 1 and 2)
  );

-- Re-map legacy rows that were created without entity_kind/entity_id/slot_index.
-- Previously, those rows all landed on (global, null, slot_index=1), which would conflict
-- once we introduce the unique "slot" index. We map the first 6 images / 2 videos into
-- proper slot positions with entity_id still NULL, and for any extra legacy rows we assign
-- a random entity_id so they don't conflict with the slot uniqueness.
with ranked as (
  select
    id,
    media_type,
    row_number() over (partition by media_type order by created_at desc, id desc) as rn
  from public.wp_media_assets
  where entity_kind = 'global' and entity_id is null
)
update public.wp_media_assets w
set
  slot_index = case
    when w.media_type = 'image' then ((r.rn - 1) % 6) + 1
    when w.media_type = 'video' then ((r.rn - 1) % 2) + 1
    else w.slot_index
  end,
  entity_id = case
    when w.media_type = 'image' and r.rn > 6 then gen_random_uuid()
    when w.media_type = 'video' and r.rn > 2 then gen_random_uuid()
    else null
  end
from ranked r
where w.id = r.id;

-- Unique slot per entity + media_type + position
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where indexname = 'wp_media_assets_unique_slot'
  ) then
    create unique index wp_media_assets_unique_slot
      on public.wp_media_assets (entity_kind, entity_id, media_type, slot_index);
  end if;
end $$;

