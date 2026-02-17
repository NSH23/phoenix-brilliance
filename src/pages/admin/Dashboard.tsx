import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FolderOpen,
  Images,
  Handshake,
  Mail,
  TrendingUp,
  Eye,
  ArrowUpRight,
  Loader2,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Film,
  Zap,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getDashboardData,
  type DashboardStats,
  type RecentInquiry,
  type RecentActivity,
  type SiteOverview,
} from '@/services/dashboard';
import { getAdminUsers, deleteAdminUser, type AdminUserRow } from '@/services/adminUsers';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

const quickActions = [
  { title: 'Add New Event', href: '/admin/events?add=1', icon: Calendar },
  { title: 'Create Album', href: '/admin/albums?add=1', icon: FolderOpen },
  { title: 'Upload Images', href: '/admin/gallery?upload=1', icon: Images },
  { title: 'Add Collaboration', href: '/admin/collaborations?add=1', icon: Handshake },
  { title: 'Manage Videos', href: '/admin/media', icon: Film },
  { title: 'Add Employee', href: '/admin/team', icon: UserPlus },
];

const statMeta: { key: keyof DashboardStats; title: string; changeKey: 'thisMonth' | 'new' | 'active'; icon: typeof Calendar; color: string }[] = [
  { key: 'events', title: 'Total Events', changeKey: 'thisMonth', icon: Calendar, color: 'from-primary to-rose-gold' },
  { key: 'albums', title: 'Albums', changeKey: 'thisMonth', icon: FolderOpen, color: 'from-emerald to-accent' },
  { key: 'galleryImages', title: 'Gallery Images', changeKey: 'thisMonth', icon: Images, color: 'from-blue-500 to-purple-500' },
  { key: 'inquiries', title: 'Inquiries', changeKey: 'new', icon: Mail, color: 'from-orange-500 to-rose-500' },
  { key: 'team', title: 'Team', changeKey: 'active', icon: Users, color: 'from-violet-500 to-indigo-500' },
];

function formatChange(stats: DashboardStats, key: keyof DashboardStats, changeKey: 'thisMonth' | 'new' | 'active'): string {
  const s = stats[key] as { total?: number; thisMonth?: number; new?: number; active?: number };
  if (changeKey === 'thisMonth' && typeof s.thisMonth === 'number') {
    return s.thisMonth > 0 ? `+${s.thisMonth} this month` : 'This month';
  }
  if (changeKey === 'new' && typeof s.new === 'number') {
    return s.new > 0 ? `+${s.new} new` : '';
  }
  if (changeKey === 'active' && typeof s.active === 'number') {
    return `${s.active} active`;
  }
  return '';
}

