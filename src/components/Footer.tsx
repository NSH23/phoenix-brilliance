import { motion } from "framer-motion";
import { Heart, Instagram, Facebook, Youtube, ArrowUp, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const SOCIAL_ICONS: { key: string; Icon: typeof Instagram; label: string }[] = [
  { key: "instagram", Icon: Instagram, label: "Instagram" },
  { key: "facebook", Icon: Facebook, label: "Facebook" },
  { key: "youtube", Icon: Youtube, label: "YouTube" },
];

const Footer = () => {
  const { contact, socialLinks } = useSiteConfig();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const contactInfo = contact || {
    phone: "+91 70667 63276",
    email: "hello@phoenixevents.com",
    address: "Pune, Maharashtra",
    whatsapp: "917066763276",
  };

  return (
    <footer className="relative bg-gradient-to-br from-footer-bg to-black text-footer-text dark:from-background dark:to-background overflow-hidden pt-8 md:pt-12 pb-6 transition-colors duration-500">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Footer - Compact padding */}
        <div className="pt-4 pb-4 md:pt-8 md:pb-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-10 text-center lg:text-left">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="col-span-2 sm:col-span-1 flex flex-col items-center lg:items-start space-y-1.5 md:space-y-0"
          >
            <div className="flex items-center gap-1.5 mb-1.5 md:mb-3">
              <img src="/logo.png" alt="Phoenix" className="w-6 h-6 md:w-10 md:h-10 object-contain" />
              <span className="font-display text-base md:text-xl font-bold text-footer-heading">Phoenix</span>
            </div>
            <p className="text-[10px] md:text-small italic leading-relaxed mb-2 md:mb-4 text-footer px-2 md:px-0">
              Turning your dreams into magnificent celebrations. Where every moment becomes a cherished memory.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start mt-4">
              {SOCIAL_ICONS.map(({ key, Icon }) => {
                const url = (socialLinks as Record<string, string>)[key];
                return (
                  <a
                    key={key}
                    href={url || "#"}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noopener noreferrer" : undefined}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                             bg-[var(--footer-icon-bg)] text-[var(--footer-link)] hover:bg-primary hover:text-primary-foreground hover:scale-110"
                    aria-label={key}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
            {/* Get Quote removed as requested */}
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-1"
          >
            <h4 className="text-xs md:text-body font-bold typography-eyebrow mb-1.5 md:mb-4 text-primary">
              Quick Links
            </h4>
            <ul className="space-y-0" style={{ lineHeight: 1.6 }}>
              {[
                { to: "/", label: "Home" },
                { to: "/events", label: "Events" },
                { to: "/services", label: "Services" },
                { to: "/gallery", label: "Gallery" },
                { to: "/#testimonials", label: "Testimonials" },
                { to: "/contact", label: "Contact" },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-[10px] md:text-small transition-colors duration-300 text-[var(--footer-link)] hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Our Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-1"
          >
            <h4 className="text-xs md:text-body font-bold typography-eyebrow mb-1.5 md:mb-4 text-primary">
              Our Events
            </h4>
            <ul className="space-y-0" style={{ lineHeight: 1.6 }}>
              {["Weddings", "Birthdays", "Engagements", "Corporate", "Sangeet", "Traditional"].map((event) => (
                <li key={event}>
                  <Link
                    to="/events"
                    className="text-[10px] md:text-small transition-colors duration-300 text-[var(--footer-link)] hover:text-primary"
                  >
                    {event}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="col-span-2 sm:col-span-1"
          >
            <h4 className="text-xs md:text-body font-bold typography-eyebrow mb-1.5 md:mb-4 text-primary">
              Get In Touch
            </h4>
            <ul className="space-y-1.5 md:space-y-3 flex flex-col items-center lg:items-start">
              {contactInfo.address && (
                <li className="flex items-start gap-1.5 md:gap-3">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mt-0.5 text-primary" />
                  <p className="text-[10px] md:text-small text-footer whitespace-pre-line text-left lg:text-left">{contactInfo.address}</p>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-1.5 md:gap-3">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 text-primary" />
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                    className="text-[10px] md:text-small text-footer hover:text-primary transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-1.5 md:gap-3">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 text-primary" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-[10px] md:text-small text-footer hover:text-primary transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-6 mt-8 pb-4 relative flex flex-col items-center gap-4 pr-14 border-t border-footer"
        >
          <p className="text-small flex items-center justify-center gap-2 text-center text-footer">
            © {new Date().getFullYear()} Phoenix Events & Production.
          </p>
          <button
            onClick={scrollToTop}
            className="absolute right-0 top-[24px] w-10 h-10 rounded-full flex items-center justify-center
                     bg-[var(--footer-icon-bg)] text-[var(--footer-link)] transition-all duration-300 hover:scale-110 group"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
