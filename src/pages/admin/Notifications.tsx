import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Eye, Trash2, MoreHorizontal, Mail, Phone, Calendar, Filter, Loader2, Bell } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import WpLeadDetailSheet from '@/components/admin/WpLeadDetailSheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getInquiriesPage, getInquiryById, updateInquiry, deleteInquiry, type Inquiry } from '@/services/inquiries';
import {
  getWpLeadBriefsByPhones,
  getWpLeadByPhone,
  getWpNotifications,
  markAllWpNotificationsRead,
  markWpNotificationRead,
  markWpNotificationsReadByIds,
  type WpLead,
  type WpNotification,
} from '@/services/wpAgent';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDateTimeLocal } from '@/lib/formatDate';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

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

type WpUnreadGroup = {
  key: string;
  lead_phone: string | null;
  lead_name: string | null;
  ids: string[];
  priorities: string[];
  messages: string[];
  latestAt: string;
  count: number;
};

function worstPriority(prios: string[]): string {
  const lowered = prios.map((p) => (p || '').toLowerCase());
  if (lowered.some((p) => p === 'high' || p === 'urgent')) return 'high';
  if (lowered.some((p) => p === 'medium')) return 'medium';
  return 'low';
}

function priorityBadgeClass(p: string): string {
  const x = (p || '').toLowerCase();
  if (x === 'high' || x === 'urgent') return 'bg-destructive text-destructive-foreground hover:bg-destructive border-0';
  if (x === 'medium') return 'bg-amber-500 text-amber-950 hover:bg-amber-500 border-0';
  return 'bg-muted text-muted-foreground hover:bg-muted border-border';
}

