import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, Moon, Sun } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { ADMIN_COMMAND_PALETTE_ITEMS, getAdminWorkspace } from '@/lib/adminMenu';
import {
  getUnreadInquiriesForNotifications,
  getUnreadInquiriesCount,
  markInquiryAsRead,
  markAllInquiriesRead,
  type Inquiry,
} from '@/services';
import {
  getUnreadWpNotifications,
  getWpUnreadNotificationsCount,
  markWpNotificationRead,
  markAllWpNotificationsRead,
  type WpNotification,
} from '@/services/wpAgent';
import { formatRelativeTime } from '@/lib/formatDate';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { getAdminVapidPublicKey, syncAdminPushSubscription } from '@/lib/adminPush';
import { toast } from 'sonner';
import AdminWorkspaceSwitcher from '@/components/admin/AdminWorkspaceSwitcher';
import AdminBottomNav from '@/components/admin/AdminBottomNav';
import { adminPageSubtitleClass, adminPageTitleClass } from '@/components/admin/adminStyles';
import { applyAdminTheme, getStoredAdminTheme, setStoredAdminTheme } from '@/lib/adminTheme';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Optional back link rendered above the title, aligned left. */
  headerBack?: React.ReactNode;
  /** Optional actions beside the page title (e.g. Save, settings). */
  headerActions?: React.ReactNode;
}

const WP_UNREAD_QUERY_KEY = ['wp-unread-notifications-count'] as const;

