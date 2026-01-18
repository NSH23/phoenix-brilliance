import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, Sparkles } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Events", href: "#events" },
  { name: "Services", href: "#services" },
  { name: "Gallery", href: "#gallery" },
  { name: "Why Us", href: "#why-us" },
  { name: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-charcoal/5 dark:shadow-charcoal/20 border-b border-primary/10"
          : "bg-gradient-to-b from-charcoal/40 to-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center
                            transition-all duration-300 group-hover:scale-105
                            ${scrolled 
                              ? 'bg-gradient-to-br from-primary to-rose-gold shadow-lg shadow-primary/20' 
                              : 'bg-primary/90 backdrop-blur-sm'}`}>
                <span className="font-serif font-bold text-primary-foreground text-lg sm:text-xl">P</span>
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-gold rounded-full" 
              />
            </div>
            <div className="flex flex-col">
              <span className={`font-serif text-base sm:text-xl font-bold transition-colors duration-300
                             ${scrolled ? 'text-foreground' : 'text-ivory'}`}>
                Phoenix
              </span>
              <span className={`text-[10px] sm:text-xs tracking-widest uppercase transition-colors duration-300
                             ${scrolled ? 'text-primary' : 'text-ivory/80'}`}>
                Events & Production
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium tracking-wide 
                          transition-all duration-300 group
                          ${scrolled 
                            ? 'text-foreground/80 hover:text-primary hover:bg-primary/5' 
                            : 'text-ivory/90 hover:text-ivory hover:bg-ivory/10'}`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full 
                               transition-all duration-300 opacity-0 group-hover:opacity-100
                               ${scrolled ? 'bg-primary' : 'bg-ivory'}`} />
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            
            <a
              href="tel:+1234567890"
              className={`hidden md:flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-full 
                        font-medium text-sm transition-all duration-300 
                        hover:shadow-lg hover:scale-105 group
                        ${scrolled 
                          ? 'bg-gradient-to-r from-primary to-rose-gold text-primary-foreground shadow-md shadow-primary/20' 
                          : 'bg-ivory/20 backdrop-blur-sm text-ivory border border-ivory/30 hover:bg-ivory/30'}`}
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
                          : 'bg-ivory/20 backdrop-blur-sm border border-ivory/30 text-ivory'}`}
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
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between py-4 px-4 rounded-xl
                             text-xl font-serif font-medium text-foreground 
                             hover:bg-primary/10 hover:text-primary transition-all duration-300
                             border-b border-border/30 group"
                  >
                    <span>{link.name}</span>
                    <span className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary 
                                   transition-colors duration-300" />
                  </motion.a>
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
                  href="tel:+1234567890"
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
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm">Creating Magical Moments</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
