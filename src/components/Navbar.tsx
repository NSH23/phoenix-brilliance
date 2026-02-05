import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "Services", href: "/services" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const { contact } = useSiteConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const lastScrollY = useRef(0);
  
  // Detect dark theme
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Track scroll position for styling and hide/show behavior
  useEffect(() => {
    const SCROLL_THRESHOLD = 10; // Minimum scroll distance to trigger hide/show
    const TOP_THRESHOLD = 100; // Show navbar when near top

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state for styling
      setScrolled(currentScrollY > 50);

      // Always show navbar when near top or menu is open
      if (currentScrollY <= TOP_THRESHOLD || isOpen) {
        setIsVisible(true);
      } else {
        // Determine scroll direction
        if (currentScrollY > lastScrollY.current && currentScrollY - lastScrollY.current > SCROLL_THRESHOLD) {
          // Scrolling down - hide navbar
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current && lastScrollY.current - currentScrollY > SCROLL_THRESHOLD) {
          // Scrolling up - show navbar
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? isDark
            ? "bg-[rgba(26,26,46,0.8)] backdrop-blur-[16px] backdrop-saturate-[180%] border-b border-[rgba(212,175,55,0.18)] shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_1px_rgba(212,175,55,0.2)]"
            : "bg-[rgba(255,255,255,0.75)] backdrop-blur-[16px] backdrop-saturate-[180%] border-b border-[rgba(212,175,55,0.12)] shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)]"
          : isDark
            ? "bg-[rgba(26,26,46,0.6)] backdrop-blur-[12px] backdrop-saturate-[180%] border-b border-[rgba(212,175,55,0.15)] shadow-sm"
            : "bg-[rgba(255,255,255,0.6)] backdrop-blur-[12px] backdrop-saturate-[180%] border-b border-[rgba(212,175,55,0.1)] shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Phoenix Events & Production Logo" 
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain transition-all duration-300 group-hover:scale-105 opacity-100"
              />
            </div>
            <div className="flex flex-col">
              <span className={`font-serif text-base sm:text-xl font-bold transition-colors duration-300
                             ${scrolled 
                               ? isDark 
                                 ? 'text-white' 
                                 : 'text-[#1A1A2E]'
                               : isDark 
                                 ? 'text-white' 
                                 : 'text-[#1A1A2E]'}`}>
                Phoenix
              </span>
              <span className={`text-[10px] sm:text-xs tracking-widest uppercase transition-colors duration-300
                             ${scrolled 
                               ? isDark 
                                 ? 'text-[#D4AF37]' 
                                 : 'text-[#D4AF37]'
                               : isDark 
                                 ? 'text-[#D4AF37]' 
                                 : 'text-[#D4AF37]'}`}>
                Events & Production
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium tracking-wide 
                            transition-all duration-300 group
                            ${scrolled 
                              ? isDark
                                ? 'text-[rgba(255,255,255,0.75)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.1)]'
                                : 'text-[rgba(62,39,35,0.75)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.05)]'
                              : isDark
                                ? 'text-[rgba(255,255,255,0.75)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.1)]'
                                : 'text-[rgba(62,39,35,0.75)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.05)]'}`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full 
                                 transition-all duration-300 opacity-0 group-hover:opacity-100
                                 ${scrolled ? 'bg-primary' : 'bg-primary dark:bg-ivory'}`} />
                </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            
            <a
              href={`tel:${contact.phone.replace(/\s/g, '')}`}
              className={`hidden md:flex items-center gap-2 px-7 py-3 rounded-[30px] 
                        font-semibold text-sm tracking-[0.5px] transition-all duration-300 
                        hover:scale-105 group
                        ${scrolled 
                          ? isDark
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#C29D43] text-[#1A1A2E] shadow-[0_4px_16px_rgba(212,175,55,0.4),0_0_20px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(212,175,55,0.5),0_0_30px_rgba(212,175,55,0.3)]'
                            : 'bg-gradient-to-r from-[#D4AF37] to-[#C29D43] text-[#1A1A2E] shadow-[0_4px_14px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.35)]'
                          : isDark
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#C29D43] text-[#1A1A2E] shadow-[0_4px_16px_rgba(212,175,55,0.4),0_0_20px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(212,175,55,0.5),0_0_30px_rgba(212,175,55,0.3)]'
                            : 'bg-gradient-to-r from-[#D4AF37] to-[#C29D43] text-[#1A1A2E] shadow-[0_4px_14px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.35)]'}`}
            >
              <Phone className="w-4 h-4 group-hover:animate-pulse" />
              <span>Get Quote</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-full 
                        transition-all duration-300
                        ${scrolled 
                          ? 'bg-muted border border-border hover:bg-primary hover:text-primary-foreground' 
                          : 'bg-primary/20 backdrop-blur-sm border border-primary/30 text-foreground dark:bg-ivory/20 dark:border-ivory/30 dark:text-ivory'}`}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 top-16 sm:top-20 z-40"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/98 backdrop-blur-xl" />
            
            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative h-full flex flex-col px-6 py-8 overflow-y-auto"
            >
              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-0 w-32 h-32 bg-rose-gold/10 rounded-full blur-3xl" />
              
              {/* Navigation Links */}
              <nav className="flex flex-col gap-2 relative">
                {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-4 px-4 rounded-xl
                                 text-xl font-serif font-medium text-foreground 
                                 hover:bg-primary/10 hover:text-primary transition-all duration-300
                                 border-b border-border/30 group"
                      >
                        <span>{link.name}</span>
                        <span className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary 
                                       transition-colors duration-300" />
                      </Link>
                    </motion.div>
                ))}
              </nav>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="mt-8"
              >
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 
                           bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                           rounded-2xl font-semibold text-lg shadow-xl shadow-primary/30
                           hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  <Phone className="w-5 h-5" />
                  <span>Get a Quote</span>
                </a>
              </motion.div>

              {/* Brand Footer in Menu */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mt-auto pt-8 flex items-center justify-center gap-2 text-muted-foreground"
              >
                <img src="/logo.png" alt="Phoenix" className="w-6 h-6 object-contain" />
                <span className="text-sm">Creating Magical Moments</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
