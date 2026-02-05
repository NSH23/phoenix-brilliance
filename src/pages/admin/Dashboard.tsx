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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{m.title}</p>
                      <p className="text-3xl font-bold mt-1">{s?.total ?? 0}</p>
                      {change && (
                        <p className="text-xs text-emerald mt-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {change}
                        </p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                      <m.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${m.color}`} />
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Admin Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-8"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Admin Users</CardTitle>
            </div>
            <span className="text-2xl font-bold text-primary">{adminUsers.length}</span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Users who can sign in to the admin dashboard. Remove revokes access. You must enter your own password to remove someone.
            </p>
            <div className="space-y-2">
              {adminUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No admin users.</p>
              ) : (
                adminUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">{(u.name || u.email).charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{u.role}</span>
                    </div>
                    {u.id !== currentUser?.id && u.email !== currentUser?.email ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setRemoveTarget(u)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">You</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Inquiries</CardTitle>
              <Link to="/admin/inquiries">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInquiries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No inquiries yet.</p>
                ) : (
                  recentInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {inquiry.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{inquiry.name}</p>
                          <p className="text-xs text-muted-foreground">{inquiry.event}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            inquiry.status === 'new' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {inquiry.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{inquiry.date}</p>
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
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        {index < recentActivity.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.target}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Site Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Site Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">{over.eventTypes}</p>
                <p className="text-xs text-muted-foreground">Event Types</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">{over.albums}</p>
                <p className="text-xs text-muted-foreground">Albums</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">{over.partners}</p>
                <p className="text-xs text-muted-foreground">Partners</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">{over.testimonials}</p>
                <p className="text-xs text-muted-foreground">Testimonials</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">{over.services}</p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">{over.employees}</p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
