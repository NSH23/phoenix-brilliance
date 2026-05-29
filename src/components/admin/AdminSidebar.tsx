import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/contexts/AdminContext';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { cn } from '@/lib/utils';
import { ADMIN_WEBSITE_MENU_ITEMS, ADMIN_WP_MENU_ITEMS, getAdminWorkspace } from '@/lib/adminMenu';
import { filterMenuItemsForMobileOverflow } from '@/lib/adminMobileNav';
import AdminUserAvatar from '@/components/admin/AdminUserAvatar';
import AdminBrand from '@/components/admin/AdminBrand';
import { getWpUnreadNotificationsCount } from '@/services/wpAgent';

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobile?: boolean;
  /** Mobile bottom bar overflow sheet: only links not already on the tab bar. */
  mobileOverflowMenu?: boolean;
}

export default function AdminSidebar({
  collapsed = false,
  onCollapsedChange,
  mobile = false,
  mobileOverflowMenu = false,
}: AdminSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAdmin();
  const { logoUrl } = useSiteConfig();
  const workspace = getAdminWorkspace(location.pathname, location.search);
  const allMenuItems = workspace === 'wp' ? ADMIN_WP_MENU_ITEMS : ADMIN_WEBSITE_MENU_ITEMS;
  const menuItems = mobileOverflowMenu
    ? filterMenuItemsForMobileOverflow(allMenuItems, workspace)
    : allMenuItems;

  const wpUnreadQuery = useQuery({
    queryKey: ['wp-unread-notifications-count'],
    queryFn: getWpUnreadNotificationsCount,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  const wpUnreadCount = wpUnreadQuery.data ?? 0;

  const logoSrc = logoUrl || '/logo.png';
  const sidebarWidth = collapsed ? 80 : 280;
  const showLabels = !collapsed || mobile;

  const isActive = (path: string) => {
    if (path === '/admin/wp-alerts') {
      return (
        location.pathname === '/admin/wp-alerts' ||
        (location.pathname === '/admin/notifications' && location.search.includes('tab=wp'))
      );
    }
    const [pathOnly, query] = path.split('?');
    const base = pathOnly || path;
    if (base === '/admin') {
      return location.pathname === '/admin';
    }
    if (query) {
      return location.pathname === base && location.search.includes(query);
    }
    return location.pathname === base || location.pathname.startsWith(`${base}/`);
  };

  const sidebarClasses = cn(
    'admin-glass-sidebar flex flex-col z-40 border-r',
    mobile ? 'h-full w-full bg-card' : 'fixed left-0 top-0 bottom-0'
  );

  return (
    <aside
      className={sidebarClasses}
      style={mobile ? undefined : { width: sidebarWidth, transition: 'width 0.3s ease' }}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/80 px-4">
        <div
          className="flex min-w-0 items-center gap-2.5"
          style={{
            opacity: showLabels ? 1 : 0,
            width: showLabels ? 'auto' : 0,
            overflow: 'hidden',
            transition: 'opacity 0.2s ease, width 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <img
            src={logoSrc}
            alt="Phoenix"
            className="h-9 w-9 shrink-0 object-contain drop-shadow-sm"
            loading="lazy"
            decoding="async"
          />
          <AdminBrand workspace={workspace} size="sm" showTagline={false} />
        </div>
        {!mobile && (
          <button
            type="button"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
          </button>
        )}
      </div>

      {showLabels && (
        <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {mobileOverflowMenu
            ? 'More'
            : workspace === 'wp'
              ? 'WP Agent'
              : 'Website'}
        </p>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {menuItems.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            All sections are on the bar below.
          </p>
        ) : null}
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                active
                  ? 'admin-nav-link-active shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                mobile && 'min-h-[48px] py-3 text-base'
              )}
            >
              <span className="relative inline-flex shrink-0">
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {(item.href === '/admin/notifications' || item.href.startsWith('/admin/wp-alerts')) &&
                wpUnreadCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums text-destructive-foreground">
                    {wpUnreadCount > 99 ? '99+' : wpUnreadCount}
                  </span>
                ) : null}
              </span>
              <span
                className="overflow-hidden whitespace-nowrap"
                style={{
                  opacity: showLabels ? 1 : 0,
                  width: showLabels ? 'auto' : 0,
                  transition: 'opacity 0.2s ease, width 0.2s ease',
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={cn('border-t border-border/80', mobile ? 'px-3 py-3' : 'p-3')}>
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl bg-muted/50 p-3',
            collapsed && !mobile && 'justify-center'
          )}
        >
          <AdminUserAvatar avatarUrl={user?.avatar} name={user?.name} size="md" className="h-10 w-10" />
          <div
            className="min-w-0 flex-1"
            style={{
              opacity: showLabels ? 1 : 0,
              width: showLabels ? 'auto' : 0,
              overflow: 'hidden',
              transition: 'opacity 0.2s ease, width 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className={cn(
            'mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]',
            mobile && 'min-h-[48px]',
            collapsed && !mobile && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
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