export default function AdminLayout({ children, title, subtitle, headerBack, headerActions }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const workspace = getAdminWorkspace(pathname, search);
  const { logoUrl } = useSiteConfig();
  const logoSrc = logoUrl || '/logo.png';
  const dashboardHref = workspace === 'wp' ? '/admin/wp-dashboard' : '/admin/dashboard';
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [darkMode, setDarkMode] = useState(() => getStoredAdminTheme() === 'dark');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  // Notification State
  const [notifications, setNotifications] = useState<Inquiry[]>([]);
  const [wpNotifications, setWpNotifications] = useState<WpNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const debouncedFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const toastedInquiryIdsRef = useRef<Set<string>>(new Set());
  const notificationsPanelOpenRef = useRef(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const theme = getStoredAdminTheme();
    setDarkMode(theme === 'dark');
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/admin-notifications-sw.js');
        if (!cancelled) swRegistrationRef.current = registration;
      } catch (error) {
        console.warn('Admin notification service worker registration failed', error);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => {
        void register();
      }, { timeout: 1500 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const timeout = window.setTimeout(() => {
      void register();
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [list, count, wpList, wpUnreadTotal] = await Promise.all([
        getUnreadInquiriesForNotifications(8),
        getUnreadInquiriesCount(),
        getUnreadWpNotifications(8),
        queryClient.ensureQueryData({
          queryKey: WP_UNREAD_QUERY_KEY,
          queryFn: getWpUnreadNotificationsCount,
          staleTime: 30_000,
        }),
      ]);
      // While the panel is open we've already cleared the badge — don't put it back.
      if (notificationsPanelOpenRef.current) {
        setNotifications((list || []).slice(0, 8));
        setWpNotifications((wpList || []).slice(0, 8));
        prevCountRef.current = 0;
        setUnreadCount(0);
        return;
      }
      setNotifications((list || []).slice(0, 8));
      setWpNotifications((wpList || []).slice(0, 8));
      const totalUnread = count + wpUnreadTotal;
      prevCountRef.current = totalUnread;
      setUnreadCount((prev) => (prev === totalUnread ? prev : totalUnread));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, [queryClient]);

  const upsertNotification = useCallback((row: Inquiry) => {
    setNotifications((prev) => [row, ...prev.filter((i) => i.id !== row.id)].slice(0, 8));
  }, []);

  /** Prefer DB count via debounced fetch — avoid local +1 drift that inflates the badge. */
  const scheduleNotificationRefresh = useCallback(() => {
    if (debouncedFetchRef.current) clearTimeout(debouncedFetchRef.current);
    debouncedFetchRef.current = setTimeout(() => {
      void fetchNotifications();
      void queryClient.invalidateQueries({ queryKey: WP_UNREAD_QUERY_KEY });
    }, 600);
  }, [fetchNotifications, queryClient]);

  const syncAdminPushToServer = useCallback(
    async (showErrorToast: boolean) => {
      if (!getAdminVapidPublicKey()) return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (Notification.permission !== 'granted') return;
      try {
        const reg = swRegistrationRef.current ?? (await navigator.serviceWorker.ready);
        swRegistrationRef.current = reg;
        const result = await syncAdminPushSubscription(supabase, reg);
        if (!result.ok && showErrorToast) {
          toast.error('Could not enable server push', { description: result.message });
        }
      } catch (e) {
        if (showErrorToast) {
          toast.error('Could not enable server push', {
            description: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }
    },
    []
  );

  const requestBrowserNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported on this device/browser.');
      return;
    }
    if (!getAdminVapidPublicKey()) {
      toast.error('Push is not configured', {
        description: 'Add VITE_VAPID_PUBLIC_KEY to your hosting environment, then redeploy.',
      });
      return;
    }
    // Already blocked in browser settings — requestPermission() will not show a prompt again.
    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      toast.message('Notifications are blocked', {
        description:
          'Open your browser site settings → Notifications → Allow, then reload this page.',
      });
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      await syncAdminPushToServer(false);
      toast.success('Push alerts are enabled.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        await syncAdminPushToServer(false);
        toast.success('Mobile alerts enabled');
      } else if (permission === 'denied') {
        toast.message('Notifications blocked', {
          description: 'Allow notifications in browser settings for this site, then reload.',
        });
      }
    } catch (e) {
      console.warn('Notification permission request failed', e);
      toast.message('Could not ask for notification permission', {
        description: e instanceof Error ? e.message : 'Try again from the live HTTPS admin site / PWA.',
      });
    }
  }, [syncAdminPushToServer]);

  // Auto re-sync push subscription when permission is already granted (silent).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!getAdminVapidPublicKey()) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const run = () => {
      void syncAdminPushToServer(false);
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 1500);
    return () => window.clearTimeout(t);
  }, [syncAdminPushToServer]);

  // Defer notifications so layout paints immediately; fetch after first paint.
  // Debounce by 500ms to avoid bursts causing repeated layout work.
  useEffect(() => {
    let timeoutId: number | undefined;

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(() => {
        timeoutId = window.setTimeout(fetchNotifications, 500);
      }, { timeout: 500 });

      return () => {
        cancelIdleCallback(idleId);
        if (timeoutId) window.clearTimeout(timeoutId);
      };
    }

    timeoutId = window.setTimeout(fetchNotifications, 500);
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [fetchNotifications]);

  // Real-time: WP notifications (bell count + dropdown + toast)
  useEffect(() => {
    const channel = supabase
      .channel('wp-notifications-layout')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wp_notifications' }, (payload) => {
        const row = payload.new as WpNotification;
        if (row.is_read) return;
        setWpNotifications((prev) => [row, ...prev.filter((n) => n.id !== row.id)].slice(0, 8));
        scheduleNotificationRefresh();
        const label = row.lead_name || row.lead_phone || 'Lead';
        toast.message('WP alert', {
          description: row.message || label,
          action: row.lead_phone
            ? {
                label: 'Open',
                onClick: () =>
                  navigate(
                    `/admin/notifications?tab=wp&leadPhone=${encodeURIComponent(row.lead_phone!)}`
                  ),
              }
            : undefined,
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wp_notifications' }, () => {
        scheduleNotificationRefresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [scheduleNotificationRefresh, navigate]);

  // Real-time: new inquiries → toast + panel (count from DB refresh only)
  useEffect(() => {
    const channel = supabase
      .channel('inquiries-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, (payload) => {
        const row = payload.new as Inquiry;
        if (row.is_read) return;
        upsertNotification(row);
        scheduleNotificationRefresh();
        const accessToken = (row as Inquiry & { access_token?: string | null }).access_token;
        // Access OTPs get a dedicated toast from site_access_requests insert (with deep link).
        if (accessToken) return;
        if (!toastedInquiryIdsRef.current.has(row.id)) {
          toastedInquiryIdsRef.current.add(row.id);
          if (toastedInquiryIdsRef.current.size > 40) {
            const keep = [...toastedInquiryIdsRef.current].slice(-20);
            toastedInquiryIdsRef.current = new Set(keep);
          }
          toast.success('New inquiry', {
            description: `${row.name}${row.event_type ? ` – ${row.event_type}` : ''}`,
            action: {
              label: 'View',
              onClick: () => navigate(`/admin/notifications?tab=inquiries&open=${row.id}`),
            },
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inquiries' }, () => {
        scheduleNotificationRefresh();
      })
      .subscribe();

    return () => {
      if (debouncedFetchRef.current) clearTimeout(debouncedFetchRef.current);
      void supabase.removeChannel(channel);
    };
  }, [navigate, scheduleNotificationRefresh, upsertNotification]);

  // Real-time: access OTP requests (dashboard Send OTP)
  useEffect(() => {
    const channel = supabase
      .channel('site-access-otp-layout')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'site_access_requests' },
        (payload) => {
          const row = payload.new as {
            id: string;
            visitor_name?: string | null;
            event_type?: string | null;
            inquiry_id?: string | null;
          };
          scheduleNotificationRefresh();
          if (toastedInquiryIdsRef.current.has(`access-${row.id}`)) return;
          toastedInquiryIdsRef.current.add(`access-${row.id}`);
          toast.success('New access request', {
            description: `${row.visitor_name || 'Guest'}${row.event_type ? ` – ${row.event_type}` : ''}`,
            action: {
              label: 'Send OTP',
              onClick: () => navigate(`/admin/dashboard?otp=${row.id}`),
            },
          });
          if (row.inquiry_id) {
            upsertNotification({
              id: row.inquiry_id,
              name: row.visitor_name || 'Guest',
              email: '',
              phone: null,
              event_type: row.event_type || null,
              message: 'Access OTP',
              status: 'new',
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_read: false,
              access_token: 'pending',
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [navigate, scheduleNotificationRefresh, upsertNotification]);

  const handleMarkInquiryRead = useCallback(async (id: string) => {
    try {
      await markInquiryAsRead(id);
      setNotifications((prev) => prev.filter((i) => i.id !== id));
      const nextCount = Math.max(0, prevCountRef.current - 1);
      prevCountRef.current = nextCount;
      setUnreadCount((prev) => (prev === nextCount ? prev : nextCount));
    } catch (e) {
      console.error('Failed to mark inquiry as read', e);
      toast.error('Could not mark inquiry as read');
    }
  }, []);

  const handleMarkWpRead = useCallback(
    async (id: string) => {
      try {
        await markWpNotificationRead(id);
        setWpNotifications((prev) => prev.filter((n) => n.id !== id));
        const nextCount = Math.max(0, prevCountRef.current - 1);
        prevCountRef.current = nextCount;
        setUnreadCount((prev) => (prev === nextCount ? prev : nextCount));
        void queryClient.invalidateQueries({ queryKey: WP_UNREAD_QUERY_KEY });
      } catch (e) {
        console.error('Failed to mark WP notification as read', e);
        toast.error('Could not mark alert as read');
      }
    },
    [queryClient]
  );

  const onNotificationsOpenChange = useCallback(
    (open: boolean) => {
      setNotificationsOpen(open);
      notificationsPanelOpenRef.current = open;

      if (!open) {
        setNotifications([]);
        setWpNotifications([]);
        // Refresh true unread count after closing (should be 0 if mark-all succeeded).
        void fetchNotifications();
        return;
      }

      // Clear badge immediately so the number disappears as soon as you open.
      prevCountRef.current = 0;
      setUnreadCount(0);

      void (async () => {
        try {
          setMarkAllBusy(true);
          const [list, wpList] = await Promise.all([
            getUnreadInquiriesForNotifications(8),
            getUnreadWpNotifications(8),
          ]);
          setNotifications((list || []).slice(0, 8));
          setWpNotifications((wpList || []).slice(0, 8));

          // Mark ALL unread in DB (not just the 8 shown) so the badge stays clear.
          await Promise.all([markAllInquiriesRead(), markAllWpNotificationsRead()]);
          prevCountRef.current = 0;
          setUnreadCount(0);
          void queryClient.invalidateQueries({ queryKey: WP_UNREAD_QUERY_KEY });
        } catch (e) {
          console.error('Failed to open/mark notifications', e);
        } finally {
          setMarkAllBusy(false);
        }
      })();

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void syncAdminPushToServer(false);
      }
    },
    [fetchNotifications, queryClient, syncAdminPushToServer],
  );

  const combinedNotifications = useMemo(() => {
    const inquiryItems = notifications.map((n) => {
      const isAccess = Boolean((n as Inquiry & { access_token?: string | null }).access_token);
      return {
        id: n.id,
        kind: 'inquiry' as const,
        isAccess,
        title: n.name,
        subtitle: isAccess ? 'Access OTP · tap to send' : n.event_type || 'General Inquiry',
        message: n.message,
        createdAt: n.created_at,
        isRead: n.is_read ?? false,
        leadPhone: null as string | null,
      };
    });
    const wpItems = wpNotifications.map((n) => ({
      id: n.id,
      kind: 'wp' as const,
      isAccess: false,
      title: n.lead_name || 'WP Alert',
      subtitle: `${n.type} • ${n.priority}`,
      message: n.message,
      createdAt: n.created_at,
      isRead: n.is_read,
      leadPhone: n.lead_phone,
    }));
    return [...inquiryItems, ...wpItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [notifications, wpNotifications]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    const theme = next ? 'dark' : 'light';
    setStoredAdminTheme(theme);
    applyAdminTheme(theme);
  };

  const pushConfigured = Boolean(getAdminVapidPublicKey());

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="admin-dashboard admin-shell-bg min-h-screen text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280) }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {/* Top Header — workspace switcher centered on laptop; full-width row under tools on small screens */}
        <header className="admin-glass-header sticky top-0 z-30 border-b pt-[env(safe-area-inset-top,0px)]">
          <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-2 gap-y-2 px-3 py-2 sm:px-4 md:px-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,280px)_auto] md:grid-rows-1 md:items-center md:gap-4 md:py-0 md:min-h-16">
            <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:gap-3 md:max-w-2xl">
            {/* Mobile menu — also available from bottom nav */}
            <div className="hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button type="button" className="touch-target flex items-center justify-center rounded-xl hover:bg-muted/80">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(88vw,320px)] p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
                  <AdminSidebar mobile />
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Collapse Trigger */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex w-10 h-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={dashboardHref}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-muted/60 md:h-10 md:w-10"
              aria-label="Admin home"
            >
              <img
                src={logoSrc}
                alt="Phoenix"
                className="h-8 w-8 object-contain drop-shadow-sm md:h-9 md:w-9"
                loading="lazy"
                decoding="async"
              />
            </Link>

            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-3 text-left transition-colors hover:bg-muted/70 h-10 max-w-[9.5rem] sm:max-w-[11rem] md:h-9 md:max-w-[12rem]'
                  )}
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm">Search…</span>
                  <kbd className="hidden h-5 shrink-0 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-flex">
                    <span>⌘</span>K
                  </kbd>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search pages..." />
                  <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup heading="Admin">
                      {ADMIN_COMMAND_PALETTE_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <CommandItem
                            key={item.href}
                            value={`${item.name} ${item.keywords ?? ''}`}
                            onSelect={() => {
                              navigate(item.href);
                              setSearchOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            </div>

            <div className="col-span-2 row-start-2 flex justify-center px-1 sm:px-2 md:col-span-1 md:col-start-2 md:row-start-1 md:px-0">
              <AdminWorkspaceSwitcher placement="navbar" className="w-full max-w-[280px]" />
            </div>

            <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:col-start-3 md:row-start-1 md:justify-end">
            {/* Notifications */}
            <Popover open={notificationsOpen} onOpenChange={onNotificationsOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl max-md:h-11 max-md:w-11 max-md:min-h-[44px] max-md:min-w-[44px]"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-1rem)] max-w-sm p-0 md:w-80 md:mr-4" align="end">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {markAllBusy ? (
                    <span className="text-[10px] text-muted-foreground">Clearing…</span>
                  ) : null}
                </div>
                <div className="px-4 py-3 border-b border-border bg-muted/20 space-y-2">
                  {!pushConfigured && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                      Server push is not configured yet. Add{' '}
                      <span className="font-mono">VITE_VAPID_PUBLIC_KEY</span> on Vercel, then redeploy.
                    </p>
                  )}
                  {notificationPermission === 'granted' ? (
                    <p className="text-xs text-muted-foreground">
                      Phone alerts are on. This device syncs automatically in the background.
                    </p>
                  ) : notificationPermission === 'denied' ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Notifications are blocked in browser settings. Allow them for this site, reload, then tap Enable.
                      </p>
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={requestBrowserNotificationPermission}
                        disabled={!pushConfigured}
                      >
                        Check permission again
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Allow notifications to get inquiry alerts on your phone when the admin app is closed.
                      </p>
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={requestBrowserNotificationPermission}
                        disabled={notificationPermission === 'unsupported' || !pushConfigured}
                      >
                        {notificationPermission === 'unsupported'
                          ? 'Not supported on this browser'
                          : 'Enable mobile alerts'}
                      </Button>
                    </>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {combinedNotifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No unread notifications</p>
                      <p className="text-xs mt-1 opacity-70">You&apos;re all caught up.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {combinedNotifications.map((item) => (
                        <button
                          key={`${item.kind}-${item.id}`}
                          className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            if (item.kind === 'inquiry') {
                              void handleMarkInquiryRead(item.id);
                            } else {
                              void handleMarkWpRead(item.id);
                            }
                            navigate(
                              item.kind === 'inquiry'
                                ? item.isAccess
                                  ? '/admin/dashboard'
                                  : `/admin/notifications?tab=inquiries&open=${item.id}`
                                : `/admin/notifications?tab=wp${item.leadPhone ? `&leadPhone=${encodeURIComponent(item.leadPhone)}` : ''}`
                            );
                          }}
                        >
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--admin-accent))]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase text-muted-foreground">
                              {item.kind === 'inquiry' ? (item.isAccess ? 'Access OTP' : 'Inquiry') : 'WP Alert'}
                            </p>
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatRelativeTime(item.createdAt)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <motion.div className="p-2 border-t border-border bg-muted/20">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/admin/notifications');
                    }}
                  >
                    View all notifications
                  </Button>
                </motion.div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-xl max-md:h-11 max-md:w-11 max-md:min-h-[44px] max-md:min-w-[44px]"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-animate-in mx-auto w-full max-w-7xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-8 md:pb-6 md:pt-6">
          <div className="mb-5 md:mb-8">
            {headerBack ? (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 }}
                className="mb-3 flex justify-start"
              >
                {headerBack}
              </motion.div>
            ) : null}
            <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 basis-0 min-[0px]">
              <motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={adminPageTitleClass}
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className={adminPageSubtitleClass}
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
            {headerActions ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="flex shrink-0 flex-wrap items-center justify-end gap-2 max-md:ml-auto"
              >
                {headerActions}
              </motion.div>
            ) : null}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            className="space-y-5 md:space-y-6"
          >
            {children}
          </motion.div>
        </main>

        <AdminBottomNav />
      </motion.div>
    </div >
  );
}
