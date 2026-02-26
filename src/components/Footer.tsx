import { motion } from "framer-motion";
import { Instagram, ArrowUp, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const INSTAGRAM_URL = "https://www.instagram.com/phoenix_events_and_production?igsh=MW1nMDh4dmg2ZWNvNA==";
const CONTACT_EMAIL = "Phoenixeventsandproduction@gmail.com";
const MAP_ADDRESS = "Shop no 1, Phoenix Events and Production, Kailas kondiba Dange Plot, Unit 4, Dange Chowk Rd, nr. CBI Crime Branch, nr. Maruti Suzuki Showroom, Pune, Maharashtra 411033";

const Footer = () => {
  const { contact, socialLinks, logoUrl } = useSiteConfig();
  const logoSrc = logoUrl || '/logo.png';
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const contactInfo = contact || {
    phone: "+91 70667 63276",
    address: MAP_ADDRESS,
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
            className="col-span-2 sm:col-span-1 flex flex-col items-center lg:items-start gap-5"
          >
            <div className="flex items-center gap-3 shrink-0">
              <img src={logoSrc} alt="Phoenix Events & Production" className="w-11 h-11 md:w-14 md:h-14 object-contain flex-shrink-0" loading="lazy" decoding="async" />
              <span className="font-serif text-lg md:text-xl font-semibold text-footer-heading leading-tight">
                Phoenix Events & Production
              </span>
            </div>
            <p className="text-xs md:text-sm text-footer/90 italic leading-relaxed text-center lg:text-left max-w-[280px] md:max-w-none font-sans">
              Turning your dreams into magnificent celebrations. Every moment, a cherished memory.
            </p>
            <div className="flex gap-3 justify-center lg:justify-start shrink-0 pt-1">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                         bg-[var(--footer-icon-bg)] text-[var(--footer-link)] hover:bg-primary hover:text-primary-foreground hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${contactInfo.whatsapp || "917066763276"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                         bg-[var(--footer-icon-bg)] text-[var(--footer-link)] hover:bg-primary hover:text-primary-foreground hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                         bg-[var(--footer-icon-bg)] text-[var(--footer-link)] hover:bg-primary hover:text-primary-foreground hover:scale-110"
                aria-label="Email"
                title={CONTACT_EMAIL}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
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
            <h4 className="text-xs md:text-body font-semibold typography-eyebrow mb-1.5 md:mb-4 text-primary font-sans uppercase tracking-[0.12em]">
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
                    className="text-[10px] md:text-small font-sans transition-colors duration-300 text-[var(--footer-link)] hover:text-primary"
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
            <h4 className="text-xs md:text-body font-semibold typography-eyebrow mb-1.5 md:mb-4 text-primary font-sans uppercase tracking-[0.12em]">
              Our Events
            </h4>
            <ul className="space-y-0" style={{ lineHeight: 1.6 }}>
              {["Weddings", "Birthdays", "Engagements", "Corporate", "Sangeet", "Traditional"].map((event) => (
                <li key={event}>
                  <Link
                    to="/events"
                    className="text-[10px] md:text-small font-sans transition-colors duration-300 text-[var(--footer-link)] hover:text-primary"
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
            <h4 className="text-xs md:text-body font-semibold typography-eyebrow mb-1.5 md:mb-4 text-primary font-sans uppercase tracking-[0.12em]">
              Get In Touch
            </h4>
            <ul className="space-y-1.5 md:space-y-3 flex flex-col items-center lg:items-start">
              {(contact?.address || contactInfo.address) && (
                <li className="flex items-start gap-1.5 md:gap-3">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mt-0.5 text-primary" />
                  <p className="text-[10px] md:text-small text-footer whitespace-pre-line text-left lg:text-left font-sans">{contact?.address || contactInfo.address || MAP_ADDRESS}</p>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-1.5 md:gap-3">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 text-primary" />
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                    className="text-[10px] md:text-small text-footer hover:text-primary transition-colors font-sans"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-1.5 md:gap-3">
                <Mail className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 text-primary" />
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[10px] md:text-small text-footer hover:text-primary transition-colors break-all font-sans"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-6 mt-8 pb-4 relative flex flex-col items-center gap-4 pr-14 border-t border-footer"
        >
          <p className="text-small flex items-center justify-center gap-2 text-center text-footer font-sans">
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
