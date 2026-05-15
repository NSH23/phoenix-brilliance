-- Optional attachment on scheduled follow-ups (image / video / document URL from Cloudinary)

alter table public.wp_followups
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.wp_followups.metadata is
  'Optional media: { media_type, media_url, filename, caption }';
