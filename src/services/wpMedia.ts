import { supabase } from "@/lib/supabase";

export interface WpMediaAsset {
  id: string;
  entity_kind: 'event' | 'venue' | 'service' | 'global' | string | null;
  entity_id: string | null;
  media_type: "image" | "video";
  title: string | null;
  description: string | null;
  cloudinary_url: string | null;
  youtube_id: string | null;
  slot_index: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  "id, entity_kind, entity_id, slot_index, media_type, title, description, cloudinary_url, youtube_id, is_active, created_at, updated_at";

export type WpMediaEntityKind = "event" | "venue" | "service" | "global";

export async function getWpMediaAssetsForEntity(entityKind: WpMediaEntityKind, entityId: string | null) {
  let query = supabase
    .from("wp_media_assets")
    .select(COLUMNS)
    .eq("entity_kind", entityKind)
    .order("slot_index", { ascending: true })
    .order("media_type", { ascending: true });

  if (entityId == null) {
    query = query.is("entity_id", null);
  } else {
    query = query.eq("entity_id", entityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as WpMediaAsset[];
}

export function getWpMediaSlotAsset(
  assets: WpMediaAsset[],
  mediaType: "image" | "video",
  slotIndex: number
) {
  return assets.find((a) => a.media_type === mediaType && a.slot_index === slotIndex) ?? null;
}

export async function upsertWpMediaSlotAsset(payload: {
  entity_kind: WpMediaEntityKind;
  entity_id: string | null;
  media_type: "image" | "video";
  slot_index: number;
  title?: string | null;
  description?: string | null;
  cloudinary_url?: string | null;
  youtube_id?: string | null;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from("wp_media_assets")
    .upsert(
      {
        entity_kind: payload.entity_kind,
        entity_id: payload.entity_id,
        media_type: payload.media_type,
        slot_index: payload.slot_index,
        title: payload.title ?? null,
        description: payload.description ?? null,
        cloudinary_url: payload.cloudinary_url ?? null,
        youtube_id: payload.youtube_id ?? null,
        is_active: payload.is_active ?? true,
      },
      { onConflict: "entity_kind,entity_id,media_type,slot_index" }
    )
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return data as WpMediaAsset;
}

const IMAGE_SLOT_COUNT = 6;
const VIDEO_SLOT_COUNT = 2;

/** Clears every image + video slot for the selected entity (same counts as WP Agent media UI). */
export async function clearAllWpMediaSlotsForEntity(entityKind: WpMediaEntityKind, entityId: string | null) {
  const tasks: Promise<void>[] = [];
  for (let slot_index = 1; slot_index <= IMAGE_SLOT_COUNT; slot_index++) {
    tasks.push(deleteWpMediaSlotAsset({ entity_kind: entityKind, entity_id: entityId, media_type: "image", slot_index }));
  }
  for (let slot_index = 1; slot_index <= VIDEO_SLOT_COUNT; slot_index++) {
    tasks.push(deleteWpMediaSlotAsset({ entity_kind: entityKind, entity_id: entityId, media_type: "video", slot_index }));
  }
  await Promise.all(tasks);
}

export async function deleteWpMediaSlotAsset(payload: {
  entity_kind: WpMediaEntityKind;
  entity_id: string | null;
  media_type: "image" | "video";
  slot_index: number;
}) {
  let query = supabase
    .from("wp_media_assets")
    .delete()
    .eq("entity_kind", payload.entity_kind)
    .eq("media_type", payload.media_type)
    .eq("slot_index", payload.slot_index);

  if (payload.entity_id == null) {
    query = query.is("entity_id", null);
  } else {
    query = query.eq("entity_id", payload.entity_id);
  }

  const { error } = await query;
  if (error) throw error;
}

export interface WpResolvedImageSlot {
  slot_index: number;
  title: string | null;
  description: string | null;
  cloudinary_url: string | null;
}

export interface WpResolvedVideoSlot {
  slot_index: number;
  title: string | null;
  description: string | null;
  youtube_id: string | null;
}

export interface WpMediaSlotPack {
  entity_kind: WpMediaEntityKind | string;
  entity_id: string | null;
  images: WpResolvedImageSlot[];
  videos: WpResolvedVideoSlot[];
}

/** Fetch resolved slot pack (entity-specific first, then global fallback) for WhatsApp sending. */
export async function getWpMediaSlotPack(entityKind: WpMediaEntityKind, entityId: string | null) {
  const { data, error } = await supabase.rpc("wp_get_media_slot_pack", {
    p_entity_kind: entityKind,
    p_entity_id: entityId,
  });
  if (error) throw error;
  return data as WpMediaSlotPack;
}
