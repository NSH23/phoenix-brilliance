import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "./ContactForm";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const MAP_ADDRESS = "Shop no 1, Phoenix Events and Production, Kailas kondiba Dange Plot, Unit 4, Dange Chowk Rd, nr. CBI Crime Branch, nr. Maruti Suzuki Showroom, Pune, Maharashtra 411033";
const CONTACT_EMAIL = "Phoenixeventsandproduction@gmail.com";
const CONTACT_PHONE = "+91 70667 63276";
const CONTACT_PHONE_2 = "+91 97667 97234";
const WHATSAPP_NUM = "917066763276";
const INSTAGRAM_URL = "https://www.instagram.com/phoenix_events_and_production?igsh=MW1nMDh4dmg2ZWNvNA==";

const ContactSection = () => {
  const { contact } = useSiteConfig();
  const phone = contact?.phone || CONTACT_PHONE;
  const whatsappNum = (contact?.phone?.replace(/\D/g, '') || WHATSAPP_NUM);

  return (
    <section id="contact" className="py-12 sm:py-16 lg:py-24 pb-24 sm:pb-24 bg-background relative overflow-hidden">
      {/* Soft decorative blurs – no flat strip */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-rose-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header – card-style like collaborations CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center rounded-2xl border border-border bg-card shadow-elevation-1 dark:shadow-elevation-1-dark py-8 sm:py-10 px-6 sm:px-8 mb-8 sm:mb-12"
        >
          <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium font-sans mb-3 sm:mb-4">
            Get In Touch
          </span>
          <h2 className="section-title font-serif font-semibold mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl text-foreground">
            Let's Plan Your <span className="text-gradient-gold">Dream Event</span>
          </h2>
          <p className="section-subtitle text-sm sm:text-base max-w-lg mx-auto text-muted-foreground font-sans leading-relaxed">
            Ready to create something extraordinary? Let's bring your vision to life.
          </p>
        </motion.div>

        {/* Mobile: Quick Actions */}
        <div className="sm:hidden mb-6">
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/${whatsappNum}?text=Hi! I'm interested in your event services.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 rounded-2xl 
                       bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white 
                       font-semibold text-sm shadow-lg active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp</span>
            </a>
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center justify-center gap-2 p-4 rounded-2xl 
                       bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                       font-semibold text-sm shadow-lg active:scale-95 transition-transform"
            >
              <Phone className="w-5 h-5" />
              <span>Call Now</span>
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Contact Info - Compact horizontal scroll on mobile */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 space-y-4 sm:space-y-6"
          >
            {/* Mobile: Horizontal scroll contact cards */}
            <div className="sm:hidden mb-4">
              <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {[
                  { icon: MapPin, title: "Visit Us", info: "Pune, Maharashtra" },
                  { icon: Phone, title: "Call Us", info: CONTACT_PHONE },
                  { icon: Mail, title: "Email Us", info: CONTACT_EMAIL },
                  { icon: Clock, title: "Working Hours", info: "Mon-Sat: 10AM-8PM" },
                ].map((item, idx) => (
                  <div
                    key={item.title}
                    className="flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl 
                             bg-card border border-border shadow-elevation-1 dark:shadow-elevation-1-dark min-w-[140px] max-w-[140px] text-center snap-start"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-medium text-foreground text-xs font-sans">{item.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5 font-sans">{item.info}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Map with square size */}
            <div className="sm:hidden glass-card overflow-hidden rounded-2xl aspect-square w-full">
              <iframe
                src="https://www.google.com/maps?q=Shop+no+1,+Phoenix+Events+and+Production,+Kailas+kondiba+Dange+Plot,+Unit+4,+Dange+Chowk+Rd,+nr.+CBI+Crime+Branch,+nr.+Maruti+Suzuki+Showroom,+Pune,+Maharashtra+411033&output=embed&zoom=17"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
            </div>

            {/* Desktop: Full contact card */}
            <div className="hidden sm:block glass-card p-5 lg:p-6">
              <h3 className="font-serif text-xl lg:text-2xl font-semibold text-foreground mb-5 lg:mb-6">Contact Information</h3>

              <div className="space-y-4 lg:space-y-5">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm lg:text-base font-sans">Visit Us</p>
                    <p className="text-muted-foreground text-xs lg:text-sm whitespace-pre-line font-sans">{contact?.address || MAP_ADDRESS}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm lg:text-base font-sans">Call Us</p>
                    <p className="text-muted-foreground text-xs lg:text-sm font-sans">
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-primary">{phone}</a>
                      <br />
                      <a href="tel:+919766797234" className="hover:text-primary">{CONTACT_PHONE_2}</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm lg:text-base font-sans">Email Us</p>
                    <p className="text-muted-foreground text-xs lg:text-sm font-sans">
                      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">{CONTACT_EMAIL}</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm lg:text-base font-sans">Working Hours</p>
                    <p className="text-muted-foreground text-xs lg:text-sm font-sans">Mon - Sat: 10:00 AM - 8:00 PM<br />Sunday: By Appointment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map - Hidden on mobile */}
            <div className="hidden sm:block glass-card overflow-hidden h-40 lg:h-48">
              <iframe
                src="https://www.google.com/maps?q=Shop+no+1,+Phoenix+Events+and+Production,+Kailas+kondiba+Dange+Plot,+Unit+4,+Dange+Chowk+Rd,+nr.+CBI+Crime+Branch,+nr.+Maruti+Suzuki+Showroom,+Pune,+Maharashtra+411033&output=embed&zoom=17"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
            </div>
          </motion.div>

          {/* Contact Form - Optimized for mobile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-3 sm:p-6 lg:p-8">
              <h3 className="font-serif text-base sm:text-xl lg:text-2xl font-semibold text-foreground mb-3 sm:mb-6">
                Request a Quote
              </h3>
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
