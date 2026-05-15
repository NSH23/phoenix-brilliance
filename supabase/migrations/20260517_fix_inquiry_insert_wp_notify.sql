-- Broken wp_agent_notify_on_lead called net.http_post with wrong signature (body text)
-- and a dead Railway URL, rolling back every inquiry INSERT (REST 400).
-- WhatsApp forwarding is handled by inquiry-to-whatsapp → forward-inquiry-whatsapp edge function.

drop trigger if exists wp_agent_notify_on_lead on public.wp_leads;
drop function if exists public.wp_notify_agent_on_lead();
