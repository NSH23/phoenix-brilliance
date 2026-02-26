# Phoenix Events & Production — Website Theme & Design Reference

Reference for **theme**, **colour palette**, **homepage sections**, **typography**, and **UI patterns**.

---

## 1. Overall Theme

Two themes: **Light (Pink Luxury)** — ivory, champagne, rose-gold; warm rose shadows, no harsh white. **Dark (Navy Luxury)** — `#0B1220` base, rose-gold accents, cool blue-grey text. Controlled by `dark` class on `<html>` (user or `prefers-color-scheme: dark`). No cold greys; light = warm rose/gold, dark = navy + rose.

| Theme | Name | Vibe |
|-------|------|------|
| Light | Pink Luxury | Soft ivory/champagne/rose-gold, warm shadows, premium wedding-ready |
| Dark | Navy Luxury | Deep navy #0B1220, rose-gold CTAs, sophisticated cinematic |

---

## 2. Colour Palette

### 2.1 Light — Pink Luxury

| Role | Hex | Usage |
|------|-----|--------|
| Primary | `#E8AFC1` | Buttons, links, accents, eyebrow |
| Primary Hover | `#D998AE` | Button/link hover |
| Soft Petal | `#F5DCE3` | Secondary surfaces |
| Ivory Rose | `#FFF8FA` | Main/section backgrounds |
| Champagne Tint | `#FFF3F6` | Hero gradient, alternate sections |
| Rich Charcoal | `#2E2E2E` | Headings, primary text, button text on primary |
| Warm Gray | `#6B6B6B` | Muted/body text |
| Subtle Line / Pearl | `#F0D4DC` | Borders, dividers |
| Navy (footer) | `#0B1220` | Footer bg |
| Footer heading | `#E8AFC1` | Footer brand |
| Footer text | `#F3EDEB` | Footer body |
| Espresso | `#3E2723` | Testimonial text, dark accents |

**Gradients:** Champagne `linear-gradient(135deg, #FFF8FA 0%, #FFF3F6 50%, #F5DCE3 100%)`; Rose Gold `linear-gradient(135deg, #E8AFC1 0%, #D998AE 100%)`; Parchment `linear-gradient(135deg, #FFF3F6 0%, #F5DCE3 100%)`.

**Shadows (warm rose):** `0 2px 10px rgba(232,175,193,0.12)`, `0 4px 20px rgba(232,175,193,0.18)`, `0 8px 32px rgba(232,175,193,0.20)`, `0 12px 48px rgba(232,175,193,0.22)`, gold `0 8px 24px rgba(232,175,193,0.25)`.

**Section glows:** Top `radial-gradient(ellipse 100% 60% at 50% 0%, rgba(232,175,193,0.14) 0%, transparent 55%)`; bottom same shape, lower opacity.

### 2.2 Dark — Navy Luxury

| Role | Value | Usage |
|------|--------|--------|
| Background | `#0B1220` | Page/section bg |
| Card / Surface | `#101A2F` (HSL 221 49% 12%) | Cards, alternate sections |
| Foreground | `#F8FAFC` | Primary text |
| Muted text | Cool blue-grey | Secondary text |
| Primary | `#E8AFC1` | Buttons, links, footer heading |
| Border | Dark navy | Dividers, card borders |

**Gradients:** Hero `linear-gradient(135deg, #0B1220 0%, #101A2F 55%, accent 100%)`; section blobs `rgba(232,175,193,0.06–0.12)`. **Shadows:** `0 8px 32px rgba(0,0,0,0.6)` + optional rose border glow.

### 2.3 Gold (Shared)

`#D4AF37`, light `#E5C048`, dark `#C19B2E`. Icons, quotes, testimonials. Light theme: gold for stars/quotes; dark: rose gold `#E8AFC1`.

---

## 3. Homepage Sections

Single scroll, no vertical margin between sections; subtle radial gradient (rose in light, softer in dark). Each section: size, container, layout, components, card sizes, content/data.

**3.1 Hero `#home`** — Size: `min-h-[90vh]`/`min-h-screen`, `pt-24 pb-0`. Container: `container`, `px-4 md:px-6`, `grid lg:grid-cols-2 gap-4 md:gap-10 lg:gap-12`. Layout: two-col desktop (text | media), single-col mobile. Components: HeroBackgroundPattern, **StackedCards** (`@/components/ui/stacked-cards`) hero mode (1 video front + 2 images back, no cycling); cards `rounded-[2rem]`, `border-4 border-white/20`, spread/rotation on hover. Card wrapper: `max-w-[400px] md:max-w-[480px] lg:max-w-[560px]`, `aspect-[9/14]` mobile / `aspect-[10/9]` md+; front scale 1, back 0.95, spread ~50–80px, rotation ~6–12°. Content: H1 (Cormorant 5xl–7xl), description, "The Visionary Behind Phoenix", CTAs (Plan Your Event, View Our Work), stats (500+ Events, 12+ Years, 98% Satisfaction). Data: `getHeroMedia()`, `getSiteContentByKey('home-hero')`. Scroll indicator bottom centre.

