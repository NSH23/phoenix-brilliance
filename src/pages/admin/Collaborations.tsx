import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, MapPin, Images, ListOrdered } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCollaborations, Collaboration } from '@/data/mockData';
import { toast } from 'sonner';

export default function AdminCollaborations() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>(mockCollaborations);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    description: '',
    location: '',
    mapUrl: '',
    isActive: true,
  });

  const filteredCollaborations = collaborations.filter(collab =>
    collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collab.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (collab?: Collaboration) => {
    if (collab) {
      setEditingCollab(collab);
      setFormData({
        name: collab.name,
        logoUrl: collab.logoUrl,
        description: collab.description,
        location: collab.location,
        mapUrl: collab.mapUrl || '',
        isActive: collab.isActive,
      });
    } else {
      setEditingCollab(null);
      setFormData({
        name: '',
        logoUrl: '',
        description: '',
        location: '',
        mapUrl: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCollab) {
      setCollaborations(collaborations.map(c => 
        c.id === editingCollab.id 
          ? { ...c, ...formData }
          : c
      ));
      toast.success('Collaboration updated successfully');
    } else {
      const newCollab: Collaboration = {
        id: String(Date.now()),
        ...formData,
        displayOrder: collaborations.length + 1,
        images: [],
        steps: [],
      };
      setCollaborations([...collaborations, newCollab]);
      toast.success('Collaboration created successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCollaborations(collaborations.filter(c => c.id !== id));
    toast.success('Collaboration deleted successfully');
  };

  const handleToggleActive = (id: string) => {
    setCollaborations(collaborations.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  return (
    <AdminLayout title="Collaborations" subtitle="Manage your venue partners and collaborators">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search collaborations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Partner
        </Button>
      </div>

      {/* Collaborations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollaborations.map((collab, index) => (
          <motion.div
            key={collab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={collab.logoUrl}
                        alt={collab.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold">{collab.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {collab.location}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(collab)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(collab.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {collab.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {collab.images.length} images
                    </span>
                    <span className="flex items-center gap-1">
                      <ListOrdered className="w-3 h-3" />
                      {collab.steps.length} steps
                    </span>
                  </div>
                  <Badge variant={collab.isActive ? 'default' : 'secondary'}>
                    {collab.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="px-6 py-3 bg-muted/50 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Switch
                  checked={collab.isActive}
                  onCheckedChange={() => handleToggleActive(collab.id)}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollab ? 'Edit Collaboration' : 'Add New Partner'}</DialogTitle>
            <DialogDescription>
              {editingCollab ? 'Update the partner details below.' : 'Add a new venue partner or collaborator.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="steps">Booking Steps</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Partner Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grand Palace Hotel"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="/path/to/logo.jpg"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the venue/partner..."
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Mumbai, Maharashtra"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mapUrl">Google Maps URL</Label>
                <Input
                  id="mapUrl"
                  value={formData.mapUrl}
                  onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Images className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Image management will be available after saving.</p>
                <p className="text-sm">Save the partner first, then add venue images.</p>
              </div>
            </TabsContent>

            <TabsContent value="steps" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Booking steps will be available after saving.</p>
                <p className="text-sm">Save the partner first, then define booking steps.</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCollab ? 'Save Changes' : 'Create Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
