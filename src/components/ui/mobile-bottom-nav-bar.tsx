import { Link, useLocation } from "react-router-dom";
import { LayoutGroup, motion } from "framer-motion";
import { Building2, CalendarDays, Home, Mail, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPublicBottomNavTabActive } from "@/lib/publicBottomNav";

const tabs: ReadonlyArray<{ name: string; href: string; icon: LucideIcon }> = [
  { name: "Home", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: CalendarDays },
  { name: "Venues", href: "/venues", icon: Building2 },
  { name: "Contact", href: "/contact", icon: Mail },
];

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

export function MobileBottomNavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="public-mobile-dock-nav md:hidden" aria-label="Main navigation">
      <div className="public-mobile-dock-nav__shell">
        <LayoutGroup id="public-mobile-dock">
          <div className="public-mobile-dock-nav__track" role="list">
            {tabs.map((tab) => {
              const active = isPublicBottomNavTabActive(pathname, tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  role="listitem"
                  className={cn("public-mobile-dock-nav__tab touch-target", active && "is-active")}
                  aria-current={active ? "page" : undefined}
                  aria-label={active ? `${tab.name}, current page` : tab.name}
                >
                  {active ? (
                    <motion.span
                      layoutId="public-mobile-dock-pill"
                      className="public-mobile-dock-nav__pill"
                      transition={spring}
                    />
                  ) : null}

                  <span className="public-mobile-dock-nav__content">
                    <Icon
                      className={cn("public-mobile-dock-nav__icon", active && "is-active")}
                      strokeWidth={active ? 2.35 : 1.85}
                      aria-hidden
                    />
                    <motion.span
                      className="public-mobile-dock-nav__label"
                      initial={false}
                      animate={{
                        width: active ? "auto" : 0,
                        opacity: active ? 1 : 0,
                        marginLeft: active ? 6 : 0,
                      }}
                      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                    >
                      {tab.name}
                    </motion.span>
                  </span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
}

export default MobileBottomNavBar;
