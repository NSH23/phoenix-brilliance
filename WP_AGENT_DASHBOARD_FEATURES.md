# WP Agent Dashboard Features (Current)

This document explains all implemented WP-agent admin/dashboard features, how data flows, and what the external WP automation package should connect to.

## 1) Admin Pages for WP Agent

### Sidebar Order
WP pages are placed directly under Dashboard:
1. `Dashboard`
2. `WP Leads`
3. `WP Analytics`
4. `WP Media`
5. Other existing admin pages

### `WP Leads` (`/admin/wp-leads`)
- Lead list from `wp_leads`
- Search by name/phone/event
- Filter by status (`new`, `contacted`, `qualified`, `converted`, `lost`)
- Filter by source:
  - `website` (website inquiry form)
  - `whatsapp` (direct WhatsApp channel)
- Shows event + venue + source metadata per lead
- Status update support (writes back to `wp_leads.status`)

### `WP Analytics` (`/admin/wp-analytics`)
- Reads from `wp_daily_stats`
- Shows trend/summary data for WP pipeline health

### `WP Media` (`/admin/wp-media`)
- Fixed slots per target:
  - 6 image slots (Cloudinary URLs)
  - 2 video slots (YouTube IDs)
- Target groups:
  - Events
  - Venues
  - Services
  - Fallback media (global slots)
- Supports upload/replace/clear per slot
- New events/venues/services appear automatically in selector (options are fetched live from DB)

## 2) Inquiry Form -> WP Agent Capture

## Required fields enforced in UI
Inquiry capture forms now require:
- Name
- Phone
- Event
- Venue

This applies to:
- `Contact` page form
- `LeadCaptureModal`

## Bridge from website inquiries to WP leads
When user submits inquiry form:
1. A row is inserted into `inquiries` (existing behavior)
2. DB trigger auto-creates a corresponding row in `wp_leads` with:
   - `source_channel = 'website'`
   - `event_type` from inquiry
   - `venue` from inquiry
   - `last_message` from inquiry message
   - `metadata.inquiry_id` for traceability

This keeps both systems synced and preserves old inquiry behavior.

## 3) Source Tracking

Source is visible in WP Leads:
- `website` = came from website inquiry form
- `whatsapp` = came directly from WhatsApp channel integration

So admin can see where lead came from without mixing channels.

## 4) Media Slot Resolution + Fallback

## Slot model
Stored in `wp_media_assets` with:
- `entity_kind`: `event` | `venue` | `service` | `global`
- `entity_id`: UUID (NULL for `global`)
- `media_type`: `image` | `video`
- `slot_index`: `1..6` for images, `1..2` for videos

Unique slot key:
- `(entity_kind, entity_id, media_type, slot_index)`

## Fallback behavior
For each slot, resolution priority is:
1. Specific entity slot (e.g., selected event/venue/service)
2. Global fallback slot (`entity_kind='global'`, `entity_id IS NULL`)

So if user asks for unknown event/venue/service, your WP package can use global fallback slot pack.

## 5) External WP Package Integration Notes

Your external WP automation package should:
1. Read lead data from `wp_leads`
2. Determine selected event/venue/service for lead
3. Fetch slot pack with RPC:
   - `wp_get_media_slot_pack(p_entity_kind, p_entity_id)`
4. Send:
   - lead-name-personalized message
   - images/videos from returned slot pack
5. If no exact match exists, use global fallback slots automatically

## Optional helper strategy for package
If your package only has event/venue text names:
- Resolve entity IDs from `events.title`, `collaborations.name`, `services.title`
- Then call `wp_get_media_slot_pack(...)`

## 6) Migrations used for WP agent module

Run these migrations in order:
1. `supabase/migrations/20260427_wp_agent_admin_module.sql`
2. `supabase/migrations/20260427_wp_agent_media_assets.sql`
3. `supabase/migrations/20260429_wp_agent_media_slots.sql`
4. `supabase/migrations/20260429_wp_agent_media_slots_helpers.sql`
5. `supabase/migrations/20260430_wp_agent_inquiry_bridge.sql`

## 7) What is intentionally not included

- Actual WhatsApp message sending runtime (handled by your external WP package)
- External package-level routing/business logic

UI + DB layer is prepared so package can plug in cleanly.

