import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdmin } from '@/contexts/AdminContext';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { cn } from '@/lib/utils';
import { ADMIN_MENU_ITEMS } from '@/lib/adminMenu';
import AdminUserAvatar from '@/components/admin/AdminUserAvatar';
import { supabase } from '@/lib/supabase';
import { getWpUnreadNotificationsCount } from '@/services/wpAgent';

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobile?: boolean; // New prop
}

export default function AdminSidebar({ collapsed = false, onCollapsedChange, mobile = false }: AdminSidebarProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAdmin();
  const { logoUrl } = useSiteConfig();

  const wpUnreadQuery = useQuery({
    queryKey: ['wp-unread-notifications-count'],
    queryFn: getWpUnreadNotificationsCount,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  const wpUnreadCount = wpUnreadQuery.data ?? 0;

  useEffect(() => {
    const channel = supabase
      .channel('sidebar-wp-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wp_notifications' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['wp-unread-notifications-count'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const logoSrc = logoUrl || '/logo.png';
  const sidebarWidth = collapsed ? 80 : 280;
  const showLabels = !collapsed || mobile;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const sidebarClasses = cn(
    "bg-card border-r border-border flex flex-col z-40",
    mobile ? "w-full h-full" : "fixed left-0 top-0 bottom-0"
  );

  return (
    <aside
      className={sidebarClasses}
      style={mobile ? undefined : { width: sidebarWidth, transition: 'width 0.3s ease' }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div
          className="flex items-center gap-2"
          style={{
            opacity: showLabels ? 1 : 0,
            width: showLabels ? 'auto' : 0,
            overflow: 'hidden',
            transition: 'opacity 0.2s ease, width 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <img src={logoSrc} alt="Phoenix" className="w-8 h-8 object-contain" loading="lazy" decoding="async" />
          <span className="font-serif font-bold text-lg">Phoenix Admin</span>
        </div>
        {!mobile && (
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
              "hover:bg-muted text-muted-foreground hover:text-foreground",
              collapsed && "mx-auto"
            )}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {ADMIN_MENU_ITEMS.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl transition-all duration-200",
              "hover:bg-primary/10 group",
              isActive(item.href)
                ? mobile
                  ? "border-l-4 border-primary bg-primary/10 text-primary pl-2 shadow-md"
                  : "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground",
              mobile ? "py-3 px-4 text-base" : "px-3 py-2.5"
            )}
          >
            <span className="relative inline-flex shrink-0">
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive(item.href)
                  ? mobile
                    ? "text-primary"
                    : "text-primary-foreground"
                  : "text-muted-foreground group-hover:text-primary"
              )} />
              {item.href === '/admin/notifications' && wpUnreadCount > 0 ? (
                <span
                  className={cn(
                    'absolute -top-1.5 -right-2 min-h-[16px] min-w-[16px] px-1 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground flex items-center justify-center tabular-nums',
                    isActive(item.href) && !mobile ? 'ring-2 ring-primary' : ''
                  )}
                >
                  {wpUnreadCount > 99 ? '99+' : wpUnreadCount}
                </span>
              ) : null}
            </span>
            <span
              className="font-medium whitespace-nowrap overflow-hidden"
              style={{
                opacity: showLabels ? 1 : 0,
                width: showLabels ? 'auto' : 0,
                transition: 'opacity 0.2s ease, width 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className={cn("border-t border-border", mobile ? "py-3 px-3" : "p-3")}>
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-muted/50",
          (collapsed && !mobile) && "justify-center"
        )}>
          <AdminUserAvatar avatarUrl={user?.avatar} name={user?.name} size="md" className="w-10 h-10" />
          <div
            className="flex-1 min-w-0"
            style={{
              opacity: showLabels ? 1 : 0,
              width: showLabels ? 'auto' : 0,
              overflow: 'hidden',
              transition: 'opacity 0.2s ease, width 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <p className="font-medium text-sm truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className={cn(
            "w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            mobile ? "py-3" : "py-2.5",
            (collapsed && !mobile) && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className="font-medium"
            style={{
              opacity: showLabels ? 1 : 0,
              width: showLabels ? 'auto' : 0,
              overflow: 'hidden',
              transition: 'opacity 0.2s ease, width 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
