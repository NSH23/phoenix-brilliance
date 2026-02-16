# Phoenix Events & Production — UI & Design System

This document describes the website’s user interface: layout, themes, colours, typography, components, and motion. Use it for consistency when adding or changing UI.

---

## 1. Overview

**Product:** Phoenix Events & Production — luxury event planning and production (weddings, corporate, celebrations) in Pune, Maharashtra.

**Design direction:** Heritage Gold & Sophistication (phoenix-foundation-2). Elegant serif headings, clean sans body, warm gold accents, and optional dark mode. The UI aims for a premium, editorial feel suitable for high-end events.

**Tech stack:**
- **React** (Vite) + **TypeScript**
- **Tailwind CSS** for layout and utilities
- **CSS custom properties** in `src/index.css` for theming
- **Framer Motion** for scroll and hover animations
- **shadcn-style** components in `src/components/ui/`
- **React Router** for navigation

---

## 2. Theme System

### 2.1 Light and dark modes

- **Two themes:** Light (default) and Dark.
- **Activation:** The `dark` class on `<html>` switches to dark theme. No class = light.
- **Toggle:** Navbar includes a **ThemeToggle** (sun/moon). It updates `document.documentElement.classList` and saves preference in `localStorage` under the key `theme` (`"light"` or `"dark"`).
- **First paint:** A small script in `index.html` runs before React and applies the saved theme (or `prefers-color-scheme: dark`) so the first paint matches the user’s choice and avoids a flash.

### 2.2 CSS variables

All theme-dependent colours and some layout tokens are defined as CSS custom properties in `src/index.css`:

- **`:root`** — Light theme (default).
- **`.dark`** — Dark theme overrides.

Components use Tailwind tokens that map to these variables (e.g. `bg-background`, `text-primary`), so changing theme only requires toggling the `dark` class.

---

## 3. Colour Palette

### 3.1 Light theme — Heritage Gold

| Role | CSS variable / value | Usage |
|------|----------------------|--------|
| **Primary (Gold)** | `--primary: 43 74% 49%` (HSL) ≈ #D4AF37 | CTAs, accents, links, focus rings |
| **Primary foreground** | `--primary-foreground: 30 28% 15%` | Text on primary buttons |
| **Background** | `--background: 30 33% 97%` | Page and section backgrounds |
| **Foreground** | `--foreground: 0 0% 18%` | Main text |
| **Card** | `--card: 0 0% 100%` | Cards, modals, panels |
| **Muted** | `--muted: 43 20% 92%` | Muted backgrounds |
| **Muted foreground** | `--muted-foreground: 0 0% 38%` | Secondary text |
| **Border** | `--border: 43 25% 86%` | Borders, dividers |
| **Section about** | `--section-about: 43 30% 96%` | About section background |
| **Section reels** | `--section-reels: 43 25% 95%` | Reels section background |

**Named hex (reference):**
- Amber gold: `#D4AF37`
- Light gold: `#E5C048`
- Dark gold: `#C19B2E`
- Espresso: `#3E2723`
- Navy: `#1A1A2E`
- Ivory: `#FAFAF8`
- Champagne gradient: `#FFFBF5` → `#FFF8F0` → `#FFF4E6`

### 3.2 Dark theme

| Role | Behaviour |
|------|-----------|
| **Primary** | Gold accent: `43 65% 55%` |
| **Background** | Dark base: `240 18% 8%` |
| **Foreground** | Light text: `43 15% 92%` |
| **Card / muted / border** | Dark surfaces with same gold accent |

Dark theme reuses the same semantic names (e.g. `--primary`, `--background`) so components stay the same; only the variable values change under `.dark`.

### 3.3 Section-specific backgrounds

- **About:** `bg-section-about` (warm, slight gold tint).
- **Reels:** `bg-section-reels`.
- **Contact:** `bg-section-contact`.
- **Footer (light):** Espresso → navy gradient (`--light-footer-bg: #3E2723`).

---

## 4. Typography

### 4.1 Font families

Defined in `tailwind.config.ts` and loaded from Google Fonts in `index.css`:

| Tailwind name | Font stack | Use |
|---------------|------------|-----|
| **sans** | Poppins, Inter, DM Sans, system-ui | Body, labels, UI |
| **serif** | Playfair Display, Cormorant Garamond, Georgia | Decorative serif |
| **display** | Playfair Display, Cormorant Garamond, Georgia | Headings, section titles |
| **hero** | Cormorant Garamond, Playfair Display, Georgia | Hero headlines |

- **Headings:** Prefer `font-display` or `font-serif`.
- **Body and UI:** Prefer `font-sans`.

### 4.2 Type scale (Tailwind)

