import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getPublicNavLinks } from "@/lib/publicGallery";
import { getActivePublicTheme, subscribePublicTheme, type PublicTheme } from "@/lib/publicTheme";

export default function Navbar() {
  const navLinks = getPublicNavLinks();
  const { contact, logoUrl } = useSiteConfig();
  const logoSrc = logoUrl || '/logo.png';
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [publicTheme, setPublicTheme] = useState<PublicTheme>("light");
  const isDark = publicTheme === "dark";
  const isSoftLight = publicTheme === "blush" || publicTheme === "lavender";
  const [showDesktopNumber, setShowDesktopNumber] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setPublicTheme(getActivePublicTheme());
    return subscribePublicTheme(setPublicTheme);
  }, []);

  useEffect(() => {
    const SCROLL_THRESHOLD = 10;
    const TOP_THRESHOLD = 100;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 50);

      if (currentScrollY <= TOP_THRESHOLD) {
        setIsVisible(true);
      } else {
        if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > SCROLL_THRESHOLD) {
          setIsVisible(false);
        } else if (lastScrollY.current - currentScrollY > SCROLL_THRESHOLD) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-out ${scrolled
        ? isDark
          ? "bg-background/75 backdrop-blur-[16px] backdrop-saturate-[180%] border-b border-primary/20 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          : "bg-background/95 backdrop-blur-[12px] border-b border-border shadow-[0_4px_20px_rgba(62,39,35,0.08)]"
        : isDark
          ? "bg-background/60 backdrop-blur-[12px] backdrop-saturate-[180%] border-b border-primary/15 shadow-sm"
          : "bg-background/90 backdrop-blur-[8px] border-b border-border/80"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5 sm:gap-3"
          >
            <div className="relative shrink-0">
              <OptimizedImage
                src={logoSrc}
                alt="Phoenix Events & Production Logo"
                preset="thumb"
                responsive={false}
                className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-0.5 border-l border-primary/15 pl-2.5 sm:gap-1 sm:pl-3">
              <span className="font-display text-[1.28rem] font-medium leading-[0.95] tracking-[-0.03em] text-foreground transition-colors duration-300 sm:text-[1.55rem]">
                Phoenix
              </span>
              <span className="whitespace-nowrap font-brand text-[0.625rem] font-semibold uppercase leading-none tracking-[0.14em] text-primary sm:text-[0.6875rem] sm:tracking-[0.2em]">
                Events & Production
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium font-sans tracking-[0.02em] 
                            transition-all duration-300 group
                            ${scrolled
                    ? isDark
                      ? 'text-[rgba(255,255,255,0.75)] hover:text-primary hover:bg-primary/10'
                      : 'text-[rgba(62,39,35,0.75)] hover:text-primary hover:bg-primary/5'
                    : isDark
                      ? 'text-[rgba(255,255,255,0.75)] hover:text-primary hover:bg-primary/10'
                      : 'text-[rgba(62,39,35,0.75)] hover:text-primary hover:bg-primary/5'}`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full 
                                 transition-all duration-300 opacity-0 group-hover:opacity-100
                                 ${scrolled ? 'bg-primary' : 'bg-primary dark:bg-ivory'}`} />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setShowDesktopNumber(true)}
              className={`hidden md:flex items-center gap-2 px-7 py-3 rounded-[30px] 
                        font-medium text-sm font-sans tracking-[0.02em] transition-all duration-300 
                        ${isDark
                  ? 'bg-gradient-to-r from-primary to-rose-gold text-primary-foreground shadow-lg shadow-primary/30'
                  : isSoftLight
                    ? 'border-2 border-primary bg-card text-primary shadow-md shadow-primary/10 hover:bg-primary/10'
                    : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90'}`}
            >
              <Phone className="w-4 h-4" />
              <span>{showDesktopNumber ? contact.phone : "Contact"}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
