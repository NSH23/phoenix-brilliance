import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/contexts/AdminContext';
import { updateAdminUser } from '@/services/adminUsers';
import { toast } from 'sonner';

export default function AdminSetPassword() {
  const navigate = useNavigate();
  const { refreshUser } = useAdmin();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  /** True when user landed here with existing session (must-change-password), not from magic link. */
  const isFirstLoginChangeRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'email' | 'magiclink' | 'recovery',
        });
        if (mounted) {
          if (error) {
            toast.error('Invalid or expired link', { description: error.message });
            navigate('/admin', { replace: true });
            return;
          }
          setSessionReady(true);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session) {
          setSessionReady(true);
          isFirstLoginChangeRef.current = true;
        } else if (mounted && window.location.hash) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (mounted) {
            setSessionReady(!!s2);
            if (s2) isFirstLoginChangeRef.current = true;
          }
        }
      }
      if (mounted) setVerifying(false);
    };

    run();
    return () => { mounted = false; };
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data: { user: u }, error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message || 'Failed to set password');
        setLoading(false);
        return;
      }
      if (u && isFirstLoginChangeRef.current) {
        await updateAdminUser(u.id, { must_change_password: false });
        await refreshUser();
      }
      if (u && !isFirstLoginChangeRef.current) {
        await supabase.rpc('create_admin_user', {
          user_id: u.id,
          user_email: u.email ?? '',
          user_name: u.user_metadata?.name ?? u.email?.split('@')[0] ?? 'Admin',
          user_role: 'admin',
        }).catch(() => {});
      }
      toast.success('Password set successfully. Signing you in...');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error('Something went wrong', { description: (err as Error)?.message });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-foreground mb-2">Invalid or expired link</h1>
          <p className="text-muted-foreground mb-4">This link may have been used or expired. Request a new one from the admin dashboard.</p>
          <Button onClick={() => navigate('/admin')}>Go to admin login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Set your password</h1>
          <p className="text-muted-foreground mt-1">Choose a password to sign in to the admin dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="pl-9"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="pl-9"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || password !== confirmPassword || password.length < 6}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Set password & continue
          </Button>
        </form>
      </div>
    </div>
  );
}
