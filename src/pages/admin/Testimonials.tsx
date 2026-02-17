import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Star, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { logger } from '@/utils/logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/admin/ImageUpload';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type Testimonial,
} from '@/services/testimonials';
import { getAllEvents } from '@/services/events';
import type { Event } from '@/services/events';
import { toast } from 'sonner';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    avatar: '',
    rating: 5,
    eventType: '',
    display_order: 0,
    is_featured: false,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const [t, e] = await Promise.all([getAllTestimonials(), getAllEvents()]);
      setTestimonials(t);
      setEvents(e);
    } catch (err: unknown) {
      logger.error('Failed to load testimonials', err, { component: 'AdminTestimonials', action: 'loadTestimonials' });
      toast.error('Failed to load testimonials', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterEvent === 'all' || (t.event_type || '') === filterEvent;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (testimonial?: Testimonial) => {
    const nextOrder = testimonials.length > 0
      ? Math.max(...testimonials.map(t => t.display_order ?? 0)) + 1
      : 0;
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role || '',
        content: testimonial.content,
        avatar: testimonial.avatar_url || '',
        rating: testimonial.rating ?? 5,
        eventType: testimonial.event_type || '',
        display_order: testimonial.display_order ?? 0,
        is_featured: testimonial.is_featured ?? false,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: '',
        role: '',
        content: '',
        avatar: '',
        rating: 5,
        eventType: '',
        display_order: nextOrder,
        is_featured: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Name and content are required');
      return;
    }
    setSaving(true);
    try {
      if (editingTestimonial) {
        const updated = await updateTestimonial(editingTestimonial.id, {
          name: formData.name.trim(),
          role: formData.role.trim() || null,
          content: formData.content.trim(),
          avatar_url: formData.avatar.trim() || null,
          rating: formData.rating,
          event_type: formData.eventType.trim() || null,
          display_order: formData.display_order,
          is_featured: formData.is_featured,
        });
        setTestimonials(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        toast.success('Testimonial updated');
      } else {
        const created = await createTestimonial({
          name: formData.name.trim(),
          role: formData.role.trim() || null,
          content: formData.content.trim(),
          avatar_url: formData.avatar.trim() || null,
          rating: formData.rating,
          event_type: formData.eventType.trim() || null,
          is_featured: formData.is_featured,
          display_order: formData.display_order,
        });
        setTestimonials(prev => [created, ...prev]);
        toast.success('Testimonial created');
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success('Testimonial deleted');
      if (editingTestimonial?.id === id) setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const handleToggleFeatured = async (t: Testimonial) => {
    try {
      const updated = await updateTestimonial(t.id, { is_featured: !t.is_featured });
      setTestimonials(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_featured ? 'Marked featured' : 'Removed from featured');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < (rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
      />
    ));

  const eventTitles = [...new Set(events.map(e => e.title).filter(Boolean))].sort();

  return (
    <AdminLayout title="Testimonials" subtitle="Manage client reviews and testimonials">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search testimonials..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {eventTitles.map(title => (
              <SelectItem key={title} value={title}>{title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Testimonial
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {filteredTestimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-3 md:p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden bg-muted shrink-0">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-xs md:text-base">
                              {t.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-xs md:text-sm truncate">{t.name}</h3>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{t.role || '—'}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 -mr-1 md:-mr-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(t)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1 mb-2 md:mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 md:w-4 md:h-4 ${i < (t.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] md:text-sm text-muted-foreground flex-1 mb-2 md:mb-4 italic line-clamp-3 md:line-clamp-none">
                      "{t.content}"
                    </p>
                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                      <Badge variant="outline" className="text-[10px] md:text-xs px-1 py-0 h-4 md:h-auto line-clamp-1 max-w-[80px] md:max-w-none">{t.event_type || '—'}</Badge>
                      <Badge variant="secondary" className="text-[10px] md:text-xs px-1 py-0 h-4 md:h-auto">Order: {t.display_order ?? 0}</Badge>
                      {t.is_featured && (
                        <Badge className="gap-0.5 px-1 py-0 md:gap-1 md:px-2.5 md:py-0.5 bg-primary/90 text-[10px] md:text-xs">
                          <Star className="w-2 h-2 md:w-3 md:h-3 fill-current" /> <span className="hidden md:inline">Featured</span>
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {filteredTestimonials.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No testimonials found.</div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
            <DialogDescription>
              {editingTestimonial ? 'Update the testimonial details below.' : 'Add a new client testimonial. It will be saved to the database.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rahul & Priya"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Wedding Couple"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Testimonial</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="What did the client say..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Event Type</Label>
                <Select value={formData.eventType} onValueChange={v => setFormData({ ...formData, eventType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTitles.map(title => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Rating</Label>
                <Select
                  value={String(formData.rating)}
                  onValueChange={v => setFormData({ ...formData, rating: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map(r => (
                      <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              </div>
              <div className="grid gap-2">
                <Label>Featured</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={v => setFormData({ ...formData, is_featured: v })}
                  />
                  <span className="text-sm text-muted-foreground">Show on homepage</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Avatar</Label>
              <ImageUpload
                value={formData.avatar}
                onChange={v => setFormData({ ...formData, avatar: (v as string) || '' })}
                multiple={false}
                previewClassName="object-cover rounded-full"
                bucket="testimonial-avatars"
                uploadOnSelect={true}
              />
              <p className="text-xs text-muted-foreground">Or paste URL:</p>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://... or /path/to/avatar.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving... </> : (editingTestimonial ? 'Save Changes' : 'Add Testimonial')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
