import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Images, Mail, Menu, MessageCircleMore, ChartColumn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdminWorkspace } from '@/lib/adminMenu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import AdminSidebar from '@/components/admin/AdminSidebar';

const websiteTabs = [
  { name: 'Home', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Gallery', href: '/admin/gallery', icon: Images },
  { name: 'Alerts', href: '/admin/notifications', icon: Mail },
] as const;

const wpTabs = [
  { name: 'Home', href: '/admin/wp-dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/admin/wp-leads', icon: MessageCircleMore },
  { name: 'Alerts', href: '/admin/wp-alerts', icon: Mail },
  { name: 'Stats', href: '/admin/wp-analytics', icon: ChartColumn },
] as const;

function isTabActive(pathname: string, search: string, href: string): boolean {
  if (href === '/admin/wp-alerts') {
    return (
      pathname === '/admin/wp-alerts' ||
      (pathname === '/admin/notifications' && search.includes('tab=wp'))
    );
  }
  if (href === '/admin/notifications') {
    return pathname === '/admin/notifications' && !search.includes('tab=wp');
  }
  const base = href.split('?')[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function AdminBottomNav() {
  const { pathname, search } = useLocation();
  const workspace = getAdminWorkspace(pathname, search);
  const tabs = workspace === 'wp' ? wpTabs : websiteTabs;

  return (
    <nav
      className="admin-bottom-nav md:hidden"
      aria-label="Admin quick navigation"
    >
      <div className="flex items-stretch justify-around gap-0.5 px-1 pt-1">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, search, tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'admin-bottom-nav-item touch-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <tab.icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} aria-hidden />
              <span className="truncate max-w-[4.5rem]">{tab.name}</span>
            </Link>
          );
        })}

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="admin-bottom-nav-item touch-target flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors active:scale-95"
            >
              <Menu className="h-5 w-5" aria-hidden />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,320px)] p-0 border-r border-border/80">
            <SheetTitle className="sr-only">Admin menu</SheetTitle>
            <SheetDescription className="sr-only">More admin pages</SheetDescription>
            <AdminSidebar mobile mobileOverflowMenu />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
