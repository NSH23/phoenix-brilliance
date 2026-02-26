import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Loader2, Users, Mail, Phone, Briefcase, Upload, FileText, Download, X, Eye, MapPin, Calendar, Banknote } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  getAllTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamDocuments,
  createTeamDocument,
  deleteTeamDocument,
  getTeamDocumentDownloadUrl,
  getTeamPhotoUrl,
  type TeamMember,
  type TeamMemberInput,
  type TeamDocument,
} from '@/services/team';
import { uploadTeamPhoto, deleteTeamPhoto, uploadTeamDocument } from '@/services/storage';
import { toast } from 'sonner';

function TeamPhotoImg({
  photoUrl,
  alt = '',
  className,
  fallback,
}: {
  photoUrl: string | null;
  alt?: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isExternal = photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'));

  useEffect(() => {
    if (!photoUrl) {
      setSrc(null);
      setFailed(false);
      return;
    }
    if (isExternal) {
      setSrc(photoUrl);
      setFailed(false);
      return;
    }
    setSrc(null);
    setFailed(false);
    getTeamPhotoUrl(photoUrl, 3600)
      .then(setSrc)
      .catch(() => setFailed(true));
  }, [photoUrl, isExternal]);

  if (!photoUrl || failed || (!isExternal && !src)) return <>{fallback}</>;
  return <img src={src!} alt={alt} className={className} loading="lazy" decoding="async" />;
}

const defaultForm: Record<string, string | number | boolean | null> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  designation: '',
  aadhaar_card: '',
  age: '',
  salary: '',
  join_date: '',
  department: '',
  emergency_contact: '',
  notes: '',
  photo_url: '',
  is_active: true,
};

