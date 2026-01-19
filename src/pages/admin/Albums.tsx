import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Image, Video, Star, MoreHorizontal, Calendar } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { mockAlbums, mockEvents, Album } from '@/data/mockData';
import { toast } from 'sonner';

export default function AdminAlbums() {
  const [albums, setAlbums] = useState<Album[]>(mockAlbums);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({
    eventId: '',
    title: '',
    description: '',
    coverImage: '',
    eventDate: '',
    isFeatured: false,
  });

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = filterEvent === 'all' || album.eventId === filterEvent;
    return matchesSearch && matchesEvent;
  });

  const handleOpenDialog = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        eventId: album.eventId,
        title: album.title,
        description: album.description,
        coverImage: album.coverImage,
        eventDate: album.eventDate,
        isFeatured: album.isFeatured,
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        eventId: '',
        title: '',
        description: '',
        coverImage: '',
        eventDate: '',
        isFeatured: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const event = mockEvents.find(e => e.id === formData.eventId);
    if (editingAlbum) {
      setAlbums(albums.map(a => 
        a.id === editingAlbum.id 
          ? { ...a, ...formData, eventTitle: event?.title || '' }
          : a
      ));
      toast.success('Album updated successfully');
    } else {
      const newAlbum: Album = {
        id: String(Date.now()),
        ...formData,
        eventTitle: event?.title || '',
        mediaCount: 0,
      };
      setAlbums([...albums, newAlbum]);
      toast.success('Album created successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAlbums(albums.filter(a => a.id !== id));
    toast.success('Album deleted successfully');
  };

  const toggleFeatured = (id: string) => {
    setAlbums(albums.map(a => 
      a.id === id ? { ...a, isFeatured: !a.isFeatured } : a
    ));
  };

  return (
    <AdminLayout title="Albums" subtitle="Manage event albums and their media">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {mockEvents.map(event => (
              <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Album
        </Button>
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlbums.map((album, index) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative h-52 overflow-hidden">
                <img
                  src={album.coverImage}
                  alt={album.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
                    {album.eventTitle}
                  </Badge>
                  {album.isFeatured && (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 border-0 text-white hover:bg-black/70">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(album)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Image className="w-4 h-4 mr-2" /> Manage Media
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFeatured(album.id)}>
                        <Star className="w-4 h-4 mr-2" /> 
                        {album.isFeatured ? 'Remove Featured' : 'Set Featured'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(album.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-serif font-bold text-white line-clamp-1">{album.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-white/80 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {album.mediaCount} items
                    </span>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {album.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredAlbums.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No albums found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterEvent !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first album to get started'}
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Album
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
            <DialogDescription>
              {editingAlbum ? 'Update the album details below.' : 'Create a new album for your event photos and videos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventId">Event Type</Label>
              <Select 
                value={formData.eventId} 
                onValueChange={(value) => setFormData({ ...formData, eventId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {mockEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Album Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sharma Wedding 2024"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this album..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="/path/to/image.jpg"
                />
              </div>
            </div>

            {formData.coverImage && (
              <div className="relative h-40 rounded-lg overflow-hidden">
                <img
                  src={formData.coverImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="isFeatured">Featured Album</Label>
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAlbum ? 'Save Changes' : 'Create Album'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
