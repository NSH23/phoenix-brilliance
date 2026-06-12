import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Send, CheckCircle, Instagram, Mail, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import ContactPageHero from "@/components/ContactPageHero";
import { SEO } from "@/components/SEO";
import { createInquiry, isValidPhone10 } from "@/services/inquiries";
import { getVenueOptions, getEventTypeOptions, DEFAULT_EVENT_TYPES, DEFAULT_VENUES } from "@/services/formOptions";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import {
  CONTACT_EMAIL,
  DEFAULT_PHONE_PRIMARY,
  DEFAULT_PHONE_SECONDARY,
  DEFAULT_WHATSAPP,
  INSTAGRAM_URL,
  MAP_ADDRESS,
  MAP_EMBED_URL,
  toTelHref,
  toWhatsAppHref,
} from "@/lib/contactNumbers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const OTHER_LABEL = "Other";

const fieldClass =
  "h-11 rounded-xl border-border bg-background text-sm focus-visible:ring-primary/25 focus-visible:ring-offset-0 md:text-sm";

const selectClass = cn(
  fieldClass,
  "w-full px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

/** Readable address lines — avoids one long paragraph in the UI. */
function formatStudioAddress(raw: string) {
  const parts = raw.split(", ").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return [raw];

  const last = parts[parts.length - 1] ?? "";
  const pinMatch = last.match(/^(.+?)\s+(\d{6})$/);

  let cityLine: string;
  let beforeCity: string[];

  if (pinMatch && parts.length >= 2) {
    const city = parts[parts.length - 2] ?? "";
    cityLine = `${city}, ${pinMatch[1]} ${pinMatch[2]}`;
    beforeCity = parts.slice(0, -2);
  } else {
    cityLine = last;
    beforeCity = parts.slice(0, -1);
  }

  const line1 = beforeCity.slice(0, 2).join(", ");
  const line2 = beforeCity.slice(2, 5).join(", ");
  const line3 = beforeCity.slice(5).join(", ");

  return [line1, line2, line3, cityLine].filter(Boolean);
}

type ContactDetailRowProps = {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
};

function ContactDetailRow({ icon: Icon, label, children }: ContactDetailRowProps) {
  return (
    <div className="flex gap-4 px-5 py-5 sm:px-6 sm:py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.06]">
        <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{label}</p>
        <div className="mt-2 space-y-1 text-sm leading-relaxed text-foreground/85">{children}</div>
      </div>
    </div>
  );
}

type ContactDetailsPanelProps = {
  address: string;
  phone: string;
  phone2: string;
};

function ContactDetailsPanel({ address, phone, phone2 }: ContactDetailsPanelProps) {
  const addressLines = formatStudioAddress(address);

  return (
    <div className="home-card overflow-hidden">
      <div className="border-b border-border/60 bg-muted/25 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Studio & contact</p>
        <p className="mt-1 font-serif text-lg font-medium text-foreground">Reach us directly</p>
      </div>

      <div className="divide-y divide-border/50">
        <ContactDetailRow icon={MapPin} label="Visit us">
          {addressLines.map((line) => (
            <p key={line} className="text-muted-foreground">
              {line}
            </p>
          ))}
        </ContactDetailRow>

        <ContactDetailRow icon={Phone} label="Call us">
          <a
            href={toTelHref(phone)}
            className="block font-medium tabular-nums text-foreground transition-colors hover:text-primary"
          >
            {phone}
          </a>
          <a
            href={toTelHref(phone2)}
            className="block font-medium tabular-nums text-foreground transition-colors hover:text-primary"
          >
            {phone2}
          </a>
        </ContactDetailRow>

        <ContactDetailRow icon={Clock} label="Availability">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Open 24 hours
            </span>
          </div>
          <p className="text-muted-foreground">We&apos;re here whenever inspiration strikes.</p>
        </ContactDetailRow>

        <ContactDetailRow icon={Instagram} label="Follow us">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
          >
            <Instagram className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
            @phoenix_events_and_production
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 break-all text-muted-foreground transition-colors hover:text-primary"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
            {CONTACT_EMAIL}
          </a>
        </ContactDetailRow>
      </div>
    </div>
  );
}

const Contact = () => {
  const { contact } = useSiteConfig();
  const [eventTypeOptions, setEventTypeOptions] = useState<string[]>([...DEFAULT_EVENT_TYPES, OTHER_LABEL]);
  const [venueOptions, setVenueOptions] = useState<string[]>([...DEFAULT_VENUES, OTHER_LABEL]);

  useEffect(() => {
    getEventTypeOptions().then(setEventTypeOptions);
    getVenueOptions().then(setVenueOptions);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "",
    eventTypeOther: "",
    eventDate: "",
    venue: "",
    venueOther: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const phone = contact?.phone || DEFAULT_PHONE_PRIMARY;
  const phone2 = contact?.phone2 || DEFAULT_PHONE_SECONDARY;
  const address = contact?.address || MAP_ADDRESS;

  const resolvedEventType = formData.eventType === OTHER_LABEL ? formData.eventTypeOther.trim() : formData.eventType;
  const resolvedVenue = formData.venue === OTHER_LABEL ? formData.venueOther.trim() : formData.venue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhone10(formData.phone)) {
      toast.error("Please enter a valid 10-digit number (with or without +91)");
      return;
    }
    if (!resolvedEventType) {
      toast.error("Please select your event type");
      return;
    }
    if (!resolvedVenue) {
      toast.error("Please select your venue");
      return;
    }

    const messageWithDate = [formData.message, formData.eventDate ? `Event Date: ${formData.eventDate}` : ""]
      .filter(Boolean)
      .join("\n\n");

    try {
      await createInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        event_type: resolvedEventType || null,
        venue: resolvedVenue || null,
        message: messageWithDate || (resolvedEventType ? `Inquiry for ${resolvedEventType}` : "Inquiry"),
      });
    } catch (err) {
      toast.error("Failed to save your inquiry", {
        description: err instanceof Error ? err.message : "Please try again or contact us via WhatsApp.",
      });
      return;
    }

    const whatsappMessage = `Hello! I have to inquire about ${resolvedEventType || "an event"}.

Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}
Event Type: ${resolvedEventType || "—"}
Event Date: ${formData.eventDate}
Venue: ${resolvedVenue || "—"}
${formData.message ? `Message: ${formData.message}` : ""}`;

    const whatsappUrl = toWhatsAppHref(contact?.whatsapp || DEFAULT_WHATSAPP, whatsappMessage);
    window.open(whatsappUrl, "_blank");

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        eventType: "",
        eventTypeOther: "",
        eventDate: "",
        venue: "",
        venueOther: "",
        message: "",
      });
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
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <ContactPageHero phone={phone} whatsapp={contact?.whatsapp} />

        <section className="pb-14 md:pb-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12 lg:gap-8">
              {/* Form — primary column */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="order-1 lg:col-span-7"
              >
                <div className="home-card overflow-hidden">
                  <div className="border-b border-border/60 bg-muted/30 px-5 py-5 sm:px-7 sm:py-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Inquiry form</p>
                    <h2 className="mt-1.5 font-serif text-2xl font-medium text-foreground sm:text-[1.65rem]">
                      Request a custom quote
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tell us about your event — we typically respond within a few hours.
                    </p>
                  </div>

                  <div className="p-5 sm:p-7">
                    {isSubmitted ? (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center sm:py-16"
                      >
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 sm:h-20 sm:w-20">
                          <CheckCircle className="h-8 w-8 text-emerald sm:h-10 sm:w-10" />
                        </div>
                        <h3 className="font-serif text-xl font-medium text-foreground sm:text-2xl">Thank you!</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
                          Your inquiry has been saved. We&apos;ve opened WhatsApp so you can reach us directly — we&apos;ll
                          be in touch soon.
                        </p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your name *</Label>
                            <Input
                              id="name"
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              className={fieldClass}
                              placeholder="Full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone number *</Label>
                            <Input
                              id="phone"
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              className={fieldClass}
                              placeholder="+91 or 10-digit"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email address *</Label>
                          <Input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={fieldClass}
                            placeholder="you@example.com"
                          />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="eventType">Event type *</Label>
                            <select
                              id="eventType"
                              name="eventType"
                              value={formData.eventType}
                              onChange={handleChange}
                              required
                              className={selectClass}
                            >
                              <option value="">Select event type</option>
                              {eventTypeOptions.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="eventDate">Event date *</Label>
                            <Input
                              id="eventDate"
                              type="date"
                              name="eventDate"
                              value={formData.eventDate}
                              onChange={handleChange}
                              required
                              min="1900-01-01"
                              max="2099-12-31"
                              className={fieldClass}
                            />
                          </div>
                        </div>

                        {formData.eventType === OTHER_LABEL && (
                          <div className="space-y-2">
                            <Label htmlFor="eventTypeOther">Event type (other)</Label>
                            <Input
                              id="eventTypeOther"
                              type="text"
                              name="eventTypeOther"
                              value={formData.eventTypeOther}
                              onChange={handleChange}
                              className={fieldClass}
                              placeholder="Specify event type"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="venue">Venue *</Label>
                          <select
                            id="venue"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            required
                            className={selectClass}
                          >
                            <option value="">Select venue</option>
                            {venueOptions.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>

                        {formData.venue === OTHER_LABEL && (
                          <div className="space-y-2">
                            <Label htmlFor="venueOther">Venue name (other) *</Label>
                            <Input
                              id="venueOther"
                              type="text"
                              name="venueOther"
                              value={formData.venueOther}
                              onChange={handleChange}
                              required={formData.venue === OTHER_LABEL}
                              className={fieldClass}
                              placeholder="Enter venue name"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="message">Tell us about your vision</Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            className="min-h-[110px] resize-none rounded-xl border-border text-sm focus-visible:ring-primary/25 focus-visible:ring-offset-0"
                            placeholder="Theme, guest count, special requests…"
                          />
                        </div>

                        <Button type="submit" size="lg" className="h-12 w-full gap-2 text-base">
                          <Send className="h-4 w-4" />
                          Get a custom quote
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Map + contact cards */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="order-2 space-y-4 lg:col-span-5 lg:space-y-5"
              >
                <div className="home-card group overflow-hidden">
                  <div className="relative aspect-[16/10] w-full sm:aspect-[4/3] lg:aspect-[5/4]">
                    <iframe
                      src={MAP_EMBED_URL}
                      width="100%"
                      height="100%"
                      className="absolute inset-0 h-full w-full"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Phoenix Events and Production Location"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 sm:px-5">
                    <p className="text-xs text-muted-foreground sm:text-sm">Pune, Maharashtra</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline sm:text-sm"
                    >
                      Open in Maps
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </div>
                </div>

                <ContactDetailsPanel address={address} phone={phone} phone2={phone2} />
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;
