import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, GripVertical } from 'lucide-react';
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
import { toast } from 'sonner';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
}

const mockServices: Service[] = [
  {
    id: '1',
    title: 'Event Planning',
    description: 'Complete end-to-end event planning and management services.',
    icon: 'Calendar',
    features: ['Venue Selection', 'Budget Management', 'Timeline Planning', 'Vendor Coordination'],
    isActive: true,
    displayOrder: 1,
  },
  {
    id: '2',
    title: 'Decoration & Design',
    description: 'Stunning decorations that transform your venue into a magical space.',
    icon: 'Palette',
    features: ['Theme Design', 'Floral Arrangements', 'Lighting Setup', 'Stage Design'],
    isActive: true,
    displayOrder: 2,
  },
  {
    id: '3',
    title: 'Photography & Video',
    description: 'Professional photography and videography to capture every moment.',
    icon: 'Camera',
    features: ['Pre-Event Shoots', 'Event Coverage', 'Drone Photography', 'Cinematic Videos'],
    isActive: true,
    displayOrder: 3,
  },
  {
    id: '4',
    title: 'Catering Services',
    description: 'Exquisite culinary experiences tailored to your preferences.',
    icon: 'UtensilsCrossed',
    features: ['Menu Planning', 'Live Stations', 'Multi-Cuisine Options', 'Dietary Accommodations'],
    isActive: true,
    displayOrder: 4,
  },
  {
    id: '5',
    title: 'Entertainment',
    description: 'Top-tier entertainment to keep your guests engaged.',
    icon: 'Music',
    features: ['DJ Services', 'Live Bands', 'Performers', 'MC Services'],
    isActive: true,
    displayOrder: 5,
  },
];

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    features: '',
    isActive: true,
  });

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        description: service.description,
        icon: service.icon,
        features: service.features.join(', '),
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      setFormData({
        title: '',
        description: '',
        icon: '',
        features: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const featuresArray = formData.features.split(',').map(f => f.trim()).filter(Boolean);
    
    if (editingService) {
      setServices(services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData, features: featuresArray }
          : s
      ));
      toast.success('Service updated successfully');
    } else {
      const newService: Service = {
        id: String(Date.now()),
        ...formData,
        features: featuresArray,
        displayOrder: services.length + 1,
      };
      setServices([...services, newService]);
      toast.success('Service created successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    toast.success('Service deleted successfully');
  };

  const handleToggleActive = (id: string) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  return (
    <AdminLayout title="Services" subtitle="Manage your service offerings">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-serif font-bold">{service.title}</h3>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleActive(service.id)}
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(service)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(service.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Update the service details below.' : 'Create a new service offering.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Event Planning"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon">Icon Name (Lucide)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., Calendar, Camera, Music"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="e.g., Venue Selection, Budget Management, Timeline Planning"
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingService ? 'Save Changes' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
