-- Admin dashboard + gallery scaling: indexes and single-round-trip dashboard counts.

-- Folder-scoped and unassigned media lookups (venue/album galleries at scale)
CREATE INDEX IF NOT EXISTS idx_collaboration_images_collab_folder
  ON public.collaboration_images (collaboration_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_collaboration_images_unassigned
  ON public.collaboration_images (collaboration_id)
  WHERE folder_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_album_media_album_folder
  ON public.album_media (album_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_album_media_unassigned
  ON public.album_media (album_id)
  WHERE folder_id IS NULL;

-- Supabase advisor: unindexed foreign keys on WP tables
CREATE INDEX IF NOT EXISTS idx_wp_followups_lead_id
  ON public.wp_followups (lead_id);

CREATE INDEX IF NOT EXISTS idx_wp_leads_assigned_to
  ON public.wp_leads (assigned_to);

CREATE INDEX IF NOT EXISTS idx_wp_notifications_lead_id
  ON public.wp_notifications (lead_id);

-- One HTTP round-trip for admin home dashboard stats (replaces 10+ head/count queries)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT json_build_object(
    'eventsTotal', (SELECT count(*)::int FROM public.events),
    'eventsThisMonth', (
      SELECT count(*)::int FROM public.events
      WHERE created_at >= date_trunc('month', timezone('utc', now()))
    ),
    'albumsTotal', (SELECT count(*)::int FROM public.event_albums),
    'albumsThisMonth', (
      SELECT count(*)::int FROM public.event_albums
      WHERE created_at >= date_trunc('month', timezone('utc', now()))
    ),
    'galleryImagesTotal', (
      SELECT count(*)::int FROM public.gallery
    ) + (
      SELECT count(*)::int FROM public.collaboration_images
    ) + (
      SELECT count(*)::int FROM public.album_media WHERE type = 'image'
    ),
    'galleryImagesThisMonth', (
      SELECT count(*)::int FROM public.gallery
      WHERE created_at >= date_trunc('month', timezone('utc', now()))
    ) + (
      SELECT count(*)::int FROM public.collaboration_images
      WHERE created_at >= date_trunc('month', timezone('utc', now()))
    ) + (
      SELECT count(*)::int FROM public.album_media
      WHERE type = 'image'
        AND created_at >= date_trunc('month', timezone('utc', now()))
    ),
    'inquiriesTotal', (SELECT count(*)::int FROM public.inquiries),
    'inquiriesNew', (
      SELECT count(*)::int FROM public.inquiries WHERE status = 'new'
    ),
    'partnersTotal', (SELECT count(*)::int FROM public.collaborations),
    'testimonialsTotal', (SELECT count(*)::int FROM public.testimonials),
    'servicesTotal', (SELECT count(*)::int FROM public.services),
    'teamTotal', (SELECT count(*)::int FROM public.team),
    'teamActive', (
      SELECT count(*)::int FROM public.team WHERE is_active = true
    ),
    'teamThisMonth', (
      SELECT count(*)::int FROM public.team
      WHERE created_at >= date_trunc('month', timezone('utc', now()))
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_summary() TO authenticated;
