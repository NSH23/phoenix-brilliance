import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { cn } from '@/lib/utils';
import { ADMIN_MENU_ITEMS } from '@/lib/adminMenu';
import AdminUserAvatar from '@/components/admin/AdminUserAvatar';

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobile?: boolean; // New prop
}

export default function AdminSidebar({ collapsed = false, onCollapsedChange, mobile = false }: AdminSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAdmin();
  const { logoUrl } = useSiteConfig();
  const logoSrc = logoUrl || '/logo.png';

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
    <motion.aside
      initial={false}
      animate={mobile ? undefined : { width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={sidebarClasses}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <img src={logoSrc} alt="Phoenix" className="w-8 h-8 object-contain" loading="lazy" decoding="async" />
              <span className="font-serif font-bold text-lg">Phoenix Admin</span>
            </motion.div>
          )}
        </AnimatePresence>
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
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
              "hover:bg-primary/10 group",
              isActive(item.href)
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0",
              isActive(item.href) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
            )} />
            <AnimatePresence mode="wait">
              {(!collapsed || mobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border">
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-muted/50",
          (collapsed && !mobile) && "justify-center"
        )}>
          <AdminUserAvatar avatarUrl={user?.avatar} name={user?.name} size="md" className="w-10 h-10" />
          <AnimatePresence mode="wait">
            {(!collapsed || mobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-sm truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={logout}
          className={cn(
            "w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            (collapsed && !mobile) && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || mobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