| Token | Approx. size | Line height | Use |
|-------|--------------|-------------|-----|
| `text-hero` | clamp(2.5rem → 5rem) | 1.15 | Hero headline |
| `text-hero-sm` | clamp(2.25rem → 4.5rem) | 1.2 | Hero subtitle |
| `text-section` | clamp(2rem → 3.5rem) | 1.2 | Section headings |
| `text-subsection` | clamp(1.5rem → 2.25rem) | 1.25 | Subsections |
| `text-card-title` | clamp(1.25rem → 1.75rem) | 1.3 | Card titles |
| `text-body-lg` | 1.125rem | 1.75 | Lead / large body |
| `text-body` | 1rem | 1.75 | Body |
| `text-small` | 0.875rem | 1.6 | Small copy |
| `text-caption` | 0.8125rem | 1.5 | Captions, labels |

### 4.3 Letter spacing

- **Hero:** `-0.02em`
- **Headings:** `-0.015em` to `-0.01em`
- **Labels / eyebrows:** `0.12em`–`0.2em` (uppercase)

### 4.4 Section typography (utility classes in `index.css`)

- **`.section-eyebrow`** — Small uppercase label above a section title (e.g. “About Us”, “Moments”). Primary colour in light, muted in dark.
- **`.section-heading`** — Main section title (large, display font).
- **`.section-description`** — Short paragraph under the heading (muted, max-width).
- **`.btn-section-cta`** — Primary section CTA: rounded-full, border primary, hover fill.

---

## 5. Layout & Grid

### 5.1 Container

- **Tailwind:** `container` is centered with padding `1.5rem`.
- **Breakpoints (Tailwind default):**  
  `sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px` · `2xl: 1400px`

### 5.2 Content width

- **Wide sections:** `max-w-7xl mx-auto px-4 md:px-8 lg:px-16`
- **Narrow content:** `max-w-6xl` or `max-w-3xl` where appropriate (e.g. testimonials, reels grid)

### 5.3 Section spacing

- **`.home-section`** — Vertical padding: `py-16 sm:py-20 lg:py-24`
- **`.home-section-inner`** — Inner wrapper: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`

Many sections use similar padding (e.g. `py-16 md:py-24 lg:py-32`) for rhythm.

### 5.4 Homepage structure (order of sections)

1. **Hero** (`#home`)
2. **Collaborations / Venues** (`#venues`)
3. **About** (`#about`)
4. **Reels** (`#reels`)
5. **Video** (`#video`)
6. **Events** (`#events`)
7. **Services** (`#services`)
8. **Testimonials** (`#testimonials`)

No contact section on the homepage; contact is a separate page.

---

## 6. Components & Patterns

### 6.1 Global chrome

- **Navbar:** Fixed, hide-on-scroll-down, show-on-scroll-up. Logo, nav links (Home, Events, Services, Gallery, Contact), theme toggle, “Get Quote” CTA. Responsive: hamburger menu on small screens.
- **Footer:** Dark gradient (espresso → navy), links, contact, social. Uses `--footer-bg`, `--footer-heading` (primary/gold), `--footer-link`, etc.
- **WhatsAppButton:** Floating action button (typically bottom-right).
- **MobileCTA:** Bottom bar or CTA for small screens.

### 6.2 Hero

- **HeroSection:** Full-width hero with headline, optional subline, and CTA. Uses `bg-background` and optional mesh/gradient (`--light-hero-mesh`, champagne-style). Can include event-type tabs or auto-rotating copy.
- **SplitScreenHero** (used on some pages): Two panels (e.g. text + image/video), theme-aware gradients and mesh.

### 6.3 Section blocks

- **AboutSection:** Split layout (title + line on left, story on right). Optional stacked cards (`StackedCardsInteraction`) and timeline. Soft radial gradients for depth.
- **ReelsSection:** “Moments” / “Captured Live” heading; grid of 3 reel cards (first can be video `reel 1.mp4`). Cards: aspect 9/16, rounded, gold-tinted shadow, play overlay.
- **VideoFeatureSection:** Headline + an embedded or full-width video (e.g. `AnimatedVideoOnScroll`) and a CTA.
- **EventsSection:** Three columns: left (stacked cards), center (event category list), right (stacked cards). Uses `StackedCardsInteraction`; hover reveals back cards.
- **ServicesSection:** Horizontal scroll of service cards (image, title, short description). Links to `/services`.
- **TestimonialsSection:** “Kind Words” heading; 4-column infinite vertical scroll of testimonial cards (masked top/bottom). Uses `TestimonialsColumn` and Framer Motion.

### 6.4 Reusable UI (shadcn-style)

- **Location:** `src/components/ui/`
- **Examples:** Button, Card, Input, Dialog, Sheet, Tabs, etc. Use `cn()` from `@/lib/utils` and Tailwind + CSS variables so they respect light/dark.
- **StackedCardsInteraction:** Stack of 3 cards; hover spreads them and reveals back cards. Used in About and Events.
- **TestimonialsColumn:** Single column of repeating testimonial cards with vertical motion for “infinite scroll” effect.

