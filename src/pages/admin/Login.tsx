import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, resendVerificationEmail, isAuthenticated } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle email verification callback from URL hash
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'signup' && accessToken) {
      toast.success('Email verified!', {
        description: 'Your account has been verified. Redirecting...',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setNeedsVerification(false);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success('Welcome back!', {
          description: 'You have successfully logged in.',
        });
        // Navigation will happen via useEffect watching isAuthenticated
      } else {
        if (result.needsVerification) {
          setNeedsVerification(true);
          setVerificationEmail(email);
        }
        toast.error('Login failed', {
          description: result.message || 'Invalid email or password.',
        });
      }
    } catch (error: any) {
      toast.error('Login error', {
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setIsLoading(true);
    try {
      const result = await resendVerificationEmail(verificationEmail);
      if (result.success) {
        toast.success('Email sent!', {
          description: result.message || 'Please check your inbox.',
        });
      } else {
        toast.error('Failed to send email', {
          description: result.message || 'Please try again later.',
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to resend verification email.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setResetSent(false);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/set-password`,
      });
      if (error) {
        toast.error('Failed to send reset email', { description: error.message });
        return;
      }
      setResetSent(true);
      toast.success('Check your email', {
        description: 'If an account exists, we sent a link to set a new password.',
      });
    } catch (err: any) {
      toast.error('Something went wrong', { description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-gold/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center mb-4"
            >
              <img src="/logo.png" alt="Phoenix" className="w-16 h-16 object-contain" />
            </motion.div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Phoenix Admin</h1>
            <p className="text-muted-foreground mt-1">Sign in to your dashboard</p>
          </div>

          {/* Email Verification Alert */}
          <AnimatePresence>
            {needsVerification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert className="border-primary/50 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-2">Email verification required</p>
                    <p className="text-muted-foreground mb-3">
                      Please check your email ({verificationEmail}) and click the verification link.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend Verification Email'
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@phoenix.com"
                      className="pl-10 h-12 rounded-xl"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); setResetSent(false); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 rounded-xl"
                      required={!forgotPassword}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {forgotPassword ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Enter your email and we&apos;ll send a link to set a new password.
                    </p>
                    <Button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => { setForgotPassword(false); setResetSent(false); }}
                      disabled={isLoading}
                    >
                      Back to sign in
                    </Button>
                    {resetSent && (
                      <p className="text-sm text-center text-muted-foreground">
                        Check {email} and click the link to set your new password.
                      </p>
                    )}
                  </div>
                ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                )}
              </form>
        </div>
      </motion.div>
    </div>
  );
}
