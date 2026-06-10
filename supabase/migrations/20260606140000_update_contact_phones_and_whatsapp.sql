UPDATE public.contact_info
SET phone = '+91 88880 82509', updated_at = now();

UPDATE public.social_links
SET url = '+918888082509', updated_at = now()
WHERE platform = 'whatsapp';

INSERT INTO public.site_settings (key, value, type)
VALUES ('contact_phone_2', '+91 70665 22509', 'text')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
