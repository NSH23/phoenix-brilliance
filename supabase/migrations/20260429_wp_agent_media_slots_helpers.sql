-- Helper for WP WhatsApp sender logic:
-- Return a fixed pack of 6 image slots + 2 video slots for a given entity,
-- using entity-specific assets first, then falling back to (global, NULL).

create or replace function public.wp_get_media_slot_pack(
  p_entity_kind text,
  p_entity_id uuid
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_images jsonb;
  v_videos jsonb;
begin
  -- Images: slots 1..6
  select
    jsonb_agg(
      jsonb_build_object(
        'slot_index', s,
        'title', a.title,
        'description', a.description,
        'cloudinary_url', a.cloudinary_url
      )
      order by s
    )
  into v_images
  from generate_series(1, 6) as s
  left join lateral (
    select
      w.title,
      w.description,
      w.cloudinary_url
    from public.wp_media_assets w
    where w.media_type = 'image'
      and w.slot_index = s
      and w.is_active = true
      and (
        (w.entity_kind = p_entity_kind and w.entity_id IS NOT DISTINCT FROM p_entity_id)
        or (w.entity_kind = 'global' and w.entity_id is null)
      )
    order by (w.entity_kind = p_entity_kind and w.entity_id IS NOT DISTINCT FROM p_entity_id) desc
    limit 1
  ) a on true;

  -- Videos: slots 1..2
  select
    jsonb_agg(
      jsonb_build_object(
        'slot_index', s,
        'title', a.title,
        'description', a.description,
        'youtube_id', a.youtube_id
      )
      order by s
    )
  into v_videos
  from generate_series(1, 2) as s
  left join lateral (
    select
      w.title,
      w.description,
      w.youtube_id
    from public.wp_media_assets w
    where w.media_type = 'video'
      and w.slot_index = s
      and w.is_active = true
      and (
        (w.entity_kind = p_entity_kind and w.entity_id IS NOT DISTINCT FROM p_entity_id)
        or (w.entity_kind = 'global' and w.entity_id is null)
      )
    order by (w.entity_kind = p_entity_kind and w.entity_id IS NOT DISTINCT FROM p_entity_id) desc
    limit 1
  ) a on true;

  return jsonb_build_object(
    'entity_kind', p_entity_kind,
    'entity_id', p_entity_id,
    'images', coalesce(v_images, '[]'::jsonb),
    'videos', coalesce(v_videos, '[]'::jsonb)
  );
end;
$$;