**3.2 Collaborations `#venues`** — `py-20 md:py-28`, `overflow-hidden`. Container: `max-w-7xl mx-auto px-4 md:px-8 lg:px-16`. Layout: centred header `mb-8`; single venue = centred flex, multiple = infinite track `collaborations-logo-track` 50s. Components: SectionHeading ("Our Partners", "Trusted By *Elegant Venues*"); venue cards → `/collaborations/:id`. Cards: `w-[240px] sm:w-[280px] md:w-[320px]`, `aspect-[4/3]` image, `p-4` text; single `rounded-2xl` gradient border, multiple `rounded-xl` border+elevation. Data: `getActiveCollaborations()`, filter `selectedVenue` (LeadCaptureContext). Bg: light `bg-white`; dark `bg-surface`.

**3.3 Reels `#reels`** — `py-12 md:py-16`, `overflow-hidden`. Layout: single column **CardCarousel**. Components: **CardCarousel** (`@/components/ui/card-carousel`) — Swiper EffectCoverflow, autoplay 8000, pagination, nav; `images`, `autoplayDelay={2500}`, `title="Moments We've Crafted"`, `description="Phoenix Reel Wedding and More moments"`. Slide: 420px desktop / 300px mobile, `aspect-[3/4]`, `rounded-3xl`; centre slide can play video with sound. Data: `getMomentsReels()`. Bg: light `bg-white`; dark `bg-surface`.

**3.4 About `#about`** — `py-20 md:py-28`, `overflow-visible`. Container: `container max-w-7xl px-4 mx-auto`. Layout: `grid lg:grid-cols-2 gap-10 lg:gap-16` — left: eyebrow + heading + **AboutFlipCards**; right: paragraphs, blockquote, stats grid (2/4 cols); mobile "Read more" expandable. Components: **AboutFlipCards** (`@/components/ui/about-flip-cards`) — `getGalleryImagesForHomepage(18)` or 12 → 6 or 9 pairs, diagonal flip. Grid: `grid-cols-3`, `gap-3`, `max-w-4xl`, `aspect-[3/2]` (3×2) or 3×3; left col `min-h-[400px] lg:min-h-[640px]`; cards `aspect-square`, `rounded-xl`, flip 420ms delay, 850ms duration. Data: `getSiteContentByKey('about')`. Bg: light `bg-white`; dark `bg-surface`. Parallax (scale, y) left column Framer Motion.

**3.5 Events `#events`** — `py-20 md:py-28`. Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-10`. Layout: header ("What We Create", "Event Categories"); mobile: marquee `collaborations-logo-track` 45s; desktop: 12-col grid — col 4 StackedCards (left), col 4 category list, col 4 StackedCards (right). Components: **StackedCards** ×2, 3 images each, `autoplay={false}`; category buttons. Columns: `h-[450px] md:h-[550px]`, `py-10`, `p-4`; mobile cards `w-[200px]`, `aspect-[3/4]`, `rounded-xl`. Data: `getEventsForHomepage(6)` — title, slug, description, 6 images (3+3). CTA "View All Events" `btn-section-cta` → `/events`.

**3.6 Services `#services`** — `py-20 md:py-28`, `overflow-hidden`. Container: `max-w-7xl mx-auto px-4 md:px-8 lg:px-16`. Layout: header ("Our Services", "What We *Create*"); desktop: two rows **ExpandingCards** (first/second half); mobile: **MobileServiceCarousel** 4s; "Explore" if services > 10. Components: SectionHeading, **ExpandingCards** (`@/components/ui/expanding-cards`) — active 5fr vs 1fr; `h-[400px] md:h-[340px]`, `max-w-6xl`, `gap-2`; items `min-w-[80px]` md, `rounded-xl`. Mobile carousel `h-[400px]`, image 60%. Data: `getActiveServices()`. Icons: Crown, Palette, Building2, Gift, Speaker, Camera, Mic2, MapPin, Sparkles. Bg: light `bg-white`; dark `bg-surface`.

**3.7 Why Choose Us `#why-choose-us`** — `py-20 md:py-28`, `overflow-hidden`. Container: `container px-4 mx-auto`. Layout: header; stats `grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6` `mb-14 md:mb-16`; reasons "What Sets Us Apart" then `grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4` `max-w-4xl`. Components: SectionHeading, stat cards (motion.div, icon 14×14, Trophy/Heart/Users/Shield), reason rows (CheckCircle2 + text). Stat: `rounded-2xl`, `p-6 md:p-7`; reason: `rounded-xl`, `py-3.5 px-4`, icon `w-5 h-5`. Data: `getWhyChooseUsStats()`, `getWhyChooseUsReasons()`, `getSiteContentByKey('why-us')`; defaults 4 stats, 6 reasons. Bg: light `bg-background`; dark `bg-background`.

