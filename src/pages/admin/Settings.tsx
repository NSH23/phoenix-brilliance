import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Shield, Bell, Globe, Database, UserPlus, Mail, Lock, Loader2, ArrowLeft, Users } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminUserAvatar from '@/components/admin/AdminUserAvatar';
import ImageUpload from '@/components/admin/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
import { updateAdminUser, getAdminUsers, type AdminUserRow } from '@/services/adminUsers';
import { supabase } from '@/lib/supabase';
import { getSiteSettingOptional, upsertSiteSetting } from '@/services/siteContent';
import { getPublicUrl } from '@/services/storage';
import { toast } from 'sonner';

const NOTIFICATION_STORAGE_KEY = 'admin_notification_preferences';
const SITE_SETTINGS_STORAGE_KEY = 'admin_site_settings';

const defaultNotifications = {
  emailInquiries: true,
  emailNewBooking: true,
  browserNotifications: false,
  weeklyReport: true,
};

const defaultSiteSettings = {
  siteName: 'Phoenix Events & Production',
  tagline: 'Creating Magical Moments',
  defaultTheme: 'system',
  maintenanceMode: false,
};

/** Avatar may be stored as full URL or storage path; return a URL suitable for <img src>. */
function resolveAvatarDisplayUrl(avatar: string | undefined): string {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  const { data } = supabase.storage.from('admin-avatars').getPublicUrl(avatar);
  return data.publicUrl;
}

