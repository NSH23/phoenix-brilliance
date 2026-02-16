import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Instagram } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SEO } from "@/components/SEO";
import { createInquiry } from "@/services/inquiries";
import { getActiveEvents } from "@/services/events";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { toast } from "sonner";

const Contact = () => {
  const { contact } = useSiteConfig();
  const [eventTypes, setEventTypes] = useState<string[]>(["Wedding", "Birthday", "Engagement", "Other"]);

  useEffect(() => {
    getActiveEvents()
      .then((events) => {
        const titles = events.map((e) => e.title);
        if (titles.length > 0) setEventTypes([...titles, "Other"]);
      })
      .catch(() => { });
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "",
    eventDate: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const messageWithDate = [formData.message, formData.eventDate ? `Event Date: ${formData.eventDate}` : ""].filter(Boolean).join("\n\n");

    try {
      await createInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        event_type: formData.eventType || null,
        message: messageWithDate || (formData.eventType ? `Inquiry for ${formData.eventType}` : "Inquiry"),
      });
    } catch (err) {
      toast.error("Failed to save your inquiry", {
        description: err instanceof Error ? err.message : "Please try again or contact us via WhatsApp.",
      });
      return;
    }

    const whatsappMessage = `Hello! I have to inquire about ${formData.eventType || "an event"}.

Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}
Event Type: ${formData.eventType}
Event Date: ${formData.eventDate}
${formData.message ? `Message: ${formData.message}` : ""}`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${contact.whatsapp}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", phone: "", email: "", eventType: "", eventDate: "", message: "" });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Phoenix Events & Production for your event planning needs in Pune, Maharashtra. Call, email, or visit us today."
        keywords="contact event planners Pune, event planning inquiry, book event services Maharashtra, event consultation"
        url="/contact"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="py-12 sm:py-16 lg:py-24 bg-muted/30 relative overflow-hidden pt-24 sm:pt-28 lg:pt-24 pb-20 sm:pb-24">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-rose-gold/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-16"
            >
              <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                Get In Touch
              </span>
              <h2 className="section-title mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl">
                Let's Plan Your <span className="text-gradient-gold">Dream Event</span>
              </h2>
              <p className="section-subtitle text-sm sm:text-base max-w-lg mx-auto">
                Ready to create something extraordinary? Let's bring your vision to life.
              </p>
            </motion.div>

            {/* Mobile: Quick Actions */}
            <div className="sm:hidden mb-6">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${contact.whatsapp}?text=Hi! I'm interested in your event services.`}
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
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl 
                         bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                         font-semibold text-sm shadow-lg active:scale-95 transition-transform"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-2 space-y-4 sm:space-y-6 mb-6 sm:mb-0"
              >
                {/* Map - Square, above contact info */}
                <div className="hidden sm:block glass-card overflow-hidden aspect-square">
                  <iframe
                    src="https://www.google.com/maps?q=Shop+no+1,+Phoenix+Events+and+Production,+Kailas+kondiba+Dange+Plot,+Unit+4,+Dange+Chowk+Rd,+nr.+CBI+Crime+Branch,+nr.+Maruti+Suzuki+Showroom,+Pune,+Maharashtra+411033&output=embed&zoom=17"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Phoenix Events and Production Location"
                  />
                </div>

                {/* Mobile: Horizontal scroll contact cards */}
                {/* Mobile: Compact vertical list */}
                <div className="sm:hidden mb-8">
                  <div className="space-y-6 text-center">
                    <h3 className="font-serif text-xl font-bold text-foreground">Contact Information</h3>

                    <div>
                      <h4 className="text-primary font-medium text-sm mb-1 uppercase tracking-wide">Visit Us</h4>
                      <p className="text-foreground text-sm whitespace-pre-line">
                        Phoenix Events, 123 Event Street, Mumbai, Maharashtra 400001
                      </p>
                    </div>

                    <div>
                      <h4 className="text-primary font-medium text-sm mb-1 uppercase tracking-wide">Call Us</h4>
                      <p className="text-foreground text-sm">+91 98765 43210</p>
                    </div>

                    <div>
                      <h4 className="text-primary font-medium text-sm mb-1 uppercase tracking-wide">Email Us</h4>
                      <p className="text-foreground text-sm">info@phoenixevents.com</p>
                    </div>

                    <div>
                      <h4 className="text-primary font-medium text-sm mb-1 uppercase tracking-wide">Business Hours</h4>
                      <p className="text-foreground text-sm">Open 24 Hours</p>
                    </div>

                    <div>
                      <h4 className="text-primary font-medium text-sm mb-1 uppercase tracking-wide">Follow Us</h4>
                      <div className="flex flex-col gap-1 items-center">
                        <a href="https://instagram.com/pnp.production.house" target="_blank" rel="noopener noreferrer" className="text-foreground text-sm hover:text-primary transition-colors">
                          @pnp.production.house
                        </a>
                        <a href="https://instagram.com/phoenix_events_and_production" target="_blank" rel="noopener noreferrer" className="text-foreground text-sm hover:text-primary transition-colors">
                          @phoenix_events_and_production
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Full contact card */}
                <div className="hidden sm:block glass-card p-5 lg:p-6">
                  <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground mb-5 lg:mb-6">Contact Information</h3>

                  <div className="space-y-4 lg:space-y-5">
                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm lg:text-base">Visit Us</p>
                        <p className="text-muted-foreground text-xs lg:text-sm whitespace-pre-line">
                          {contact.address || "Pune, Maharashtra"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm lg:text-base">Call Us</p>
                        <p className="text-muted-foreground text-xs lg:text-sm">{contact.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm lg:text-base">Email Us</p>
                        <p className="text-muted-foreground text-xs lg:text-sm">{contact.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm lg:text-base">Business Hours</p>
                        <p className="text-muted-foreground text-xs lg:text-sm">Open 24 Hours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Instagram className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm lg:text-base">Follow Us</p>
                        <div className="text-muted-foreground text-xs lg:text-sm space-y-1">
                          <a href="https://instagram.com/pnp.production.house" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">
                            @pnp.production.house
                          </a>
                          <a href="https://instagram.com/phoenix_events_and_production" target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-colors">
                            @phoenix_events_and_production
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-3 w-full"
              >
                <div className="glass-card p-4 sm:p-6 lg:p-8">
                  <h3 className="font-serif text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-4 sm:mb-6">
                    Request a Quote
                  </h3>

                  {isSubmitted ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald/10 flex items-center justify-center mb-4 sm:mb-6">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald" />
                      </div>
                      <h4 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-2">Thank You!</h4>
                      <p className="text-muted-foreground text-sm sm:text-base">Your inquiry has been saved. We&apos;ve opened WhatsApp so you can reach us directly. We&apos;ll get back to you soon!</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Your Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-xl bg-background border border-border 
                                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                                   transition-all duration-300 text-sm sm:text-base"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Phone Number *</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-xl bg-background border border-border 
                                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                                   transition-all duration-300 text-sm sm:text-base"
                            placeholder="+91 70667 63276"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-xl bg-background border border-border 
                                 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                                 transition-all duration-300 text-sm sm:text-base"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Event Type *</label>
                          <select
                            name="eventType"
                            value={formData.eventType}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-xl bg-background border border-border 
                                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                                   transition-all duration-300 text-sm sm:text-base"
                          >
                            <option value="">Select Event Type</option>
                            {eventTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Event Date *</label>
                          <input
                            type="date"
                            name="eventDate"
                            value={formData.eventDate}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-xl bg-background border border-border 
                                   focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                                   transition-all duration-300 text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Tell Us About Your Vision</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-xl bg-background border border-border 
                                 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none 
                                 transition-all duration-300 resize-none text-sm sm:text-base"
                          placeholder="Share your ideas, theme preferences..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 
                               bg-gradient-to-r from-primary to-rose-gold text-primary-foreground 
                               rounded-2xl sm:rounded-full font-semibold text-sm sm:text-lg 
                               hover:shadow-lg hover:scale-[1.02] transition-all duration-300
                               shadow-lg shadow-primary/30 active:scale-95"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Get a Custom Quote</span>
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        </section>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Contact;
