import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getSiteSettingOptional, upsertSiteSetting } from '@/services/siteContent';
import { toast } from 'sonner';

export default function WpAgentSettingsForm() {
  const [wpSettings, setWpSettings] = useState({
    wpAgentEnabled: true,
    defaultOwner: '',
    callbackSlaMinutes: '30',
    highPriorityScore: '75',
  });
  const [wpSaving, setWpSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getSiteSettingOptional('wp_agent_enabled'),
      getSiteSettingOptional('wp_agent_default_owner'),
      getSiteSettingOptional('wp_agent_callback_sla_minutes'),
      getSiteSettingOptional('wp_agent_high_priority_score'),
    ])
      .then(([enabled, owner, sla, score]) => {
        setWpSettings({
          wpAgentEnabled: enabled ? enabled === 'true' : true,
          defaultOwner: owner || '',
          callbackSlaMinutes: sla || '30',
          highPriorityScore: score || '75',
        });
      })
      .catch(() => {});
  }, []);

  const handleSaveWpSettings = async () => {
    setWpSaving(true);
    try {
      await Promise.all([
        upsertSiteSetting('wp_agent_enabled', String(wpSettings.wpAgentEnabled), 'text'),
        upsertSiteSetting('wp_agent_default_owner', wpSettings.defaultOwner, 'text'),
        upsertSiteSetting('wp_agent_callback_sla_minutes', wpSettings.callbackSlaMinutes, 'text'),
        upsertSiteSetting('wp_agent_high_priority_score', wpSettings.highPriorityScore, 'text'),
      ]);
      toast.success('WP agent settings saved');
    } catch (err) {
      toast.error('Failed to save WP settings', { description: (err as Error)?.message });
    } finally {
      setWpSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp agent settings</CardTitle>
          <CardDescription>
            Defaults for WP Leads, analytics, and callback notifications. Same options that were previously under
            Settings → WP Agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Enable WP agent module</p>
              <p className="text-sm text-muted-foreground">
                Turn WhatsApp-agent admin pages on or off at the config level.
              </p>
            </div>
            <Switch
              checked={wpSettings.wpAgentEnabled}
              onCheckedChange={(checked) => setWpSettings((s) => ({ ...s, wpAgentEnabled: checked }))}
              className="shrink-0"
            />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Default lead owner</Label>
              <Input
                value={wpSettings.defaultOwner}
                onChange={(e) => setWpSettings((s) => ({ ...s, defaultOwner: e.target.value }))}
                placeholder="e.g. ops-team"
                className="max-md:h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label>Callback SLA (minutes)</Label>
              <Input
                value={wpSettings.callbackSlaMinutes}
                onChange={(e) => setWpSettings((s) => ({ ...s, callbackSlaMinutes: e.target.value }))}
                placeholder="30"
                className="max-md:h-11"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>High-priority lead score threshold</Label>
            <Input
              value={wpSettings.highPriorityScore}
              onChange={(e) => setWpSettings((s) => ({ ...s, highPriorityScore: e.target.value }))}
              placeholder="75"
              className="max-md:h-11"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveWpSettings} disabled={wpSaving} className="max-md:h-11 max-md:w-full sm:w-auto">
              {wpSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save WP settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inquiry form → WhatsApp (Railway agent)</CardTitle>
          <CardDescription>
            Optional automation: when someone submits the site inquiry form, call your agent’s{' '}
            <span className="font-mono text-xs">POST /website-lead</span> so it greets them and sends portfolio media.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Deploy the Supabase Edge Function <span className="font-mono text-[11px]">forward-inquiry-whatsapp</span>{' '}
              from this repo’s <span className="font-mono text-[11px]">supabase/functions</span> folder.
            </li>
            <li>
              In Supabase → Edge Functions → Secrets, set{' '}
              <span className="font-mono text-[11px]">WA_WEBSITE_LEAD_URL</span> to your Railway base URL plus{' '}
              <span className="font-mono text-[11px]">/website-lead</span>, and reuse{' '}
              <span className="font-mono text-[11px]">WEBHOOK_SECRET</span> from the push notification function.
            </li>
            <li>
              Database → Webhooks → create hook on <span className="font-mono text-[11px]">public.inquiries</span> INSERT
              → function URL → HTTP header{' '}
              <span className="font-mono text-[11px]">x-phoenix-webhook-secret: &lt;WEBHOOK_SECRET&gt;</span>.
            </li>
          </ol>
          <p>
            Scheduled follow-ups still use the schedule URL from the app (override with{' '}
            <span className="font-mono text-[11px]">VITE_WP_SCHEDULE_FOLLOWUP_URL</span> at build time if your Railway
            URL changes). Use WP Leads → “Run due” to fire your agent’s{' '}
            <span className="font-mono text-[11px]">/process-followups</span> when you are not running cron on Railway.
          </p>
          <p>
            If portfolio images or videos do not send from the agent, point <span className="font-mono text-[11px]">getMediaSlotPack</span> in your
            Railway <span className="font-mono text-[11px]">index.js</span> at RPC{' '}
            <span className="font-mono text-[11px]">wp_get_media_slots_for_whatsapp</span> (returns a JSON array with{' '}
            <span className="font-mono text-[11px]">media_type</span>), or parse the object returned by{' '}
            <span className="font-mono text-[11px]">wp_get_media_slot_pack</span> (<span className="font-mono text-[11px]">images</span> /{' '}
            <span className="font-mono text-[11px]">videos</span> arrays).
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
