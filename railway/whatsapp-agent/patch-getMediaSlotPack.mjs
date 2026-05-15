/**
 * One-time patch: fixes media not sending (wp_get_media_slot_pack returns { images, videos }).
 * Usage: node railway/whatsapp-agent/patch-getMediaSlotPack.mjs path/to/index.js
 */
import fs from "fs";

const indexPath = process.argv[2];
if (!indexPath || !fs.existsSync(indexPath)) {
  console.error("Usage: node railway/whatsapp-agent/patch-getMediaSlotPack.mjs <path-to-index.js>");
  process.exit(1);
}

const replacement = `async function getMediaSlotPack(entityKind, entityId) {
  try {
    console.log('getMediaSlotPack:', entityKind, entityId);
    var res = await supabase.post('/rest/v1/rpc/wp_get_media_slot_pack', {
      p_entity_kind: entityKind,
      p_entity_id: entityId || null
    });
    console.log('getMediaSlotPack response:', JSON.stringify(res.data).substring(0, 300));
    if (!res.data) return { images: [], videos: [] };

    var images = [];
    var videos = [];

    // wp_get_media_slot_pack returns { images: [...], videos: [...] }
    if (!Array.isArray(res.data) && (res.data.images || res.data.videos)) {
      var imgSlots = res.data.images || [];
      var vidSlots = res.data.videos || [];
      imgSlots.sort(function(a, b) { return (a.slot_index || 0) - (b.slot_index || 0); });
      vidSlots.sort(function(a, b) { return (a.slot_index || 0) - (b.slot_index || 0); });
      imgSlots.forEach(function(slot) {
        var url = slot && slot.cloudinary_url;
        if (url && String(url).trim() && url !== 'null') images.push(url);
      });
      vidSlots.forEach(function(slot) {
        var yt = slot && slot.youtube_id;
        if (yt && String(yt).trim() && yt !== 'null') videos.push(yt);
      });
    } else {
      // wp_get_media_slots_for_whatsapp returns a flat array
      var slots = Array.isArray(res.data) ? res.data : [];
      slots.sort(function(a, b) { return (a.slot_index || 0) - (b.slot_index || 0); });
      slots.forEach(function(slot) {
        if (slot.media_type === 'image' && slot.cloudinary_url) images.push(slot.cloudinary_url);
        if (slot.media_type === 'video' && slot.youtube_id) videos.push(slot.youtube_id);
      });
    }

    console.log('Media result — images:', images.length, 'videos:', videos.length);
    return { images: images, videos: videos };
  } catch (e) {
    console.error('getMediaSlotPack error:', e.message, e.response ? JSON.stringify(e.response.data) : '');
    return { images: [], videos: [] };
  }
}`;

let code = fs.readFileSync(indexPath, "utf8");
const start = code.indexOf("async function getMediaSlotPack");
const end = code.indexOf("\nasync function resolveEntityId", start);
if (start === -1 || end === -1) {
  console.error("Could not find getMediaSlotPack / resolveEntityId boundaries in", indexPath);
  process.exit(1);
}
code = code.slice(0, start) + replacement + code.slice(end);
fs.writeFileSync(indexPath, code);
console.log("Patched getMediaSlotPack in", indexPath);