**3.8 Testimonials `#testimonials`** — Wrapper `py-20 md:py-28`; inner `py-4 md:py-10 lg:py-12`. Container: `container px-4 md:px-6`, grid `max-w-7xl` `gap-4`. Layout: badge, title, subtitle (max-w 900px); desktop `grid-cols-2 lg:grid-cols-3`; mobile carousel `max-w-sm h-[300px]` + dots. Components: **TestimonialsSection** (`@/components/ui/testimonials-1`), **TestimonialCard** (CardHeader p-4, stars, avatar/initials, name, role, quote). Data: `getFeaturedTestimonials(10)`, title "Kind Words from Our Clients", badgeText "Client Love". Bg: light `bg-white`; dark `bg-surface`.

**3.9 Quick reference**

| Section | Padding | Container | Components | Card sizes |
|---------|---------|-----------|------------|------------|
| Hero | pt-24 pb-0, min-h 90vh/screen | container | HeroBackgroundPattern, StackedCards | 400–560px, aspect 9/14 or 10/9 |
| Collaborations | py-20 md:py-28 | max-w-7xl | SectionHeading, venue cards | 240–320px, aspect 4/3 |
| Reels | py-12 md:py-16 | full width | CardCarousel (Swiper) | 420/300px, aspect 3/4 |
| About | py-20 md:py-28 | max-w-7xl | AboutFlipCards, text block | 3×2/3×3, aspect-square, min-h 400–640px |
| Events | py-20 md:py-28 | max-w-7xl | StackedCards ×2, category list | cols h 450–550px; mobile 200px, 3/4 |
| Services | py-20 md:py-28 | max-w-7xl | ExpandingCards (2 rows), MobileServiceCarousel | h 400/340px; mobile 400px |
| Why Choose Us | py-20 md:py-28 | container | SectionHeading, stat cards, reason rows | stat p-6/7; reason py-3.5 px-4 |
| Testimonials | py-20 md:py-28 | max-w-7xl | TestimonialsSection, TestimonialCard | 2–3 cols; mobile carousel h 300px |

**Chrome:** Navbar — scroll-aware, theme toggle, logo, Home/Events/Gallery/Contact, optional phone. Footer — `bg-gradient-to-br from-footer-bg to-black`, 2–4 cols, logo, tagline, Instagram/WhatsApp/Email, back to top. WhatsAppButton, MobileCTA.

---

## 4. Typography

**Fonts:** Headings `'Cormorant Garamond', 'Playfair Display', Georgia, serif`; Body `'Inter', system-ui, sans-serif`. Google: Cormorant Garamond 400/500/600/italic, Inter 300/400/500/600, Playfair Display 400–700/italic.

**Scale:** `--text-hero` clamp(2.5rem, 5vw+2rem, 5rem) | `--text-section` clamp(2rem, 3vw+1.5rem, 3.5rem) | `--text-subsection` clamp(1.5rem, 2vw+1rem, 2.25rem) | `--text-card` clamp(1.25rem, 1.5vw+0.75rem, 1.75rem) | `--text-body` 1rem | `--text-body-lg` 1.125rem | `--text-small` 0.875rem | `--text-caption` 0.8125rem.

**Line/letter:** Heading 1.25, body 1.75; hero -0.02em, heading -0.015em, body 0, eyebrow 0.12em. Section eyebrow: uppercase, caption, primary/muted; section heading: Cormorant, section size, 700, foreground; description: body, muted-foreground, centred. All h1–h6 use `var(--font-heading)`.

---

## 5. Buttons & CTAs

Primary: `bg-primary`, `text-primary-foreground`, rounded-full, warm shadow, hover scale ~1.05. Secondary: border primary, transparent, hover fill primary. Section: `btn-section-cta` — border primary/40, hover primary/10. Dark: `btn-section-cta-dark` — ivory border/text, hover ivory/10. Micro: lift `translateY(-1px)`, glow, no harsh jumps.

---

## 6. Cards & Surfaces

Glass: `glass-card`, backdrop blur, `var(--glass-shadow)`. Testimonial: solid bg, warm/navy+rose border, hover shadow. Photo frame: gradient primary/rose-gold, inset highlight. Service: 3D flip, perspective, backface-hidden.

---

## 7. Motion & Accessibility

`prefers-reduced-motion: reduce` disables/simplifies: hero mesh, reels/collaborations scroll, testimonial float, stat-card float, separator shimmer, petal fall. Smooth scroll; parallax hero/about. `.section-heading-reveal` + `.in-view` for fade/translate up.

---

## 8. Scrollbar

Hover or `scrollbar-visible`: track muted, thumb primary. Firefox `scrollbar-width: thin`.

---

## 9. File Reference

| Asset | Location |
|--------|----------|
| Theme vars | `src/index.css` (`:root`, `.dark`) |
| Tailwind | `tailwind.config.ts` |
| Section components | `src/components/` (HeroSection, CollaborationsSection, ReelsSection, AboutSection, EventsSection, ServicesSection, WhyChooseUsSection, TestimonialsSectionNew) |
| Homepage | `src/pages/Index.tsx` |
| Fonts | Google Fonts in `src/index.css` |

Single source of truth for theme, colours, sections, typography, and UI patterns.
