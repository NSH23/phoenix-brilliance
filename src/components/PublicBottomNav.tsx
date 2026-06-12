import { Link, useLocation } from "react-router-dom";
import { Building2, CalendarDays, Home, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPublicBottomNavTabActive } from "@/lib/publicBottomNav";

const tabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: CalendarDays },
  { name: "Venues", href: "/venues", icon: Building2 },
  { name: "Contact", href: "/contact", icon: Mail },
] as const;

export default function PublicBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="public-bottom-nav md:hidden" aria-label="Main navigation">
      <div className="flex items-stretch justify-around gap-0.5 px-1 pt-1">
        {tabs.map((tab) => {
          const active = isPublicBottomNavTabActive(pathname, tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "public-bottom-nav-item touch-target flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-all duration-200 active:scale-95",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-2xl transition-colors duration-200",
                  active ? "bg-primary/12" : "bg-transparent",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} aria-hidden />
              </span>
              <span className="max-w-[4.5rem] truncate">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