export default function AdminSettings() {
  const { user, refreshUser } = useAdmin();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState(defaultNotifications);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [addUserStep, setAddUserStep] = useState<1 | 2 | 3>(1);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserOtp, setNewUserOtp] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteLogoUrl, setSiteLogoUrl] = useState('');
  const [siteLogoSaving, setSiteLogoSaving] = useState(false);
  const oldSessionRef = useRef<{ access_token: string; refresh_token: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfileData((p) => ({
      ...p,
      name: user.name || '',
      email: user.email || '',
      avatar: user?.avatar ?? '',
    }));
  }, [user]);

  // Resolve avatar for display (preview + img): full URL use as-is; path → signed URL so it works for private bucket
  useEffect(() => {
    const raw = profileData.avatar;
    if (!raw) {
      setAvatarDisplayUrl('');
      return;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      setAvatarDisplayUrl(raw);
      return;
    }
    let cancelled = false;
    createSignedUrl('admin-avatars', raw, 3600)
      .then((url) => { if (!cancelled) setAvatarDisplayUrl(url); })
      .catch(() => {
        if (!cancelled) {
          const { data } = supabase.storage.from('admin-avatars').getPublicUrl(raw);
          setAvatarDisplayUrl(data.publicUrl);
        }
      });
    return () => { cancelled = true; };
  }, [profileData.avatar]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof defaultNotifications>;
        setNotifications((n) => ({ ...n, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof defaultSiteSettings>;
        setSiteSettings((s) => ({ ...s, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const { error } = await supabase.from('admin_users').select('id').limit(1);
        setDbStatus(error ? 'error' : 'connected');
      } catch {
        setDbStatus('error');
      }
    };
    check();
  }, []);

  useEffect(() => {
    setAdminUsersLoading(true);
    getAdminUsers()
      .then(setAdminUsers)
      .catch(() => setAdminUsers([]))
      .finally(() => setAdminUsersLoading(false));
  }, []);

  useEffect(() => {
    getSiteSettingOptional('site_logo_url').then((v) => setSiteLogoUrl(v || '')).catch(() => {});
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail?.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    setAddUserLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: newUserEmail.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${baseUrl}/admin/set-password`,
        },
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        const isServerError = error.message?.includes('500') || msg.includes('internal') || msg.includes('server') || msg.includes('network');
        if (isServerError) {
          toast.error(
            'Email could not be sent (server error)',
            {
              description: 'Check SMTP in Supabase: Project Settings → Auth → SMTP. See docs/SUPABASE_OTP_EMAIL_SETUP.md for 500 troubleshooting.',
              duration: 8000,
            }
          );
        } else if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          toast.error('An account with this email may already exist. Use a different email or have them sign in.');
        } else {
          toast.error(error.message || 'Failed to send OTP');
        }
        setAddUserLoading(false);
        return;
      }
      setAddUserStep(2);
      setNewUserOtp('');
      setOtpResendCooldown(60);
      const t = setInterval(() => setOtpResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
      setTimeout(() => clearInterval(t), 60000);
      toast.success('OTP sent', { description: `A 6-digit code was sent to ${newUserEmail}. The new user should provide it to you.` });
    } catch (err: unknown) {
      const msg = (err as Error)?.message?.toLowerCase() || '';
      const is500 = msg.includes('500') || msg.includes('internal') || msg.includes('server');
      if (is500) {
        toast.error(
          'Email could not be sent (server error)',
          { description: 'Check Supabase SMTP and email config. See docs/SUPABASE_OTP_EMAIL_SETUP.md', duration: 8000 }
        );
      } else {
        toast.error('Failed to send OTP', { description: (err as Error)?.message });
      }
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = newUserOtp.replace(/\D/g, '');
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code from the email');
      return;
    }
    setAddUserLoading(true);
    try {
      const { data: { session: cur } } = await supabase.auth.getSession();
      if (cur) oldSessionRef.current = { access_token: cur.access_token, refresh_token: cur.refresh_token };
      let error = (await supabase.auth.verifyOtp({
        email: newUserEmail.trim(),
        token: otp,
        type: 'email',
      })).error;
      if (error && (error.message?.includes('expired') || error.message?.includes('403'))) {
        error = (await supabase.auth.verifyOtp({
          email: newUserEmail.trim(),
          token: otp,
          type: 'magiclink',
        })).error;
      }
      if (error) {
        toast.error(error.message || 'Invalid or expired code. Request a new code and try again.');
        setAddUserLoading(false);
        return;
      }
      setAddUserStep(3);
      setNewUserOtp('');
      toast.success('Email verified', { description: 'Now set a password for the new admin.' });
    } catch (err: unknown) {
      toast.error('Verification failed', { description: (err as Error)?.message });
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserPassword || !newUserConfirmPassword) {
      toast.error('Please fill in password and confirm password');
      return;
    }
    if (newUserPassword !== newUserConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setAddUserLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        toast.error('Session lost. Please start over.');
        setAddUserStep(1);
        setAddUserLoading(false);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newUserPassword });
      if (updateErr) {
        toast.error(updateErr.message || 'Failed to set password');
        setAddUserLoading(false);
        return;
      }
      const { error: rpcError } = await supabase.rpc('create_admin_user', {
        user_id: u.id,
        user_email: newUserEmail.trim(),
        user_name: newUserName?.trim() || newUserEmail.split('@')[0],
        user_role: 'admin',
      });
      if (rpcError) {
        toast.error('Failed to add to admin list. You may need to add them manually in the database.');
      } else {
        toast.success('New admin user created', { description: 'They can sign in with this email and password.' });
        setAddUserStep(1);
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPassword('');
        setNewUserConfirmPassword('');
        getAdminUsers().then(setAdminUsers);
      }
      await supabase.auth.signOut();
      const old = oldSessionRef.current;
      if (old) await supabase.auth.setSession({ access_token: old.access_token, refresh_token: old.refresh_token });
      oldSessionRef.current = null;
    } catch (err: unknown) {
      toast.error('Failed to create user', { description: (err as Error)?.message });
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleAddUserCancel = () => {
    const old = oldSessionRef.current;
    if (old) {
      supabase.auth.signOut().then(() => supabase.auth.setSession(old));
      oldSessionRef.current = null;
    }
    setAddUserStep(1);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserOtp('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    try {
      await updateAdminUser(user.id, {
        name: profileData.name.trim() || user.name,
        avatar_url: profileData.avatar || null,
      });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile', { description: (err as Error)?.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (profileData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: profileData.currentPassword,
      });
      if (signInErr) {
        toast.error('Current password is incorrect');
        setPasswordSaving(false);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: profileData.newPassword });
      if (updateErr) {
        toast.error(updateErr.message || 'Failed to update password');
        setPasswordSaving(false);
        return;
      }
      toast.success('Password updated successfully');
      setProfileData((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error('Failed to update password', { description: (err as Error)?.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true);
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleSaveSiteSettings = async () => {
    setSiteSaving(true);
    try {
      localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(siteSettings));
      toast.success('Site settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSiteSaving(false);
    }
  };

  const handleSiteLogoChange = async (value: string | string[]) => {
    const url = typeof value === 'string' ? value : Array.isArray(value) ? value[0] ?? '' : '';
    setSiteLogoSaving(true);
    try {
      await upsertSiteSetting('site_logo_url', url, 'text');
      setSiteLogoUrl(url);
      toast.success(url ? 'Site logo updated. It will appear across the site.' : 'Site logo cleared. Default logo will be used.');
    } catch (err) {
      toast.error('Failed to save logo', { description: (err as Error)?.message });
    } finally {
      setSiteLogoSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings" subtitle="Manage your account and site settings">
      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="flex flex-col sm:flex-row h-auto p-2 gap-2 w-full bg-muted/50">
          <TabsTrigger value="profile" className="gap-2 flex-1">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 flex-1">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 flex-1">
            <UserPlus className="w-4 h-4" />
            Add User
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 flex-1">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="site" className="gap-2 flex-1">
            <Globe className="w-4 h-4" />
            Site
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Profile Avatar</Label>
                  <ImageUpload
                    key={profileData.avatar || 'no-avatar'}
                    value={avatarDisplayUrl || resolveAvatarDisplayUrl(profileData.avatar)}
                    onChange={(v) => setProfileData((p) => ({ ...p, avatar: (v as string) || '' }))}
                    multiple={false}
                    previewClassName="object-cover"
                    bucket="admin-avatars"
                    uploadOnSelect={true}
                  />
                  <p className="text-xs text-muted-foreground">Or paste URL:</p>
                  <Input
                    value={profileData.avatar}
                    onChange={(e) => setProfileData((p) => ({ ...p, avatar: e.target.value }))}
                    placeholder="https://... or path from storage"
                  />
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed from this panel.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Input value={user?.role || 'Admin'} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      Role cannot be changed from this panel.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={profileSaving}>
                    {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdatePassword} disabled={passwordSaving}>
                    {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Add New User Tab */}
        <TabsContent value="users">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admin Users ({adminUsers.length})
                </CardTitle>
                <CardDescription>
                  People who can sign in to the admin dashboard. Add new admins below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminUsersLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                ) : adminUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No admin users yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {adminUsers.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <AdminUserAvatar avatarUrl={a.avatar_url} name={a.name || a.email} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{a.name || a.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize shrink-0">{a.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add New Admin User
                </CardTitle>
                <CardDescription>
                  Create a new admin account: verify their email with OTP, then set a password. They sign in with that email and password.
                  Only admins can create new accounts; there is no public signup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">{addUserStep}</span>
                  <span>Step {addUserStep}: {addUserStep === 1 ? 'Email' : addUserStep === 2 ? 'Verify OTP' : 'Set password'}</span>
                </div>

                {addUserStep === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4 max-w-md">
                    <p className="text-xs text-muted-foreground">
                      If the email arrives but the 6-digit code does not, go to Supabase Dashboard → <strong>Authentication</strong> → <strong>Email Templates</strong> → <strong>Magic Link</strong> and add <code className="bg-muted px-1 rounded">{'{{ .Token }}'}</code> to the message body. See <code className="bg-muted px-1 rounded text-[10px]">docs/SUPABASE_OTP_EMAIL_SETUP.md</code> for exact steps.
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="new-user-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-user-email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="newadmin@example.com"
                          className="pl-9"
                          required
                          disabled={addUserLoading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-user-name">Name (optional)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-user-name"
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Defaults to email prefix"
                          className="pl-9"
                          disabled={addUserLoading}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={addUserLoading}>
                      {addUserLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Send OTP
                    </Button>
                  </form>
                )}

                {addUserStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md">
                    <p className="text-sm text-muted-foreground">
                      A 6-digit code was sent to <strong>{newUserEmail}</strong>. Ask the new user to provide it, or check your Supabase email template uses <code className="bg-muted px-1 rounded">{'{{ .Token }}'}</code> for OTP.
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="new-user-otp">6-digit code</Label>
                      <Input
                        id="new-user-otp"
                        inputMode="numeric"
                        maxLength={6}
                        value={newUserOtp}
                        onChange={(e) => setNewUserOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="text-center text-lg tracking-[0.4em] font-mono"
                        disabled={addUserLoading}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={addUserLoading || newUserOtp.replace(/\D/g, '').length !== 6}>
                        {addUserLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Verify
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={addUserLoading || otpResendCooldown > 0}
                        onClick={() => { setAddUserStep(1); setNewUserOtp(''); }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      {otpResendCooldown > 0 ? (
                        <span className="text-sm text-muted-foreground self-center">Resend in {otpResendCooldown}s</span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={addUserLoading}
                          onClick={() => handleSendOtp({ preventDefault: () => { } } as React.FormEvent)}
                        >
                          Resend code
                        </Button>
                      )}
                    </div>
                  </form>
                )}

                {addUserStep === 3 && (
                  <form onSubmit={handleAddNewUser} className="space-y-4 max-w-md">
                    <p className="text-sm text-muted-foreground">Set a password for <strong>{newUserEmail}</strong>.</p>
                    <div className="grid gap-2">
                      <Label htmlFor="new-user-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-user-password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="pl-9"
                          required
                          minLength={6}
                          disabled={addUserLoading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-user-confirm">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-user-confirm"
                          type="password"
                          value={newUserConfirmPassword}
                          onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="pl-9"
                          required
                          minLength={6}
                          disabled={addUserLoading}
                        />
                      </div>
                      {newUserPassword && newUserConfirmPassword && newUserPassword !== newUserConfirmPassword && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={addUserLoading || (newUserPassword !== newUserConfirmPassword && !!newUserConfirmPassword)}>
                        {addUserLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create admin user
                      </Button>
                      <Button type="button" variant="outline" disabled={addUserLoading} onClick={handleAddUserCancel}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Inquiries</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a new inquiry is submitted.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailInquiries}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailInquiries: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Bookings</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when an inquiry is converted to booking.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNewBooking}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailNewBooking: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Browser Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.browserNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, browserNotifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Report</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of inquiries and activity.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weeklyReport: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={notificationsSaving}>
                    {notificationsSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Site Settings Tab */}
        <TabsContent value="site">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure basic site information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={siteSettings.tagline}
                    onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="theme">Default Theme</Label>
                  <Select
                    value={siteSettings.defaultTheme}
                    onValueChange={(value) => setSiteSettings({ ...siteSettings, defaultTheme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Logo</CardTitle>
                <CardDescription>
                  Logo used in the navbar, footer, admin sidebar, and SEO. Upload to storage or leave empty to use the default /logo.png.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Logo image</Label>
                  <ImageUpload
                    value={siteLogoUrl ? (siteLogoUrl.startsWith('http') ? siteLogoUrl : getPublicUrl('site-logo', siteLogoUrl)) : ''}
                    onChange={handleSiteLogoChange}
                    multiple={false}
                    bucket="site-logo"
                    uploadOnSelect={true}
                    previewClassName="object-contain max-h-24"
                  />
                  {siteLogoSaving && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>
                  Temporarily disable public access to your website.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">
                      When enabled, visitors will see a maintenance page.
                    </p>
                  </div>
                  <Switch
                    checked={siteSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSiteSettings({ ...siteSettings, maintenanceMode: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Connection
                </CardTitle>
                <CardDescription>
                  Status of your backend database connection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dbStatus === 'checking' && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Checking connection...</p>
                  </div>
                )}
                {dbStatus === 'connected' && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Your app is connected to Supabase. Data is live.
                      </p>
                    </div>
                  </div>
                )}
                {dbStatus === 'error' && (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="w-3 h-3 bg-destructive rounded-full" />
                    <div>
                      <p className="font-medium text-destructive">Connection issue</p>
                      <p className="text-sm text-muted-foreground">
                        Could not reach the database. Check your Supabase project and env vars.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSiteSettings} disabled={siteSaving}>
                {siteSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
