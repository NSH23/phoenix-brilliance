import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ADMIN_MENU_ITEMS } from '@/lib/adminMenu';
import { getUnreadInquiriesForNotifications, getUnreadInquiriesCount, markInquiryAsRead, type Inquiry } from '@/services';
import { supabase } from '@/lib/supabase';
import { getAdminVapidPublicKey, syncAdminPushSubscription } from '@/lib/adminPush';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  // Notification State
  const [notifications, setNotifications] = useState<Inquiry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const debouncedFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
      const [list, count] = await Promise.all([
        getUnreadInquiriesForNotifications(10),
        getUnreadInquiriesCount(),
      ]);
      setNotifications(list);
      prevCountRef.current = count;
      setUnreadCount(prev => (prev === count ? prev : count));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, []);

  const upsertNotification = useCallback((row: Inquiry) => {
    setNotifications(prev => [row, ...prev.filter(i => i.id !== row.id)].slice(0, 10));
  }, []);

  const incrementUnread = useCallback(() => {
    const newCount = prevCountRef.current + 1;
    prevCountRef.current = newCount;
    setUnreadCount(prev => (prev === newCount ? prev : newCount));
  }, []);

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
    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      await syncAdminPushToServer(true);
      toast.success('Push alerts are enabled and synced.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      await syncAdminPushToServer(true);
      toast.success('Mobile alerts enabled', {
        description: 'You can receive inquiry alerts even when the admin app is fully closed (after server webhook setup).',
      });
    } else {
      toast.error('Notification permission denied.');
    }
  }, [syncAdminPushToServer]);

  // Re-sync push subscription once per session when permission already granted (refresh keys / new install).
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
    const t = window.setTimeout(run, 2000);
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

  // Real-time: new inquiries
  useEffect(() => {
    const channel = supabase
      .channel('inquiries-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, (payload) => {
        const row = payload.new as Inquiry;
        upsertNotification(row);
        incrementUnread();
        if (debouncedFetchRef.current) clearTimeout(debouncedFetchRef.current);
        debouncedFetchRef.current = setTimeout(() => {
          fetchNotifications();
        }, 1000);
        toast.success('New inquiry', {
          description: `${row.name} – ${row.event_type || 'Inquiry'}`,
          action: { label: 'View', onClick: () => navigate(`/admin/inquiries?open=${row.id}`) },
        });
      })
      .subscribe();

    return () => {
      if (debouncedFetchRef.current) clearTimeout(debouncedFetchRef.current);
      supabase.removeChannel(channel);
    };
  }, [navigate, fetchNotifications, incrementUnread, upsertNotification]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markInquiryAsRead(id);
      setNotifications(prev => prev.filter(i => i.id !== id));
      const nextCount = Math.max(0, prevCountRef.current - 1);
      prevCountRef.current = nextCount;
      setUnreadCount(prev => (prev === nextCount ? prev : nextCount));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  }, []);

  const handleNotificationsOpenChange = useCallback((open: boolean) => {
    setNotificationsOpen(open);
    if (!open) return;

    const unreadIds = notifications.filter(n => n.is_read === false).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    prevCountRef.current = Math.max(0, prevCountRef.current - unreadIds.length);
    setUnreadCount(0);
    void Promise.all(unreadIds.map((id) => markInquiryAsRead(id).catch(() => null)));
  }, [notifications]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const pushConfigured = Boolean(getAdminVapidPublicKey());

  const resyncPushSubscription = useCallback(() => {
    void syncAdminPushToServer(true);
  }, [syncAdminPushToServer]);

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
    <div className="admin-dashboard min-h-screen bg-background text-foreground">
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
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-lg border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[85vw] max-w-[320px]">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
                  <AdminSidebar mobile />
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Collapse Trigger */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 md:px-4 py-2 w-11 h-11 md:w-80 md:h-auto text-left hover:bg-muted/70 transition-colors min-w-[44px] md:min-w-0"
                >
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-sm hidden md:inline">Search...</span>
                  <kbd className="ml-auto pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
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
                      {ADMIN_MENU_ITEMS.map((item) => {
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

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Popover open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
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
                  {unreadCount > 0 && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="px-4 py-3 border-b border-border bg-muted/20 space-y-2">
                  {!pushConfigured && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                      Server push is not configured in the frontend yet. Add{' '}
                      <span className="font-mono">VITE_VAPID_PUBLIC_KEY</span> to your environment and redeploy.
                    </p>
                  )}
                  {notificationPermission !== 'granted' ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Allow notifications to get inquiry alerts on your phone like WhatsApp/Instagram (works when the admin app is closed, after the Supabase webhook is set up).
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
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        This device is registered for push. Use re-sync if you reinstalled the app or cleared site data.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={resyncPushSubscription}
                        disabled={!pushConfigured}
                      >
                        Re-sync this device
                      </Button>
                    </>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {notifications.map((inquiry) => (
                        <button
                          key={inquiry.id}
                          className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                          onClick={() => {
                            handleMarkAsRead(inquiry.id);
                            setNotificationsOpen(false);
                            navigate(`/admin/inquiries?open=${inquiry.id}`);
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{inquiry.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{inquiry.event_type || 'General Inquiry'}</p>
                            <p className="text-[10px] text-muted-foreground truncate opacity-70">{inquiry.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(inquiry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-border bg-muted/20">
                  <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => navigate('/admin/inquiries')}>
                    View all inquiries
                  </Button>
                </div>
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
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-serif font-bold text-foreground"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm md:text-base text-muted-foreground mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Page Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div >
  );
}