function buildWpUnreadGroups(notifications: WpNotification[]): WpUnreadGroup[] {
  const unread = notifications.filter((n) => !n.is_read);
  const map = new Map<string, WpUnreadGroup>();
  for (const n of unread) {
    const key = n.lead_phone || `orphan:${n.id}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        lead_phone: n.lead_phone,
        lead_name: n.lead_name,
        ids: [n.id],
        priorities: [n.priority],
        messages: [n.message],
        latestAt: n.created_at,
        count: 1,
      });
    } else {
      existing.ids.push(n.id);
      existing.priorities.push(n.priority);
      existing.messages.push(n.message);
      existing.count += 1;
      if (new Date(n.created_at).getTime() > new Date(existing.latestAt).getTime()) {
        existing.latestAt = n.created_at;
      }
      existing.lead_name = n.lead_name ?? existing.lead_name;
      existing.lead_phone = n.lead_phone ?? existing.lead_phone;
    }
  }
  return [...map.values()].sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

export default function AdminNotifications() {
  const PAGE_SIZE = 20;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'inquiries' | 'wp'>('inquiries');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [wpNotifications, setWpNotifications] = useState<WpNotification[]>([]);
  const [wpLeadBriefs, setWpLeadBriefs] = useState<
    Record<string, { event_type: string | null; source_channel: string | null }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWp, setIsLoadingWp] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [openingInquiryId, setOpeningInquiryId] = useState<string | null>(null);

  const [wpDetailLead, setWpDetailLead] = useState<WpLead | null>(null);
  const [wpDetailOpen, setWpDetailOpen] = useState(false);
  const [markAllWpBusy, setMarkAllWpBusy] = useState(false);

  const loadInquiries = useCallback(async (nextPage: number, reset: boolean) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const data = await getInquiriesPage(nextPage, PAGE_SIZE);
      setInquiries((prev) => (reset ? data : [...prev, ...data]));
      setPage(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err: unknown) {
      logger.error('Failed to load inquiries', err, { component: 'AdminNotifications', action: 'loadInquiries' });
      toast.error('Failed to load inquiries', { description: (err as Error)?.message });
    } finally {
      if (reset) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, []);

  const loadWpNotifications = useCallback(async () => {
    try {
      setIsLoadingWp(true);
      setWpNotifications(await getWpNotifications(200));
    } catch (err: unknown) {
      toast.error('Failed to load WP notifications', { description: (err as Error)?.message });
    } finally {
      setIsLoadingWp(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries(0, true);
    void loadWpNotifications();
  }, [loadInquiries, loadWpNotifications]);

  useEffect(() => {
    const openId = searchParams.get('open');
    const tabParam = searchParams.get('tab');
    const leadPhone = searchParams.get('leadPhone');
    if (tabParam === 'wp') setTab('wp');
    if (tabParam === 'inquiries') setTab('inquiries');
    if (!openId) return;
    setTab('inquiries');
    setOpeningInquiryId(openId);
  }, [searchParams]);

  useEffect(() => {
    const leadPhone = searchParams.get('leadPhone');
    if (!leadPhone) return;

    setTab('wp');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('leadPhone');
        return next;
      },
      { replace: true }
    );

    let cancelled = false;
    void (async () => {
      try {
        const lead = await getWpLeadByPhone(leadPhone);
        if (cancelled) return;
        setWpDetailLead(lead);
        setWpDetailOpen(true);
        if (!lead) toast.error('Lead not found', { description: leadPhone });
      } catch (err: unknown) {
        if (!cancelled) toast.error('Unable to open lead', { description: (err as Error)?.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const phones = wpNotifications.map((n) => n.lead_phone).filter(Boolean) as string[];
    let cancelled = false;
    void (async () => {
      try {
        const briefs = await getWpLeadBriefsByPhones(phones);
        if (!cancelled) setWpLeadBriefs(briefs);
      } catch {
        if (!cancelled) setWpLeadBriefs({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wpNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel('wp-notifications-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wp_notifications' }, () => {
        void loadWpNotifications();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadWpNotifications]);

  const filteredInquiries = inquiries.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.event_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || i.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if (!openingInquiryId) return;
    const local = inquiries.find(i => i.id === openingInquiryId);
    if (local) {
      setSelectedInquiry(local);
      setIsDetailOpen(true);
      setOpeningInquiryId(null);
      const params = new URLSearchParams(searchParams);
      params.delete('open');
      setSearchParams(params, { replace: true });
      return;
    }
    void (async () => {
      try {
        const fetched = await getInquiryById(openingInquiryId);
        setInquiries(prev => (prev.some(i => i.id === fetched.id) ? prev : [fetched, ...prev]));
        setSelectedInquiry(fetched);
        setIsDetailOpen(true);
      } catch (err) {
        toast.error('Unable to open this notification', { description: (err as Error)?.message });
      } finally {
        setOpeningInquiryId(null);
        const params = new URLSearchParams(searchParams);
        params.delete('open');
        setSearchParams(params, { replace: true });
      }
    })();
  }, [openingInquiryId, inquiries, searchParams, setSearchParams]);

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

  const handleMarkWpRead = async (id: string) => {
    try {
      await markWpNotificationRead(id);
      setWpNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      toast.success('Notification marked as read');
    } catch (err: unknown) {
      toast.error('Failed to mark as read', { description: (err as Error)?.message });
    }
  };

  const handleMarkAllWpRead = async () => {
    setMarkAllWpBusy(true);
    try {
      await markAllWpNotificationsRead();
      setWpNotifications(prev => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All WP alerts marked read');
    } catch (err: unknown) {
      toast.error('Failed to mark all read', { description: (err as Error)?.message });
    } finally {
      setMarkAllWpBusy(false);
    }
  };

  const openWpLeadFromGroup = async (group: WpUnreadGroup) => {
    try {
      await markWpNotificationsReadByIds(group.ids);
      setWpNotifications((prev) => prev.map((n) => (group.ids.includes(n.id) ? { ...n, is_read: true } : n)));
    } catch (err: unknown) {
      toast.error('Failed to mark notifications read', { description: (err as Error)?.message });
      return;
    }
    const phone = group.lead_phone;
    if (!phone) {
      toast.error('No phone on this notification');
      return;
    }
    try {
      const lead = await getWpLeadByPhone(phone);
      setWpDetailLead(lead);
      setWpDetailOpen(true);
      if (!lead) toast.error('Lead not found', { description: phone });
    } catch (err: unknown) {
      toast.error('Failed to open lead', { description: (err as Error)?.message });
    }
  };

  const openWpLeadFromReadRow = async (n: WpNotification) => {
    const phone = n.lead_phone;
    if (!phone) {
      toast.error('No phone on this notification');
      return;
    }
    try {
      const lead = await getWpLeadByPhone(phone);
      setWpDetailLead(lead);
      setWpDetailOpen(true);
      if (!lead) toast.error('Lead not found', { description: phone });
    } catch (err: unknown) {
      toast.error('Failed to open lead', { description: (err as Error)?.message });
    }
  };

  const wpUnreadGroups = useMemo(() => buildWpUnreadGroups(wpNotifications), [wpNotifications]);
  const wpReadItems = useMemo(
    () =>
      wpNotifications
        .filter((n) => n.is_read)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [wpNotifications]
  );

  const getStatusBadge = (status: Inquiry['status']) => (
    <Badge className={`${statusColors[status]} text-white`}>{statusLabels[status]}</Badge>
  );

  const newCount = inquiries.filter(i => i.status === 'new').length;
  const wpUnreadCount = wpNotifications.filter(n => !n.is_read).length;

  return (
    <AdminLayout
      title="Notifications"
      subtitle={`Inquiries (${newCount} new) • WP Alerts (${wpUnreadCount} unread)`}
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'inquiries' | 'wp')} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full sm:w-[320px]">
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="wp">WP Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 max-md:h-11"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] max-md:w-full max-md:h-11">
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
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 max-md:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{inquiry.name}</h3>
                            {getStatusBadge(inquiry.status)}
                            <Badge variant="outline">{inquiry.event_type || '—'}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{inquiry.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{inquiry.phone || '—'}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDateTimeLocal(inquiry.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 max-md:w-full max-md:justify-end">
                          <Button variant="outline" size="sm" className="max-md:h-11 max-md:px-4" onClick={() => { setSelectedInquiry(inquiry); setIsDetailOpen(true); }}>
                            <Eye className="w-4 h-4 mr-2" />View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(inquiry.id, 'contacted')}>Mark as Contacted</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(inquiry.id, 'converted')}>Mark as Converted</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(inquiry.id, 'closed')}>Mark as Closed</DropdownMenuItem>
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

          {!isLoading && hasMore && (
            <div className="mt-6 flex justify-center">
              <Button onClick={() => loadInquiries(page + 1, false)} disabled={isLoadingMore}>
                {isLoadingMore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : 'Load More'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="wp" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Unread alerts are grouped per phone. Tap a row to open the lead drawer.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:h-10 shrink-0"
              disabled={wpUnreadCount === 0 || markAllWpBusy}
              onClick={() => void handleMarkAllWpRead()}
            >
              {markAllWpBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Mark all read
            </Button>
          </div>

          <Card className="rounded-2xl sm:rounded-lg border border-border/60 sm:border-border">
            <CardContent className="p-0">
              {isLoadingWp ? (
                <div className="flex justify-center py-14">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : wpNotifications.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  No WP notifications found.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {wpUnreadGroups.length > 0 ? (
                    <div className="px-4 py-3 bg-muted/20 border-b border-border/40">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unread</p>
                    </div>
                  ) : null}
                  {wpUnreadGroups.map((g) => {
                    const brief = g.lead_phone ? wpLeadBriefs[g.lead_phone] : undefined;
                    const pri = worstPriority(g.priorities);
                    return (
                      <button
                        key={g.key}
                        type="button"
                        className="w-full text-left p-4 flex flex-col gap-2 hover:bg-muted/40 transition-colors"
                        onClick={() => void openWpLeadFromGroup(g)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn(priorityBadgeClass(pri))}>{pri}</Badge>
                          {g.count > 1 ? (
                            <Badge variant="outline">{g.count} alerts</Badge>
                          ) : null}
                          <Badge variant="outline">{wpNotifications.find((n) => n.id === g.ids[0])?.type ?? '—'}</Badge>
                        </div>
                        <p className="font-semibold">{g.lead_name || 'Unknown lead'}</p>
                        <p className="text-sm text-muted-foreground">
                          {g.lead_phone || '—'}
                          {brief?.event_type ? ` • ${brief.event_type}` : ''}
                          {brief?.source_channel ? ` • ${brief.source_channel}` : ''}
                        </p>
                        <p className="text-sm line-clamp-2">{g.messages[g.messages.length - 1]}</p>
                        <p className="text-xs text-muted-foreground">{new Date(g.latestAt).toLocaleString()}</p>
                      </button>
                    );
                  })}

                  {wpReadItems.length > 0 ? (
                    <div className="px-4 py-3 bg-muted/15 border-y border-border/40">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Read</p>
                    </div>
                  ) : null}
                  {wpReadItems.map((n) => {
                    const brief = n.lead_phone ? wpLeadBriefs[n.lead_phone] : undefined;
                    const pri = (n.priority || 'low').toLowerCase();
                    const badgePri = pri === 'urgent' ? 'high' : pri;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className="w-full text-left p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors opacity-90"
                        onClick={() => void openWpLeadFromReadRow(n)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn(priorityBadgeClass(badgePri))}>{badgePri}</Badge>
                          <Badge variant="outline">{n.type}</Badge>
                        </div>
                        <p className="font-semibold">{n.lead_name || 'Unknown lead'}</p>
                        <p className="text-sm text-muted-foreground">
                          {n.lead_phone || '—'}
                          {brief?.event_type ? ` • ${brief.event_type}` : ''}
                          {brief?.source_channel ? ` • ${brief.source_channel}` : ''}
                        </p>
                        <p className="text-sm line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl max-md:w-full max-md:max-h-[90vh] max-md:overflow-y-auto max-md:p-4">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              {selectedInquiry && `Received on ${formatDateTimeLocal(selectedInquiry.created_at)}`}
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
              <div>
                <p className="text-xs text-muted-foreground mb-2">Message</p>
                <p className="text-sm bg-muted/50 p-4 rounded-lg">{selectedInquiry.message}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="max-md:w-full max-md:h-11 max-md:px-4">Close</Button>
            {selectedInquiry && (
              <Button variant="destructive" onClick={() => handleDelete(selectedInquiry.id)} className="max-md:w-full max-md:h-11 max-md:px-4">
                Delete Inquiry
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WpLeadDetailSheet lead={wpDetailLead} open={wpDetailOpen} onOpenChange={setWpDetailOpen} />
    </AdminLayout>
  );
}
