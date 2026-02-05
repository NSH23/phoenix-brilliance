import { useState, useEffect } from 'react';
import { Loader2, Star, Plus, Trash2 } from 'lucide-react';
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
  type WhyChooseUsReason,
} from '@/services/whyChooseUs';
import { getSiteContentByKey, updateSiteContent } from '@/services/siteContent';
import { toast } from 'sonner';

export default function AdminWhyUs() {
  const [reasons, setReasons] = useState<WhyChooseUsReason[]>([]);
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
      const [r, h] = await Promise.all([
        getWhyChooseUsReasons(),
        getSiteContentByKey('why-us').catch(() => null),
      ]);
      setReasons(r);
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
      await updateSiteContent('why-us', header);
      toast.success('Section header updated');
    } catch (err: unknown) {
      toast.error('Failed to update header', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
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
    <AdminLayout title="Why Choose Us" subtitle="Manage Why Phoenix Events section on the homepage">
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
                  placeholder="We create experiences that become cherished memories."
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
