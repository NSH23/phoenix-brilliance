# Contact links & redirects – where they appear

Use this list to verify that the whole site uses the same phone numbers, email, Instagram, and other links. **Canonical values** are defined in **SiteConfigContext** (and overridable via admin/CMS).

---

## Canonical values

| Item | Value |
|------|--------|
| **Address** | Shop no 1, Phoenix Events and Production, Kailas kondiba Dange Plot, Unit 4, Dange Chowk Rd, nr. CBI Crime Branch, nr. Maruti Suzuki Showroom, Pune, Maharashtra 411033 |
| **Phone (primary)** | +91 70667 63276 |
| **Phone (secondary)** | +91 97667 97234 |
| **WhatsApp (for wa.me)** | 917066763276 (no + or spaces) |
| **Email** | Phoenixeventsandproduction@gmail.com |
| **Instagram** | https://www.instagram.com/phoenix_events_and_production?igsh=MW1nMDh4dmg2ZWNvNA== |

---

## Where each link / text appears

### Phone number (display + `tel:` – opens phone dialer)

| Location | File | What’s shown | On click |
|---------|------|---------------|----------|
| Navbar – desktop | `src/components/Navbar.tsx` | “Contact” then “+91 70667 63276” after click | No link; copy/call manually |
| Navbar – mobile menu | `src/components/Navbar.tsx` | “Contact” CTA button | **Opens phone dialer** (`tel:` from `contact.phone`) |
| Footer – Get In Touch | `src/components/Footer.tsx` | Primary phone number | **Opens phone dialer** (`tel:`) |
| Contact page – left column | `src/pages/Contact.tsx` | Both numbers (desktop + mobile) | Display only (no `tel:` on the numbers in the info block) |
| Contact page – right column (form) | `src/pages/Contact.tsx` | “Call: +91 70667 63276, +91 97667 97234” | Display only |
| Contact page – mobile quick actions | `src/pages/Contact.tsx` | “Call Now” button | **Opens phone dialer** (`tel:`) |
| ContactSection – mobile “Call Now” | `src/components/ContactSection.tsx` | “Call Now” button | **Opens phone dialer** (`tel:`) |
| ContactSection – desktop card “Call Us” | `src/components/ContactSection.tsx` | Both numbers with links | **Opens phone dialer** (first: `tel:` from `contact.phone`, second: `tel:+919766797234`) |
| ContactSection – mobile scroll cards | `src/components/ContactSection.tsx` | “Call Us” card shows primary number | Display only (card text) |
| Services page – CTA “Call Us Now” | `src/pages/Services.tsx` | “Call Us Now” button | **Opens phone dialer** (`tel:` from `contact.phone`) |
| MobileCTA (floating CTA) | `src/components/MobileCTA.tsx` | “Call” / phone action | **Opens phone dialer** (`tel:`) |
| Index (SEO) | `src/pages/Index.tsx` | Not visible in UI | Used in JSON-LD `telephone` for SEO |

---

### Email (display + `mailto:` – opens email client)

| Location | File | What’s shown | On click |
|---------|------|---------------|----------|
| Footer – icon | `src/components/Footer.tsx` | Email icon | **Opens email client** (`mailto: Phoenixeventsandproduction@gmail.com`) |
| Footer – text under icons | `src/components/Footer.tsx` | Phoenixeventsandproduction@gmail.com | **Opens email client** (`mailto:`) |
| Contact page – left “Follow Us” | `src/pages/Contact.tsx` | Email text (desktop + mobile) | **Opens email client** (`mailto:`) |
| Contact page – right (form column) | `src/pages/Contact.tsx` | “Email: Phoenixeventsandproduction@gmail.com” | **Opens email client** (`mailto:`) |
| ContactSection – desktop “Email Us” | `src/components/ContactSection.tsx` | Phoenixeventsandproduction@gmail.com | **Opens email client** (`mailto:`) |
| ContactSection – mobile scroll cards | `src/components/ContactSection.tsx` | “Email Us” card | Display only |

---

### WhatsApp (`wa.me` – opens WhatsApp app/web)

| Location | File | What’s shown | On click |
|---------|------|---------------|----------|
| Footer – icon | `src/components/Footer.tsx` | WhatsApp icon | **Opens WhatsApp** (`wa.me/917066763276`) |
| Contact page – “WhatsApp” quick action | `src/pages/Contact.tsx` | “WhatsApp” button | **Opens WhatsApp** with pre-filled message |
| ContactSection – mobile “WhatsApp” | `src/components/ContactSection.tsx` | “WhatsApp” button | **Opens WhatsApp** with pre-filled message |
| WhatsAppButton (floating) | `src/components/WhatsAppButton.tsx` | Floating WhatsApp button | **Opens WhatsApp** with pre-filled message (uses `contact.phone` → 917066763276) |
| MobileCTA | `src/components/MobileCTA.tsx` | “WhatsApp” action | **Opens WhatsApp** with pre-filled message |

All WhatsApp links use the same number (917066763276) from `contact.whatsapp` or fallback in code.

---

### Instagram (opens in new tab)

| Location | File | What’s shown | On click |
|---------|------|---------------|----------|
| Footer – icon | `src/components/Footer.tsx` | Instagram icon | **Opens Instagram** (phoenix_events_and_production) in new tab |
| Contact page – left “Follow Us” | `src/pages/Contact.tsx` | “@phoenix_events_and_production” (desktop + mobile) | **Opens Instagram** in new tab |

---

### Address (display + map embed)

| Location | File | What’s shown | On click |
|---------|------|---------------|----------|
| Footer – Get In Touch | `src/components/Footer.tsx` | Full Pune address (from `contact.address` or `MAP_ADDRESS`) | None |
| Contact page – left column | `src/pages/Contact.tsx` | Full Pune address | None |
| Contact page – map iframe | `src/pages/Contact.tsx` | Google Map (Pune address) | Map interaction (zoom, open in Google Maps) |
| ContactSection – desktop “Visit Us” | `src/components/ContactSection.tsx` | Full Pune address | None |
| ContactSection – mobile scroll “Visit Us” | `src/components/ContactSection.tsx` | “Pune, Maharashtra” | None |
| ContactSection – map iframes (mobile + desktop) | `src/components/ContactSection.tsx` | Google Map (Pune address) | Map interaction |

---

## Source of truth

- **SiteConfigContext** (`src/contexts/SiteConfigContext.tsx`): default contact (phone, email, address, whatsapp). Used by Navbar, Footer, Contact page, ContactSection, WhatsAppButton, MobileCTA, Services, Index.
- **Footer / Contact / ContactSection**: some constants (e.g. `MAP_ADDRESS`, `CONTACT_EMAIL`, `INSTAGRAM_URL`) are also defined locally so the site works even if context is loading; they match the canonical values above.
- **Admin**: Contact and social links can be changed in admin (Content/Settings); those values override the defaults when saved.

---

## Quick checklist for you

- [ ] **Phone**: Same two numbers everywhere (+91 70667 63276, +91 97667 97234); all “call” actions use `tel:` and open dialer.
- [ ] **Email**: Phoenixeventsandproduction@gmail.com everywhere; all email links use `mailto:` and open email client.
- [ ] **WhatsApp**: All open `wa.me/917066763276` (and optional pre-filled text).
- [ ] **Instagram**: All open phoenix_events_and_production profile in new tab.
- [ ] **Address**: Full Pune address everywhere; maps show Pune location (no Mumbai).

If you want a different number or link in one place, say which file/section and we can adjust only that.
