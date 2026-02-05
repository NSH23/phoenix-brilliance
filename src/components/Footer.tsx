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
    <footer className="relative overflow-hidden bg-footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Footer - 80px top padding */}
        <div className="pt-20 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <img src="/logo.png" alt="Phoenix" className="w-12 h-12 object-contain" />
              <span className="font-display text-subsection font-bold text-footer-heading">Phoenix</span>
            </div>
            <p className="text-small italic leading-body-relaxed mb-6 text-footer">
              Turning your dreams into magnificent celebrations. Where every moment becomes a cherished memory.
            </p>
            <div className="flex gap-3">
              {SOCIAL_ICONS.map(({ key, Icon }) => {
                const url = (socialLinks as Record<string, string>)[key];
                return (
                  <a
                    key={key}
                    href={url || "#"}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noopener noreferrer" : undefined}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                             bg-[var(--footer-icon-bg)] text-[var(--footer-link)] hover:bg-primary hover:text-primary-foreground"
                    aria-label={key}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center mt-6 px-8 py-3.5 rounded-full font-semibold
                       bg-gradient-gold text-primary-foreground transition-all duration-300 hover:scale-105
                       hover:shadow-lg hover:opacity-90"
            >
              Get Quote
            </Link>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-body font-bold typography-eyebrow mb-6 text-primary">
              Quick Links
            </h4>
            <ul className="space-y-1" style={{ lineHeight: 2.2 }}>
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
                    className="text-small transition-colors duration-300 text-[var(--footer-link)] hover:text-primary"
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
          >
            <h4 className="text-body font-bold typography-eyebrow mb-6 text-primary">
              Our Events
            </h4>
            <ul className="space-y-1" style={{ lineHeight: 2.2 }}>
              {["Weddings", "Birthdays", "Engagements", "Corporate", "Sangeet", "Traditional"].map((event) => (
                <li key={event}>
                  <Link
                    to="/events"
                    className="text-small transition-colors duration-300 text-[var(--footer-link)] hover:text-primary"
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
          >
            <h4 className="text-body font-bold typography-eyebrow mb-6 text-primary">
              Get In Touch
            </h4>
            <ul className="space-y-4">
              {contactInfo.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                  <p className="text-small text-footer whitespace-pre-line">{contactInfo.address}</p>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                    className="text-small text-footer hover:text-primary transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-small text-footer hover:text-primary transition-colors"
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
          className="pt-[30px] mt-[60px] pb-8 relative flex flex-col items-center gap-6 pr-14 border-t border-footer"
        >
          <p className="text-small flex items-center justify-center gap-2 text-center text-footer">
            © {new Date().getFullYear()} Phoenix Events & Production. Made with
            <Heart className="w-4 h-4 text-primary fill-primary" aria-hidden />
            in India
          </p>
          <button
            onClick={scrollToTop}
            className="absolute right-0 top-[30px] w-12 h-12 rounded-full flex items-center justify-center
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