export default function AdminTeam() {
  const [list, setList] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({ ...defaultForm });
  const [docs, setDocs] = useState<TeamDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDisplayName, setDocDisplayName] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [pendingDocs, setPendingDocs] = useState<{ id: string; file: File; name: string }[]>([]);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [viewDocs, setViewDocs] = useState<TeamDocument[]>([]);
  const [loadingViewDocs, setLoadingViewDocs] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (viewingMember?.id) {
      setLoadingViewDocs(true);
      getTeamDocuments(viewingMember.id)
        .then(setViewDocs)
        .catch(() => setViewDocs([]))
        .finally(() => setLoadingViewDocs(false));
    } else {
      setViewDocs([]);
    }
  }, [viewingMember?.id]);

  useEffect(() => {
    if (isDialogOpen && editing?.id) {
      setLoadingDocs(true);
      setPendingDocs([]);
      setPhotoPreviewUrl((p) => {
        if (p) URL.revokeObjectURL(p);
        return null;
      });
      getTeamDocuments(editing.id)
        .then(setDocs)
        .catch(() => setDocs([]))
        .finally(() => setLoadingDocs(false));
    } else {
      setDocs([]);
      setPendingDocs([]);
      setPhotoFile(null);
      setDocFile(null);
      setDocDisplayName('');
      setPhotoPreviewUrl((p) => {
        if (p) URL.revokeObjectURL(p);
        return null;
      });
    }
  }, [isDialogOpen, editing?.id]);

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await getAllTeam();
      setList(data);
    } catch (err: unknown) {
      toast.error('Failed to load team', { description: (err as Error)?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = list.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDialog = (m?: TeamMember) => {
    if (m) {
      setEditing(m);
      setForm({
        name: m.name,
        email: m.email,
        phone: m.phone || '',
        address: m.address || '',
        designation: m.designation,
        aadhaar_card: m.aadhaar_card || '',
        age: m.age ?? '',
        salary: m.salary ?? '',
        join_date: m.join_date ? m.join_date.slice(0, 10) : '',
        department: m.department || '',
        emergency_contact: m.emergency_contact || '',
        notes: m.notes || '',
        photo_url: m.photo_url || '',
        is_active: m.is_active,
      });
    } else {
      setEditing(null);
      setForm({ ...defaultForm });
    }
    setIsDialogOpen(true);
  };

  const set = (key: string, value: string | number | boolean | null) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    const name = String(form.name || '').trim();
    const email = String(form.email || '').trim();
    const designation = String(form.designation || '').trim();
    if (!name || !email || !designation) {
      toast.error('Name, email and designation are required');
      return;
    }

    const payload: TeamMemberInput = {
      name,
      email,
      phone: String(form.phone || '').trim() || null,
      address: String(form.address || '').trim() || null,
      designation,
      aadhaar_card: String(form.aadhaar_card || '').trim() || null,
      age: form.age === '' || form.age === null ? null : Number(form.age),
      salary: form.salary === '' || form.salary === null ? null : Number(form.salary),
      join_date: String(form.join_date || '').trim() || null,
      department: String(form.department || '').trim() || null,
      emergency_contact: String(form.emergency_contact || '').trim() || null,
      notes: String(form.notes || '').trim() || null,
      photo_url: (!editing && photoFile) ? null : (String(form.photo_url || '').trim() || null),
      is_active: Boolean(form.is_active),
    };

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateTeamMember(editing.id, payload);
        setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        toast.success('Team member updated');
      } else {
        let created = await createTeamMember(payload);
        if (photoFile) {
          const path = await uploadTeamPhoto(created.id, photoFile);
          await updateTeamMember(created.id, { photo_url: path });
          created = { ...created, photo_url: path };
        }
        for (const p of pendingDocs) {
          const { path, name: docName, fileType } = await uploadTeamDocument(created.id, p.file, p.name);
          await createTeamDocument(created.id, { name: docName, file_path: path, file_type: fileType });
        }
        setList((prev) => [created, ...prev]);
        toast.success('Team member added');
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this team member? This cannot be undone.')) return;
    try {
      await deleteTeamMember(id);
      setList((prev) => prev.filter((x) => x.id !== id));
      toast.success('Team member removed');
      if (editing?.id === id) setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error('Failed to delete', { description: (err as Error)?.message });
    }
  };

  const handleToggleActive = async (m: TeamMember) => {
    try {
      const updated = await updateTeamMember(m.id, { is_active: !m.is_active });
      setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(updated.is_active ? 'Marked active' : 'Marked inactive');
    } catch (err: unknown) {
      toast.error('Failed to update', { description: (err as Error)?.message });
    }
  };

  const handleUploadPhoto = async () => {
    if (!editing || !photoFile) return;
    setUploadingPhoto(true);
    try {
      const path = await uploadTeamPhoto(editing.id, photoFile);
      set('photo_url', path);
      setPhotoFile(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      toast.success('Photo uploaded');
    } catch (err: unknown) {
      toast.error('Failed to upload photo', { description: (err as Error)?.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!editing) return;
    setUploadingPhoto(true);
    try {
      await deleteTeamPhoto(editing.id);
      set('photo_url', '');
      toast.success('Photo removed');
    } catch (err: unknown) {
      toast.error('Failed to remove photo', { description: (err as Error)?.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDownloadDoc = async (d: TeamDocument) => {
    try {
      const url = await getTeamDocumentDownloadUrl(d.file_path);
      window.open(url, '_blank');
    } catch (err: unknown) {
      toast.error('Failed to get download link', { description: (err as Error)?.message });
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteTeamDocument(id);
      setDocs((prev) => prev.filter((x) => x.id !== id));
      toast.success('Document deleted');
    } catch (err: unknown) {
      toast.error('Failed to delete document', { description: (err as Error)?.message });
    }
  };

  const handleAddDoc = async () => {
    if (!docFile) return;
    if (editing) {
      setUploadingDoc(true);
      try {
        const { path, name, fileType } = await uploadTeamDocument(editing.id, docFile, docDisplayName || undefined);
        const newDoc = await createTeamDocument(editing.id, { name, file_path: path, file_type: fileType });
        setDocs((prev) => [newDoc, ...prev]);
        setDocFile(null);
        setDocDisplayName('');
        if (docInputRef.current) docInputRef.current.value = '';
        toast.success('Document added');
      } catch (err: unknown) {
        toast.error('Failed to add document', { description: (err as Error)?.message });
      } finally {
        setUploadingDoc(false);
      }
    } else {
      setPendingDocs((prev) => [...prev, { id: crypto.randomUUID(), file: docFile, name: docDisplayName || docFile.name }]);
      setDocFile(null);
      setDocDisplayName('');
      if (docInputRef.current) docInputRef.current.value = '';
      toast.success('Document added');
    }
  };

  const handleRemovePendingDoc = (id: string) => {
    setPendingDocs((prev) => prev.filter((x) => x.id !== id));
  };

  const handleClearAddPhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <AdminLayout title="Team" subtitle="Manage employees and team members">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, designation, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full relative group">
                <CardContent className="p-3 md:p-6 flex flex-col items-center text-center h-full">
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingMember(m)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDialog(m)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div
                    className="flex flex-col items-center cursor-pointer w-full"
                    onClick={() => setViewingMember(m)}
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-muted mb-2 md:mb-4 bg-muted/30">
                      <TeamPhotoImg
                        photoUrl={m.photo_url}
                        alt={m.name}
                        className="w-full h-full object-cover"
                        fallback={<Users className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />}
                      />
                    </div>

                    <h3 className="font-semibold text-sm md:text-lg w-full truncate px-1">{m.name}</h3>
                    <p className="text-xs text-muted-foreground w-full truncate px-1 mb-1 md:mb-2">{m.designation}</p>

                    <div className="flex flex-wrap items-center justify-center gap-1 mt-auto">
                      <Badge variant={m.is_active ? 'default' : 'secondary'} className="text-[10px] md:text-xs px-1.5 py-0 h-5">
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {m.department && (
                        <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 py-0 h-5 max-w-[80px] truncate hidden md:inline-flex">
                          {m.department}
                        </Badge>
                      )}
                    </div>

                    <div className="hidden md:flex gap-3 mt-3 text-xs text-muted-foreground">
                      {m.email && <Mail className="w-3 h-3" />}
                      {m.phone && <Phone className="w-3 h-3" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No team members found.</div>
      )}

      <Sheet
        open={!!viewingMember}
        onOpenChange={(open) => {
          if (!open) {
            setViewingMember(null);
            setViewDocs([]);
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col w-full sm:max-w-lg">
          {viewingMember && (
            <>
              <SheetHeader className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl">{viewingMember.name}</SheetTitle>
                  <Badge variant={viewingMember.is_active ? 'default' : 'secondary'}>
                    {viewingMember.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1 min-h-0 -mx-6 px-6 mt-4">
                <div className="space-y-4 pr-4">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-muted flex-shrink-0 flex items-center justify-center bg-muted/30">
                      <TeamPhotoImg
                        photoUrl={viewingMember.photo_url}
                        alt={viewingMember.name}
                        className="w-full h-full object-cover"
                        fallback={<Users className="w-12 h-12 text-muted-foreground" />}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{viewingMember.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{viewingMember.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{viewingMember.designation}{viewingMember.department ? ` · ${viewingMember.department}` : ''}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Personal</h4>
                    <div className="space-y-1.5 text-sm">
                      <p><span className="text-muted-foreground">Age:</span> {viewingMember.age != null ? viewingMember.age : '—'}</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span>{viewingMember.address || '—'}</span>
                      </div>
                      <p><span className="text-muted-foreground">Emergency contact:</span> {viewingMember.emergency_contact || '—'}</p>
                      <p><span className="text-muted-foreground">Aadhaar:</span> {viewingMember.aadhaar_card ? `****${viewingMember.aadhaar_card.slice(-4)}` : '—'}</p>
                    </div>
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Employment</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>Join date: {viewingMember.join_date ? new Date(viewingMember.join_date).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>Salary: {viewingMember.salary != null ? `₹${Number(viewingMember.salary).toLocaleString()}` : '—'}</span>
                      </div>
                      {viewingMember.notes && (
                        <p className="pt-1"><span className="text-muted-foreground">Notes:</span><br />{viewingMember.notes}</p>
                      )}
                    </div>
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Documents</h4>
                    {loadingViewDocs ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                      </div>
                    ) : viewDocs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No documents.</p>
                    ) : (
                      <ul className="space-y-2">
                        {viewDocs.map((d) => (
                          <li key={d.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/50">
                            <span className="flex items-center gap-2 text-sm truncate">
                              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                              {d.name}
                            </span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleDownloadDoc(d)}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </ScrollArea>
              <div className="flex flex-shrink-0 border-t pt-4 mt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    const who = viewingMember;
                    setViewingMember(null);
                    setViewDocs([]);
                    if (who) openDialog(who);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit employee
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-4 overflow-hidden p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editing ? 'Edit Team Member' : 'Add Employee'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update employee details.' : 'Add a new team member. Name, email and designation are required.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <div className="grid gap-4 py-2 pr-2">
              {/* Basic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 grid gap-2">
                  <Label>Name *</Label>
                  <Input
                    value={String(form.name ?? '')}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={String(form.email ?? '')}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={String(form.phone ?? '')}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Designation / Role *</Label>
                  <Input
                    value={String(form.designation ?? '')}
                    onChange={(e) => set('designation', e.target.value)}
                    placeholder="e.g. Event Manager, Coordinator"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Input
                    value={String(form.department ?? '')}
                    onChange={(e) => set('department', e.target.value)}
                    placeholder="e.g. Operations, Sales"
                  />
                </div>
              </div>

              {/* Personal */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Personal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      min={18}
                      max={100}
                      value={form.age === '' || form.age === null ? '' : form.age}
                      onChange={(e) => set('age', e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="25"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Aadhaar (last 4 shown in list)</Label>
                    <Input
                      value={String(form.aadhaar_card ?? '')}
                      onChange={(e) => set('aadhaar_card', e.target.value)}
                      placeholder="12 digits"
                      maxLength={12}
                    />
                  </div>
                  <div className="sm:col-span-2 grid gap-2">
                    <Label>Address</Label>
                    <Textarea
                      value={String(form.address ?? '')}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="Full address"
                      rows={2}
                    />
                  </div>
                  <div className="sm:col-span-2 grid gap-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      value={String(form.emergency_contact ?? '')}
                      onChange={(e) => set('emergency_contact', e.target.value)}
                      placeholder="Name and phone"
                    />
                  </div>
                </div>
              </div>

              {/* Employment */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Employment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Join Date</Label>
                    <Input
                      type="date"
                      value={String(form.join_date ?? '')}
                      onChange={(e) => set('join_date', e.target.value || null)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Salary (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={form.salary === '' || form.salary === null ? '' : form.salary}
                      onChange={(e) => set('salary', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="sm:col-span-2 grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={String(form.notes ?? '')}
                      onChange={(e) => set('notes', e.target.value)}
                      placeholder="Internal notes"
                      rows={2}
                    />
                  </div>
                  <div className="sm:col-span-2 grid gap-2">
                    <Label>Photo</Label>
                    {editing ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden border bg-muted flex-shrink-0">
                          <TeamPhotoImg
                            photoUrl={form.photo_url}
                            alt={form.name ? `${form.name} photo` : 'Team member photo'}
                            className="w-full h-full object-cover"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-7 h-7 text-muted-foreground" />
                              </div>
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                          />
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                              <Upload className="w-4 h-4 mr-1" /> Choose
                            </Button>
                            {photoFile && (
                              <Button type="button" size="sm" onClick={handleUploadPhoto} disabled={uploadingPhoto}>
                                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span className="ml-1">Upload</span>
                              </Button>
                            )}
                            {form.photo_url && (
                              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={handleRemovePhoto} disabled={uploadingPhoto}>
                                Remove photo
                              </Button>
                            )}
                          </div>
                          {photoFile && <span className="text-xs text-muted-foreground">{photoFile.name}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setPhotoFile(file);
                              if (file) {
                                setPhotoPreviewUrl((p) => {
                                  if (p) URL.revokeObjectURL(p);
                                  return URL.createObjectURL(file);
                                });
                              } else {
                                setPhotoPreviewUrl((p) => {
                                  if (p) URL.revokeObjectURL(p);
                                  return null;
                                });
                              }
                            }}
                          />
                          <div className="w-16 h-16 rounded-full overflow-hidden border bg-muted flex-shrink-0 flex items-center justify-center">
                            {photoFile && photoPreviewUrl ? (
                              <img src={photoPreviewUrl} alt="Team member photo preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <Users className="w-7 h-7 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-1" /> Choose image
                              </Button>
                              {photoFile && (
                                <Button type="button" variant="ghost" size="sm" onClick={handleClearAddPhoto}>
                                  <X className="w-4 h-4 mr-1" /> Clear
                                </Button>
                              )}
                            </div>
                            {photoFile && <span className="text-xs text-muted-foreground">{photoFile.name}</span>}
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-muted-foreground">Or paste image URL</Label>
                          <Input
                            value={String(form.photo_url ?? '')}
                            onChange={(e) => set('photo_url', e.target.value)}
                            placeholder="https://..."
                            disabled={!!photoFile}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Documents</h4>
                {editing ? (
                  loadingDocs ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ul className="space-y-2">
                        {docs.map((d) => (
                          <li key={d.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/50">
                            <span className="flex items-center gap-2 text-sm truncate">
                              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                              {d.name}
                            </span>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button type="button" size="sm" variant="ghost" onClick={() => handleDownloadDoc(d)}>
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDoc(d.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-end gap-2">
                        <input
                          ref={docInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-1" /> Choose file
                        </Button>
                        <Input
                          placeholder="Display name (optional)"
                          value={docDisplayName}
                          onChange={(e) => setDocDisplayName(e.target.value)}
                          className="max-w-[200px]"
                        />
                        <Button type="button" size="sm" onClick={handleAddDoc} disabled={!docFile || uploadingDoc}>
                          {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                          Add document
                        </Button>
                      </div>
                      {docFile && <span className="text-xs text-muted-foreground block">{docFile.name}</span>}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <ul className="space-y-2">
                      {pendingDocs.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/50">
                          <span className="flex items-center gap-2 text-sm truncate">
                            <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                            {p.name}
                          </span>
                          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemovePendingDoc(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-end gap-2">
                      <input
                        ref={docInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-1" /> Choose file
                      </Button>
                      <Input
                        placeholder="Display name (optional)"
                        value={docDisplayName}
                        onChange={(e) => setDocDisplayName(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <Button type="button" size="sm" onClick={handleAddDoc} disabled={!docFile}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add document
                      </Button>
                    </div>
                    {docFile && <span className="text-xs text-muted-foreground block">{docFile.name}</span>}
                    {pendingDocs.length > 0 && (
                      <p className="text-xs text-muted-foreground">Documents will be uploaded when you save the employee.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label>Active</Label>
                <Switch checked={Boolean(form.is_active)} onCheckedChange={(v) => set('is_active', v)} />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editing ? (
                'Save Changes'
              ) : (
                'Add Employee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