### 6.5 Buttons

- **Primary (filled):** Gold background, dark text (e.g. “Get Quote”). Uses `bg-primary text-primary-foreground` and hover darkening.
- **Secondary (outline):** `.btn-section-cta` — border primary, transparent fill, hover `bg-primary/10`.
- **Dark variant:** `.btn-section-cta-dark` — ivory border and text on dark backgrounds.

---

## 7. Visual Effects & Motion

### 7.1 Animations (Tailwind + CSS)

- **Hero mesh:** `heroMeshFloat` — slow gradient shift (e.g. 18s).
- **Page mesh (Events, Services, Gallery, Collaborations):** `pageMeshFloat` — 25–28s, theme-aware (champagne in light, navy → rose gold in dark).
- **Scroll indicator:** Bounce (e.g. `heroScrollBounce`).
- **Stat cards:** Float + hover lift; decorative line and icon scale on hover.
- **Testimonial float cards:** Six different float animations; pause on hover.
- **Marquee:** Horizontal scroll for banners; pause on hover.
- **Petal fall:** Optional hero decoration (sakura-style petals).

All keyframe animations respect `prefers-reduced-motion: reduce` (animation disabled or simplified).

### 7.2 Framer Motion

- **Scroll reveal:** Sections or blocks use `whileInView` with `viewport={{ once: true }}` and `opacity` / `y` for fade-up.
- **Stagger:** Children animate with `staggerChildren` for lists or card grids.
- **Count-up:** Stats (e.g. About) use a custom count-up when the block enters view.
- **Stacked cards:** Hover triggers `x` and `rotate` so back cards slide out.

### 7.3 Shadows

- **Light:** Soft, warm (e.g. `rgba(62, 39, 35, 0.04–0.12)`). Gold glow: `rgba(212, 175, 55, 0.25–0.30)`.
- **Dark:** Deeper shadows (e.g. `rgba(0, 0, 0, 0.3–0.5)`).
- **Utility:** `shadow-heritage-sm` through `shadow-heritage-xl`, `shadow-gold-glow`, `shadow-luxury`.

### 7.4 Glassmorphism

- **Variables:** `--glass-bg`, `--glass-border`, `--glass-shadow`.
- **Usage:** Navbar (when scrolled), cards, or overlays with `backdrop-blur`.

---

## 8. Responsive Behaviour

- **Mobile-first:** Base styles for small screens; `sm:`, `md:`, `lg:` for larger.
- **Navigation:** Full-screen overlay menu on small viewports; horizontal nav on `lg:` and up.
- **Grids:** Services and events use horizontal scroll or 2/4-column grids on smaller screens; 4-column testimonials can stack or scroll.
- **Typography:** Section and hero use `clamp()` so size scales with viewport.
- **Touch:** Buttons and cards have adequate hit areas; video in reels uses `playsInline` for mobile.

---

## 9. Accessibility & Preferences

- **Focus:** Focus rings use `--ring` (primary/gold). Buttons and links are focusable.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables or simplifies float, mesh, and testimonial animations.
- **Contrast:** Primary foreground on primary background meets contrast for text (e.g. dark on gold).
- **Semantics:** Sections use `<section>` and headings hierarchy; CTAs and nav use `<button>` or `<a>` as appropriate.

---

## 10. File Reference

| Purpose | File(s) |
|---------|--------|
| Theme variables, utilities, animations | `src/index.css` |
| Tailwind config (fonts, colours, keyframes) | `tailwind.config.ts` |
| Theme toggle (class + localStorage) | `src/components/ThemeToggle.tsx` |
| First-paint theme script | `index.html` (inline script) |
| UI primitives | `src/components/ui/*` |
| Layout helpers | `src/lib/utils.ts` (`cn`) |

---

## 11. Summary

- **Themes:** Light (Heritage Gold) and Dark (gold accent on dark base), switched via `dark` class and persisted in `localStorage`.
- **Colours:** HSL-based CSS variables; primary gold `43 74% 49%` (light) and `43 65% 55%` (dark); semantic tokens for background, foreground, card, muted, border.
- **Typography:** Playfair Display / Cormorant Garamond for headings, Poppins/Inter for body; responsive scale via `clamp()` and Tailwind tokens.
- **Layout:** Centered containers, `max-w-7xl` for main content, consistent section padding and `.home-section` / `.home-section-inner` patterns.
- **Components:** Navbar, footer, hero, section blocks (About, Reels, Video, Events, Services, Testimonials), shadcn-style UI, stacked cards, testimonial columns.
- **Motion:** Framer Motion for scroll and hover; CSS for mesh, float, marquee, and reduced-motion overrides.

Keeping new UI aligned with this document will keep the site consistent and maintainable.
