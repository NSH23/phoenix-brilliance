import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getSupabaseBrowserConfig, supabase } from '@/lib/supabase';
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
  /** Fast path for APK download unlock — skips avatar/session extras. */
  unlockApkDownload: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

type ApkAdminRow = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator';
};

/** Confirm this auth user is in admin_users using the fresh access token. Skips getSession so it cannot wait on the auth lock. */
async function fetchAdminForApkUnlock(
  userId: string,
  accessToken: string,
): Promise<{ row: ApkAdminRow | null; timedOut: boolean; message?: string }> {
  const { url, anonKey } = getSupabaseBrowserConfig();
  const endpoint = new URL('/rest/v1/admin_users', url);
  endpoint.searchParams.set('id', `eq.${userId}`);
  endpoint.searchParams.set('select', 'id,email,name,role');
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(endpoint.toString(), {
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      return { row: null, timedOut: false, message: 'Could not confirm admin access.' };
    }
    const rows = (await response.json()) as ApkAdminRow[];
    return { row: Array.isArray(rows) && rows[0] ? rows[0] : null, timedOut: false };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return {
      row: null,
      timedOut: aborted,
      message: aborted ? 'Admin check timed out' : 'Could not confirm admin access.',
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  // Start true so /admin does not flash the chooser before session restore finishes.
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

  // Restore persisted Supabase session so the admin app stays logged in across restarts.
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const applySessionUser = async (authUser: User | null) => {
      if (!mounted) return;
      if (!authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const adminUser = await loadAdminUser(authUser);
      if (!mounted) return;
      if (adminUser) {
        setUser(adminUser);
      } else {
        // Session exists but not an admin — clear local session.
        await supabase.auth.signOut({ scope: 'local' });
        if (mounted) setUser(null);
      }
      setIsLoading(false);
    };

    void (async () => {
      try {
        // Never hang the /admin chooser if getSession stalls (offline / bad storage).
        const session = await Promise.race([
          supabase.auth.getSession().then((r) => r.data.session),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 5000);
          }),
        ]);
        await applySessionUser(session?.user ?? null);
      } catch (error) {
        logger.error('Error restoring admin session', error, { component: 'AdminContext', action: 'restoreSession' });
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    })();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        // auth-js awaits this callback while holding an exclusive lock.
        // Any Supabase call here (getSession, signOut, admin_users) waits for that
        // same lock and the APK "Verifying…" button never finishes. Defer the work.
        window.setTimeout(() => {
          if (!mounted) return;
          void (async () => {
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsLoading(false);
              return;
            }

            // Keep UI in sync after login, token refresh, or user update.
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              if (loginInFlightRef.current && event === 'SIGNED_IN') {
                // login() / unlockApkDownload() already loads the admin user.
                return;
              }
              await applySessionUser(session?.user ?? null);
            }
          })();
        }, 0);
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

  const unlockApkDownload = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message?: string }> => {
    if (loginInFlightRef.current) {
      return { success: false, message: 'Verification is already in progress. Please wait a moment.' };
    }
    // Same guard as login(): the SIGNED_IN listener must not call Supabase
    // while signInWithPassword still holds the auth lock.
    loginInFlightRef.current = true;
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        10000,
        'Verification timed out. Check your connection and try again.',
      );

      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          return { success: false, message: 'Invalid email or password.' };
        }
        return { success: false, message: error.message || 'Verification failed.' };
      }

      const authUser = data.user;
      const accessToken = data.session?.access_token;
      if (!authUser || !accessToken) {
        return { success: false, message: 'Verification failed. Try again.' };
      }

      const adminCheck = await fetchAdminForApkUnlock(authUser.id, accessToken);

      if (!adminCheck.row) {
        await withTimeout(
          supabase.auth.signOut({ scope: 'local' }),
          2000,
          'Sign out timed out',
        ).catch(() => undefined);
        setUser(null);
        return {
          success: false,
          message:
            adminCheck.timedOut
              ? 'Verification timed out. Check your connection and try again.'
              : adminCheck.message === 'Could not confirm admin access.'
                ? adminCheck.message
                : 'You do not have access to download the admin app.',
        };
      }

      setUser({
        id: adminCheck.row.id,
        email: adminCheck.row.email,
        name: adminCheck.row.name,
        role: adminCheck.row.role,
      });

      // Fill avatar / extras in the background — do not block the download.
      window.setTimeout(() => {
        void loadAdminUser(authUser).then((full) => {
          if (full) setUser(full);
        });
      }, 0);

      return { success: true };
    } catch (error: unknown) {
      logger.error('APK unlock error', error, { component: 'AdminContext', action: 'unlockApkDownload' });
      const message = error instanceof Error ? error.message : 'Verification failed.';
      return { success: false, message };
    } finally {
      // Clear after the deferred SIGNED_IN callback has already seen the flag.
      window.setTimeout(() => {
        loginInFlightRef.current = false;
      }, 0);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      try {
        localStorage.removeItem('phoenix_admin_remember_email');
        localStorage.removeItem('phoenix_admin_remember_password');
      } catch {
        /* ignore */
      }
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
        unlockApkDownload,
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
