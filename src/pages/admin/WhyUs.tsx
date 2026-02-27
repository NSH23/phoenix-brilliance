import { useState, useEffect } from 'react';
import { Loader2, Star, Plus, Trash2, Trophy, Heart, Users, Shield } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getWhyChooseUsReasons,
  updateWhyChooseUsReason,
  createWhyChooseUsReason,
  deleteWhyChooseUsReason,
  getWhyChooseUsStats,
  updateWhyChooseUsStat,
  createWhyChooseUsStat,
  deleteWhyChooseUsStat,
  WHY_CHOOSE_US_ICON_KEYS,
  type WhyChooseUsReason,
  type WhyChooseUsStat,
  type WhyChooseUsIconKey,
} from '@/services/whyChooseUs';
import { getSiteContentByKey, upsertSiteContent } from '@/services/siteContent';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ICON_OPTIONS: { key: WhyChooseUsIconKey; label: string; Icon: typeof Trophy }[] = [
  { key: 'trophy', label: 'Trophy', Icon: Trophy },
  { key: 'heart', label: 'Heart', Icon: Heart },
  { key: 'users', label: 'Users', Icon: Users },
  { key: 'shield', label: 'Shield', Icon: Shield },
];

export default function AdminWhyUs() {
  const [reasons, setReasons] = useState<WhyChooseUsReason[]>([]);
  const [stats, setStats] = useState<WhyChooseUsStat[]>([]);
  const [header, setHeader] = useState({ title: '', subtitle: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const [r, s, h] = await Promise.all([
        getWhyChooseUsReasons(),
        getWhyChooseUsStats(),
        getSiteContentByKey('why-us').catch(() => null),
      ]);
      setReasons(r);
      setStats(s);
      if (h) setHeader({ title: h.title || '', subtitle: h.subtitle || '', description: h.description || '' });
    } catch (err: unknown) {
      toast.error('Failed to load', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReason = async (id: string, text: string) => {
    setSaving(id);
    try {
      const updated = await updateWhyChooseUsReason(id, { text });
      setReasons(prev => prev.map(r => (r.id === id ? updated : r)));
      toast.success('Reason updated');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleAddReason = async () => {
    if (!newReason.trim()) return;
    try {
      const created = await createWhyChooseUsReason({
        text: newReason.trim(),
        display_order: reasons.length,
      });
      setReasons(prev => [...prev, created]);
      setNewReason('');
      toast.success('Reason added');
    } catch (err: unknown) {
      toast.error('Failed to add', { description: (err as Error)?.message });
    }
  };

  const handleDeleteReason = async (id: string) => {
    if (!confirm('Remove this reason?')) return;
    try {
      await deleteWhyChooseUsReason(id);
      setReasons(prev => prev.filter(r => r.id !== id));
      toast.success('Reason removed');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const handleSaveHeader = async () => {
    setSaving('header');
    try {
      await upsertSiteContent({
        section_key: 'why-us',
        title: header.title,
        subtitle: header.subtitle,
        description: header.description,
      });
      toast.success('Section header updated');
    } catch (err: unknown) {
      toast.error('Failed to update header', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveStat = async (id: string, updates: Partial<Pick<WhyChooseUsStat, 'stat_value' | 'stat_label' | 'stat_description' | 'icon_key'>>) => {
    setSaving(id);
    try {
      const updated = await updateWhyChooseUsStat(id, updates);
      setStats(prev => prev.map(s => (s.id === id ? updated : s)));
      toast.success('Stat updated');
    } catch (err: unknown) {
      toast.error('Failed to update stat', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleAddStat = async () => {
    const usedKeys = new Set(stats.map(s => s.icon_key));
    const nextKey = WHY_CHOOSE_US_ICON_KEYS.find(k => !usedKeys.has(k));
    if (!nextKey) {
      toast.error('All four stat icons are already in use (trophy, heart, users, shield).');
      return;
    }
    try {
      setSaving('add-stat');
      const created = await createWhyChooseUsStat({
        stat_value: '0',
        stat_label: 'New Stat',
        stat_description: null,
        icon_key: nextKey,
        display_order: stats.length,
      });
      setStats(prev => [...prev, created].sort((a, b) => a.display_order - b.display_order));
      toast.success('Stat added');
    } catch (err: unknown) {
      toast.error('Failed to add stat', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteStat = async (id: string) => {
    if (!confirm('Remove this stat card?')) return;
    try {
      await deleteWhyChooseUsStat(id);
      setStats(prev => prev.filter(s => s.id !== id));
      toast.success('Stat removed');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Why Choose Us" subtitle="Manage stats and reasons">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Why Choose Us" subtitle="Manage Why Choose Us section on the homepage (stats + reasons)">
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Section Header</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={header.title}
                  onChange={e => setHeader(h => ({ ...h, title: e.target.value }))}
                  placeholder="Why Phoenix Events?"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subtitle</Label>
                <Input
                  value={header.subtitle}
                  onChange={e => setHeader(h => ({ ...h, subtitle: e.target.value }))}
                  placeholder="Why Choose Us"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={header.description}
                  onChange={e => setHeader(h => ({ ...h, description: e.target.value }))}
                  placeholder="We craft experiences that transcend moments and become cherished memories."
                />
              </div>
              <Button onClick={handleSaveHeader} disabled={saving === 'header'}>
                {saving === 'header' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Header
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Stat Cards (homepage numbers)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              These appear as the four highlight cards (e.g. 100+ Successful Events). Icon: trophy, heart, users, or shield.
            </p>
            <div className="space-y-4">
              {stats.map(stat => {
                const iconOpt = ICON_OPTIONS.find(o => o.key === stat.icon_key);
                const StatIcon = iconOpt?.Icon;
                return (
                  <div
                    key={stat.id}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      {StatIcon && <StatIcon className="w-5 h-5 text-primary" />}
                      <Select
                        value={stat.icon_key}
                        onValueChange={(v) => handleSaveStat(stat.id, { icon_key: v as WhyChooseUsIconKey })}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(({ key, label }) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Value (e.g. 100+)"
                      value={stat.stat_value}
                      onChange={e => setStats(prev => prev.map(s => s.id === stat.id ? { ...s, stat_value: e.target.value } : s))}
                      onBlur={e => {
                        const v = e.target.value.trim();
                        if (v !== stat.stat_value) handleSaveStat(stat.id, { stat_value: v });
                      }}
                    />
                    <Input
                      placeholder="Label (e.g. Successful Events)"
                      value={stat.stat_label}
                      onChange={e => setStats(prev => prev.map(s => s.id === stat.id ? { ...s, stat_label: e.target.value } : s))}
                      onBlur={e => {
                        const v = e.target.value.trim();
                        if (v !== stat.stat_label) handleSaveStat(stat.id, { stat_label: v });
                      }}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={stat.stat_description ?? ''}
                      onChange={e => setStats(prev => prev.map(s => s.id === stat.id ? { ...s, stat_description: e.target.value || null } : s))}
                      onBlur={e => {
                        const v = e.target.value.trim() || null;
                        if (v !== (stat.stat_description ?? '')) handleSaveStat(stat.id, { stat_description: v });
                      }}
                      className="md:col-span-2"
                    />
                    <div className="flex items-center gap-2">
                      {saving === stat.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStat(stat.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {stats.length < 4 && (
              <Button onClick={handleAddStat} disabled={saving === 'add-stat'} className="mt-4">
                {saving === 'add-stat' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Stat Card
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">What Sets Us Apart (reasons)</h3>
            <div className="space-y-3">
              {reasons.map(r => (
                <div key={r.id} className="flex gap-2 items-center">
                  <Star className="w-4 h-4 text-primary flex-shrink-0" />
                  <Input
                    value={r.text}
                    onChange={e => setReasons(prev => prev.map(rr => rr.id === r.id ? { ...rr, text: e.target.value } : rr))}
                    onBlur={e => { const v = e.target.value.trim(); if (v) handleSaveReason(r.id, v); }}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteReason(r.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {saving === r.id && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="New reason..."
                onKeyDown={e => e.key === 'Enter' && handleAddReason()}
              />
              <Button onClick={handleAddReason} disabled={!newReason.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
