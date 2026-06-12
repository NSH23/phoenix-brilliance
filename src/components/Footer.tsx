import { Instagram, ArrowUp, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { DEFAULT_PHONE_PRIMARY, DEFAULT_PHONE_SECONDARY, DEFAULT_WHATSAPP, toTelHref } from "@/lib/contactNumbers";
import { getPublicFooterQuickLinks } from "@/lib/publicGallery";

const INSTAGRAM_URL = "https://www.instagram.com/phoenix_events_and_production?igsh=MW1nMDh4dmg2ZWNvNA==";
const CONTACT_EMAIL = "Phoenixeventsandproduction@gmail.com";
const MAP_ADDRESS =
  "Shop no 1, Phoenix Events and Production, Kailas kondiba Dange Plot, Unit 4, Dange Chowk Rd, nr. CBI Crime Branch, nr. Maruti Suzuki Showroom, Pune, Maharashtra 411033";

const Footer = () => {
  const { contact, logoUrl } = useSiteConfig();
  const logoSrc = logoUrl || "/logo.png";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const contactInfo = contact || {
    phone: DEFAULT_PHONE_PRIMARY,
    phone2: DEFAULT_PHONE_SECONDARY,
    address: MAP_ADDRESS,
    whatsapp: DEFAULT_WHATSAPP,
  };

  return (
    <footer className="relative border-t border-border bg-[#1A1816] pb-24 text-[#F5F2EE] md:pb-0">
      <div className="absolute inset-x-0 top-0 h-px bg-primary/80" aria-hidden />

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="Phoenix Events & Production"
                className="h-12 w-12 object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="font-serif text-xl font-medium leading-tight">
                Phoenix Events & Production
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#F5F2EE]/75">
              Premium event planning and production for weddings, celebrations, and corporate
              gatherings across Pune.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#F5F2EE]/15 text-[#F5F2EE]/85 transition-colors hover:border-primary hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={`https://wa.me/${contactInfo.whatsapp || DEFAULT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#F5F2EE]/15 text-[#F5F2EE]/85 transition-colors hover:border-primary hover:text-primary"
                aria-label="WhatsApp"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#F5F2EE]/15 text-[#F5F2EE]/85 transition-colors hover:border-primary hover:text-primary"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5">
              {getPublicFooterQuickLinks().map(({ name: label, href: to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-[#F5F2EE]/75 transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Our Events
            </h4>
            <ul className="mt-4 space-y-2.5">
              {["Weddings", "Birthdays", "Engagements", "Corporate", "Sangeet", "Traditional"].map(
                (event) => (
                  <li key={event}>
                    <Link
                      to="/events"
                      className="text-sm text-[#F5F2EE]/75 transition-colors hover:text-primary"
                    >
                      {event}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Get In Touch
            </h4>
            <ul className="mt-4 space-y-4">
              {(contact?.address || contactInfo.address) && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-[#F5F2EE]/75">
                    {contact?.address || contactInfo.address || MAP_ADDRESS}
                  </p>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col gap-1">
                    <a
                      href={toTelHref(contactInfo.phone)}
                      className="text-sm text-[#F5F2EE]/75 hover:text-primary"
                    >
                      {contactInfo.phone}
                    </a>
                    {contactInfo.phone2 ? (
                      <a
                        href={toTelHref(contactInfo.phone2)}
                        className="text-sm text-[#F5F2EE]/75 hover:text-primary"
                      >
                        {contactInfo.phone2}
                      </a>
                    ) : null}
                  </div>
                </li>
              )}
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm break-all text-[#F5F2EE]/75 hover:text-primary"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-[#F5F2EE]/10 pt-6">
          <p className="text-sm text-[#F5F2EE]/60">
            © {new Date().getFullYear()} Phoenix Events & Production
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#F5F2EE]/15 text-[#F5F2EE]/85 transition-colors hover:border-primary hover:text-primary"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
