import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Star } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
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
import { mockTestimonials, Testimonial, mockEvents } from '@/data/mockData';
import { toast } from 'sonner';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(mockTestimonials);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    avatar: '',
    rating: 5,
    eventType: '',
  });

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterEvent === 'all' || testimonial.eventType === filterEvent;
    return matchesSearch && matchesFilter;
  });

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        content: testimonial.content,
        avatar: testimonial.avatar,
        rating: testimonial.rating,
        eventType: testimonial.eventType,
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTestimonial) {
      setTestimonials(testimonials.map(t => 
        t.id === editingTestimonial.id 
          ? { ...t, ...formData }
          : t
      ));
      toast.success('Testimonial updated successfully');
    } else {
      const newTestimonial: Testimonial = {
        id: String(Date.now()),
        ...formData,
      };
      setTestimonials([...testimonials, newTestimonial]);
      toast.success('Testimonial created successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTestimonials(testimonials.filter(t => t.id !== id));
    toast.success('Testimonial deleted successfully');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <AdminLayout title="Testimonials" subtitle="Manage client reviews and testimonials">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search testimonials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {mockEvents.map(event => (
              <SelectItem key={event.id} value={event.title}>{event.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Testimonial
        </Button>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTestimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{testimonial.name}</h3>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(testimonial)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(testimonial.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {renderStars(testimonial.rating)}
                </div>

                <p className="text-sm text-muted-foreground flex-1 mb-4 italic">
                  "{testimonial.content}"
                </p>

                <Badge variant="outline" className="w-fit">
                  {testimonial.eventType}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTestimonials.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No testimonials found.</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
            <DialogDescription>
              {editingTestimonial ? 'Update the testimonial details below.' : 'Add a new client testimonial.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rahul & Priya"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Wedding Couple"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Testimonial</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What did the client say..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select 
                  value={formData.eventType} 
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEvents.map(event => (
                      <SelectItem key={event.id} value={event.title}>{event.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating</Label>
                <Select 
                  value={String(formData.rating)} 
                  onValueChange={(value) => setFormData({ ...formData, rating: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <SelectItem key={rating} value={String(rating)}>
                        {rating} Star{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="/path/to/avatar.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTestimonial ? 'Save Changes' : 'Add Testimonial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
