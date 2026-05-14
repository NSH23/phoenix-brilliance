-- JSON array of media slots shaped for the Railway WhatsApp agent (index.js):
-- each element has slot_index, media_type ('image' | 'video'), cloudinary_url, youtube_id.
-- The agent's legacy loop expects an array; wp_get_media_slot_pack returns a single object with images[] / videos[].

create or replace function public.wp_get_media_slots_for_whatsapp(
  p_entity_kind text,
  p_entity_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with pack as (
    select public.wp_get_media_slot_pack(p_entity_kind, p_entity_id) as j
  ),
  parts as (
    select
      jsonb_build_object(
        'slot_index', coalesce(nullif(elem->>'slot_index', '')::int, 0),
        'media_type', 'image',
        'cloudinary_url', elem->>'cloudinary_url',
        'youtube_id', elem->>'youtube_id'
      ) as slot,
      coalesce(nullif(elem->>'slot_index', '')::int, 0) as sort_key
    from pack,
      lateral jsonb_array_elements(coalesce(pack.j->'images', '[]'::jsonb)) as elem
    union all
    select
      jsonb_build_object(
        'slot_index', coalesce(nullif(elem->>'slot_index', '')::int, 0),
        'media_type', 'video',
        'cloudinary_url', elem->>'cloudinary_url',
        'youtube_id', elem->>'youtube_id'
      ),
      1000 + coalesce(nullif(elem->>'slot_index', '')::int, 0)
    from pack,
      lateral jsonb_array_elements(coalesce(pack.j->'videos', '[]'::jsonb)) as elem
  )
  select coalesce(
    (select jsonb_agg(slot order by sort_key) from parts),
    '[]'::jsonb
  );
$$;

revoke all on function public.wp_get_media_slots_for_whatsapp(text, uuid) from public;
grant execute on function public.wp_get_media_slots_for_whatsapp(text, uuid) to authenticated;
grant execute on function public.wp_get_media_slots_for_whatsapp(text, uuid) to service_role;
