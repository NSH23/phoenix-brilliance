import { Link, useLocation } from 'react-router-dom';
import { Globe, MessageCircleMore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdminWorkspace, type AdminWorkspace } from '@/lib/adminWorkspace';

const items: { id: AdminWorkspace; label: string; shortLabel: string; to: string; icon: typeof Globe }[] = [
  { id: 'website', label: 'Website', shortLabel: 'Site', to: '/admin/dashboard', icon: Globe },
  { id: 'wp', label: 'WP Agent', shortLabel: 'WP', to: '/admin/wp-dashboard', icon: MessageCircleMore },
];

export type WorkspaceSwitcherPlacement = 'default' | 'navbar';

interface AdminWorkspaceSwitcherProps {
  className?: string;
  /** @deprecated Prefer placement="navbar" for header; kept for backwards compatibility */
  dense?: boolean;
  /** `navbar`: compact control for the sticky admin header (all breakpoints). */
  placement?: WorkspaceSwitcherPlacement;
}

export default function AdminWorkspaceSwitcher({
  className,
  dense,
  placement = 'default',
}: AdminWorkspaceSwitcherProps) {
  const { pathname, search } = useLocation();
  const workspace = getAdminWorkspace(pathname, search);
  const isNavbar = placement === 'navbar' || dense;

  return (
    <div
      className={cn(
        'flex w-full rounded-xl border border-border/70 bg-muted/40 p-1 shadow-inner',
        isNavbar ? 'gap-0.5 rounded-lg border-border/60 bg-muted/50 p-0.5 shadow-sm sm:rounded-xl' : 'gap-1',
        placement === 'navbar' && 'md:max-w-[280px]',
        className
      )}
      role="navigation"
      aria-label="Admin workspace"
    >
      {items.map((item) => {
        const active = item.id === workspace;
        return (
          <Link
            key={item.id}
            to={item.to}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isNavbar
                ? 'min-h-[40px] px-2 py-2 text-xs sm:min-h-[36px] sm:px-3 sm:text-sm'
                : 'py-2.5 px-2 text-sm sm:text-base',
              active
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/70'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon
              className={cn('shrink-0', isNavbar ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4')}
              aria-hidden
            />
            <span className="tabular-nums whitespace-nowrap">
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
