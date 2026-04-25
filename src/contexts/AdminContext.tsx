import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { resolvePublicStorageUrl } from '@/services/storage';
import { logger } from '@/utils/logger';

/** Admin user – avatar is for admin UI only (dashboard sidebar, Settings). Do not use on public routes. */
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator';
  avatar?: string;
  must_change_password?: boolean;
}

interface AdminContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginInFlightRef = useRef(false);

  // Load admin user from database with timeout
  const loadAdminUser = async (authUser: User): Promise<AdminUser | null> => {
    try {
      // Add timeout to prevent hanging (e.g. when tab is in background)
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 4000); // 4 second timeout
      });

      const queryPromise = (async () => {
        // First, try to fetch existing admin user
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, email, name, role, avatar_url, must_change_password')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          logger.error('Error loading admin user', error, { component: 'AdminContext', action: 'loadAdminUser' });
          return null;
        }

        // If admin user exists, return it. Otherwise return null — only users added via
        // Admin Settings can access the panel; no auto-insert.
        if (data) {
          const rawAvatar = data.avatar_url;
          let avatar: string | undefined;
          if (rawAvatar) {
            avatar = resolvePublicStorageUrl(rawAvatar, 'admin-avatars');
          }
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            avatar,
            must_change_password: !!data.must_change_password,
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

  // Manual-signin mode: do not auto-login from persisted sessions.
  // We only react to explicit login() and sign-out events.
  useEffect(() => {
    let mounted = true;
    setIsLoading(false);

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
      void session;
    });

    subscription = authSubscription;
    } catch (error) {
      logger.error('Error setting up auth state listener', error, { component: 'AdminContext', action: 'setupAuthListener' });
      if (mounted) {
        setIsLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; needsVerification?: boolean }> => {
    if (loginInFlightRef.current) {
      return { success: false, message: 'Login is already in progress. Please wait a moment.' };
    }
    loginInFlightRef.current = true;
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
        await supabase.auth.signOut({ scope: 'local' });
        return {
          success: false,
          message: 'You do not have access to the admin panel. Accounts must be created by an existing admin in Settings.',
        };
      }
      setUser(adminUser);
      return { success: true };
    } catch (error: unknown) {
      setIsLoading(false);
      logger.error('Login error', error, { component: 'AdminContext', action: 'login' });
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      return {
        success: false,
        message,
      };
    } finally {
      loginInFlightRef.current = false;
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${baseUrl}/admin`,
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
    } catch (error: unknown) {
      logger.error('Resend verification error', error, { component: 'AdminContext', action: 'resendVerificationEmail' });
      const message = error instanceof Error ? error.message : 'Failed to resend verification email.';
      return {
        success: false,
        message,
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
    } catch (error) {
      logger.error('Logout error', error, { component: 'AdminContext', action: 'logout' });
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const adminUser = await loadAdminUser(session.user);
        if (adminUser) setUser(adminUser);
      }
    } catch {
      // ignore
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
        refreshUser,
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