export default function AdminDashboard() {
  const { user: currentUser } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [siteOverview, setSiteOverview] = useState<SiteOverview | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<AdminUserRow | null>(null);
  const [removePassword, setRemovePassword] = useState('');
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      const [data, users] = await Promise.all([
        getDashboardData(),
        getAdminUsers().catch(() => []),
      ]);
      setStats(data.stats);
      setRecentInquiries(data.recentInquiries);
      setRecentActivity(data.recentActivity);
      setSiteOverview(data.siteOverview);
      setAdminUsers(users);
    } catch (e: unknown) {
      logger.error('Dashboard load error', e, { component: 'AdminDashboard', action: 'load' });
      toast.error('Failed to load dashboard', {
        description: e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!removeTarget || !currentUser?.email) return;
    if (removeTarget.id === currentUser.id || removeTarget.email === currentUser.email) {
      toast.error('You cannot remove yourself');
      return;
    }
    if (!removePassword) {
      toast.error('Enter your password to confirm');
      return;
    }
    setRemoveLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: removePassword,
      });
      if (error) {
        toast.error('Incorrect password', { description: 'Your password is required to remove a user.' });
        setRemoveLoading(false);
        return;
      }
      await deleteAdminUser(removeTarget.id);
      setAdminUsers((prev) => prev.filter((u) => u.id !== removeTarget.id));
      setRemoveTarget(null);
      setRemovePassword('');
      toast.success(`${removeTarget.email} has been removed from admin users.`);
    } catch (e: unknown) {
      toast.error('Failed to remove user', { description: (e as Error)?.message });
    } finally {
      setRemoveLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Welcome back! Here's what's happening with your events.">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const st = stats ?? {
    events: { total: 0, thisMonth: 0 },
    albums: { total: 0, thisMonth: 0 },
    galleryImages: { total: 0, thisMonth: 0 },
    inquiries: { total: 0, new: 0 },
    team: { total: 0, active: 0, thisMonth: 0 },
  };
  const over = siteOverview ?? { eventTypes: 0, albums: 0, partners: 0, testimonials: 0, services: 0, employees: 0 };

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's what's happening with your events.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statMeta.map((m, index) => {
          const s = st[m.key] as { total: number; thisMonth?: number; new?: number };
          const change = formatChange(st, m.key, m.changeKey);
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden hover:shadow-lg transition-all border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
                      <p className="text-3xl font-bold mt-2">{s?.total ?? 0}</p>
                      {change && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          {change}
                        </p>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md`}>
                      <m.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.color} opacity-50`} />
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">

        {/* Left Column (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-8">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group h-full border-muted/60">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{action.title}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Activity & Inquiries Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Inquiries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col border-muted/60">
                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Recent Inquiries</CardTitle>
                  <Link to="/admin/inquiries">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/10">
                      View All <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  <div className="divide-y divide-border/40">
                    {recentInquiries.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <Mail className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No new inquiries.</p>
                      </div>
                    ) : (
                      recentInquiries.slice(0, 5).map((inquiry) => (
                        <div
                          key={inquiry.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary font-bold text-xs">
                                {inquiry.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{inquiry.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{inquiry.event}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${inquiry.status === 'new' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                }`}
                            >
                              {inquiry.status}
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-1">{inquiry.date}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col border-muted/60">
                <CardHeader className="py-4 px-6 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1">
                  <div className="space-y-6">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                    ) : (
                      recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={activity.id} className="flex gap-4 relative">
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary/20 ring-4 ring-background z-10" />
                            {index < recentActivity.length - 1 && <div className="w-px flex-1 bg-border/50 absolute top-2.5 bottom-[-24px] left-[4.5px]" />}
                          </div>
                          <div className="flex-1 -mt-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.target}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-mono opacity-70">{activity.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-8">

          {/* Site Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Site Overview
              </h2>
            </div>
            <Card className="border-muted/60">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Event Types', value: over.eventTypes, icon: Calendar },
                    { label: 'Albums', value: over.albums, icon: Images },
                    { label: 'Services', value: over.services, icon: Handshake },
                    { label: 'Testimonials', value: over.testimonials, icon: Users },
                    { label: 'Partners', value: over.partners, icon: Shield },
                    { label: 'Employees', value: over.employees, icon: UserPlus },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors border border-border/20">
                      <span className="text-xl font-bold text-foreground">{item.value}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1 text-center">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Admin Users */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Team Access
              </h2>
            </div>
            <Card className="border-muted/60">
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {adminUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 px-4 text-center">No admin users.</p>
                  ) : (
                    adminUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-xs">{(u.name || u.email).charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{u.name || u.email.split('@')[0]}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        {u.id !== currentUser?.id && u.email !== currentUser?.email ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setRemoveTarget(u)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">You</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* Remove User Confirmation Dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
            setRemovePassword('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove user</DialogTitle>
            <DialogDescription>
              To remove {removeTarget?.email ?? 'this user'}, enter your own password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="remove-password">Your password</Label>
              <Input
                id="remove-password"
                type="password"
                placeholder="Enter your password"
                value={removePassword}
                onChange={(e) => setRemovePassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRemoveUser()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveTarget(null);
                setRemovePassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveUser}
              disabled={removeLoading || !removePassword}
            >
              {removeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
