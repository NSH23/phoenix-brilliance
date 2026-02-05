import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator';
  avatar?: string;
}

interface AdminContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

/** Build a fallback AdminUser from Supabase auth when DB fetch fails. Prevents spurious logouts. */
function fallbackAdminUserFromAuth(authUser: User): AdminUser {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: (meta.name as string) || authUser.email?.split('@')[0] || 'User',
    role: (meta.role as 'admin' | 'moderator') || 'moderator',
  };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<AdminUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load admin user from database with timeout
  const loadAdminUser = async (authUser: User): Promise<AdminUser | null> => {
    try {
      // Add timeout to prevent hanging (e.g. when tab is in background)
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 6000); // 6 second timeout
      });

      const queryPromise = (async () => {
        // First, try to fetch existing admin user
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          logger.error('Error loading admin user', error, { component: 'AdminContext', action: 'loadAdminUser' });
          return null;
        }

        // If admin user exists, return it. Otherwise return null — only users added via
        // Admin Settings can access the panel; no auto-insert.
        if (data) {
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            avatar: data.avatar_url || undefined,
          };
        }
        return null;
      })();

      // Race between query and timeout
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      logger.error('Error in loadAdminUser', error, { component: 'AdminContext', action: 'loadAdminUser' });
      return null;
    }
  };

  // Check session on mount and listen for auth changes
  useEffect(() => {
    let mounted = true;

    // Safety timeout to ensure loading doesn't stay true forever
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout

    // Initial session check
    const checkSession = async () => {
      try {
        // Check if supabase is available
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('Session error', sessionError, { component: 'AdminContext', action: 'checkSession' });
        }
        
        if (!mounted) return;

        if (session?.user) {
          try {
            const adminUser = await loadAdminUser(session.user);
            if (mounted) {
              if (adminUser) {
                setUser(adminUser);
              } else {
                await supabase.auth.signOut();
                setUser(null);
              }
            }
          } catch (loadError) {
            logger.error('Error loading admin user', loadError, { component: 'AdminContext', action: 'checkSession' });
            if (mounted) {
              setUser(fallbackAdminUserFromAuth(session.user));
            }
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error: any) {
        // Any error - set user to null and continue
        if (mounted) {
          setUser(null);
        }
      } finally {
        clearTimeout(safetyTimeout);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Handle email verification callback from URL hash
    const handleEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'signup' && mounted) {
        try {
          clearTimeout(safetyTimeout);
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (!error && session?.user && mounted) {
            const adminUser = await loadAdminUser(session.user);
            if (mounted) {
              setUser(adminUser ?? fallbackAdminUserFromAuth(session.user));
              setIsLoading(false);
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            // Verification failed, check normal session
            if (mounted) {
              await checkSession();
            }
          }
        } catch (error) {
          logger.error('Error handling email verification', error, { component: 'AdminContext', action: 'handleEmailVerification' });
          clearTimeout(safetyTimeout);
          // On error, check normal session
          if (mounted) {
            await checkSession();
          }
        }
      } else {
        // No verification callback, proceed with normal session check
        await checkSession();
      }
    };

    // Check for verification callback first, then normal session check
    handleEmailVerification().catch((error) => {
      logger.error('Error in handleEmailVerification', error, { component: 'AdminContext', action: 'handleEmailVerification' });
      clearTimeout(safetyTimeout);
      if (mounted) {
        setIsLoading(false);
        setUser(null);
      }
    });

    // Listen for auth state changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // For any event with a valid session, set user (never clear when session exists)
      if (session?.user) {
        try {
          const adminUser = await loadAdminUser(session.user);
          if (mounted) {
            setUser(adminUser ?? fallbackAdminUserFromAuth(session.user));
            if (event === 'SIGNED_IN') setIsLoading(false);
          }
        } catch {
          if (mounted) {
            setUser(fallbackAdminUserFromAuth(session.user));
            if (event === 'SIGNED_IN') setIsLoading(false);
          }
        }
      }
    });

    subscription = authSubscription;
    } catch (error) {
      logger.error('Error setting up auth state listener', error, { component: 'AdminContext', action: 'setupAuthListener' });
      clearTimeout(safetyTimeout);
      if (mounted) {
        setIsLoading(false);
      }
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // When tab becomes visible, re-check session so we don't stay logged out if state was lost
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !userRef.current) {
        try {
          const adminUser = await loadAdminUser(session.user);
          setUser(adminUser ?? fallbackAdminUserFromAuth(session.user));
        } catch {
          setUser(fallbackAdminUserFromAuth(session.user));
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; needsVerification?: boolean }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        
        // Check if email needs verification
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed') ||
            error.message.includes('email_not_verified')) {
          return {
            success: false,
            message: 'Please verify your email before logging in. Check your inbox for the verification link.',
            needsVerification: true,
          };
        }

        // Invalid credentials
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('invalid_credentials')) {
          return {
            success: false,
            message: 'Invalid email or password. Please check your credentials and try again.',
          };
        }

        return {
          success: false,
          message: error.message || 'Login failed. Please try again.',
        };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, message: 'Login failed. Please try again.' };
      }

      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        setIsLoading(false);
        return {
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          needsVerification: true,
        };
      }

      const adminUser = await loadAdminUser(data.user);
      setIsLoading(false);
      if (!adminUser) {
        await supabase.auth.signOut();
        return {
          success: false,
          message: 'You do not have access to the admin panel. Accounts must be created by an existing admin in Settings.',
        };
      }
      setUser(adminUser);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      logger.error('Login error', error, { component: 'AdminContext', action: 'login' });
      return {
        success: false,
        message: error.message || 'Something went wrong. Please try again.',
      };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        logger.error('Resend verification error', error, { component: 'AdminContext', action: 'resendVerificationEmail' });
        return {
          success: false,
          message: error.message || 'Failed to resend verification email.',
        };
      }

      return {
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      };
    } catch (error: any) {
      logger.error('Resend verification error', error, { component: 'AdminContext', action: 'resendVerificationEmail' });
      return {
        success: false,
        message: error.message || 'Failed to resend verification email.',
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      logger.error('Logout error', error, { component: 'AdminContext', action: 'logout' });
    }
  };

  return (
    <AdminContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        resendVerificationEmail,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
