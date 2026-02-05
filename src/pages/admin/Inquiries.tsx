import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Trash2, MoreHorizontal, Mail, Phone, Calendar, Filter, Loader2 } from 'lucide-react';
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
import { getAllInquiries, updateInquiry, deleteInquiry, type Inquiry } from '@/services/inquiries';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<Inquiry['status'], string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  converted: 'bg-green-500',
  closed: 'bg-gray-500',
};

const statusLabels: Record<Inquiry['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  converted: 'Converted',
  closed: 'Closed',
};

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await getAllInquiries();
      setInquiries(data);
    } catch (err: unknown) {
      logger.error('Failed to load inquiries', err, { component: 'AdminInquiries', action: 'loadInquiries' });
      toast.error('Failed to load inquiries', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.event_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || i.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: Inquiry['status']) => {
    try {
      const updated = await updateInquiry(id, { status });
      setInquiries(prev => prev.map(i => (i.id === id ? updated : i)));
      if (selectedInquiry?.id === id) setSelectedInquiry(prev => (prev ? { ...prev, status } : null));
      toast.success(`Status updated to ${statusLabels[status]}`);
    } catch (err: unknown) {
      toast.error('Failed to update status', { description: (err as Error)?.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return;
    try {
      await deleteInquiry(id);
      setInquiries(prev => prev.filter(i => i.id !== id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
        setIsDetailOpen(false);
      }
      toast.success('Inquiry deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const getStatusBadge = (status: Inquiry['status']) => (
    <Badge className={`${statusColors[status]} text-white`}>{statusLabels[status]}</Badge>
  );

  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <AdminLayout
      title="Inquiries"
      subtitle={newCount > 0 ? `Manage contact form submissions (${newCount} new)` : 'Manage contact form submissions'}
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['new', 'contacted', 'converted', 'closed'] as const).map(status => (
          <Card key={status} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{statusLabels[status]}</p>
                <p className="text-2xl font-bold">{inquiries.filter(i => i.status === status).length}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
            </div>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry, i) => (
            <motion.div
              key={inquiry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{inquiry.name}</h3>
                        {getStatusBadge(inquiry.status)}
                        <Badge variant="outline">{inquiry.event_type || '—'}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {inquiry.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {inquiry.phone || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(inquiry.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{inquiry.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(inquiry)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(inquiry.id, 'contacted')}>
                            Mark as Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(inquiry.id, 'converted')}>
                            Mark as Converted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(inquiry.id, 'closed')}>
                            Mark as Closed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(inquiry.id)} className="text-destructive">
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
      )}

      {!isLoading && filteredInquiries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No inquiries found.</p>
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              {selectedInquiry &&
                `Received on ${format(new Date(selectedInquiry.created_at), 'MMMM d, yyyy at h:mm a')}`}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">{selectedInquiry.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedInquiry.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedInquiry.status)}
                    <Badge variant="outline">{selectedInquiry.event_type || '—'}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-sm text-primary hover:underline">
                    {selectedInquiry.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <a href={`tel:${selectedInquiry.phone || ''}`} className="text-sm text-primary hover:underline">
                    {selectedInquiry.phone || '—'}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Message</p>
                <p className="text-sm bg-muted/50 p-4 rounded-lg">{selectedInquiry.message}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'contacted', 'converted', 'closed'] as const).map(status => (
                    <Button
                      key={status}
                      variant={selectedInquiry.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedInquiry.id, status);
                        setSelectedInquiry(prev => (prev ? { ...prev, status } : null));
                      }}
                    >
                      {statusLabels[status]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {selectedInquiry && (
              <Button variant="destructive" onClick={() => handleDelete(selectedInquiry.id)}>
                Delete Inquiry
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
