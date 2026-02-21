# Phoenix Brilliance — Tech Stack & Project Overview

**Phoenix Events & Production** is a modern marketing and management website for an event planning and production company. It includes a public site (homepage, gallery, events, collaborations, contact) and an admin dashboard for content and inquiries.

---

## What We're Doing

- **Public website**: Showcase events, wedding/event gallery, partner venues (collaborations), services, testimonials, and contact/lead capture.
- **Lead capture**: Homepage modal and contact form collect name, phone, email, event type, venue (synced with collaborations), and message; stored in Supabase and visible in admin.
- **Admin dashboard**: Authenticated admins manage events, albums, gallery images, services, collaborations (venues), testimonials, inquiries, site content/hero/media, team, and settings.
- **Content-driven**: Hero videos, reels, site copy, and media are configurable via admin and Supabase (content_media, site_content, etc.).

---

## Tech Stack

### Core

| Layer | Technology |
|--------|------------|
| **Runtime / Build** | Node.js, **Vite** 5 (ESM, fast HMR) |
| **Language** | **TypeScript** 5 |
| **UI Framework** | **React** 18 |
| **Routing** | **React Router** 6 (lazy-loaded routes) |
| **Styling** | **Tailwind CSS** 3, **tailwindcss-animate** |

### UI & Components

| Purpose | Technology |
|--------|------------|
| **Component primitives** | **Radix UI** (Dialog, Select, Tabs, Accordion, etc.) |
| **Component library** | **shadcn/ui**-style components under `src/components/ui/` |
| **Icons** | **Lucide React** |
| **Animations** | **Framer Motion** (hero, sections, modals) |
| **Carousels / Reels** | **Swiper** (coverflow, autoplay, navigation) |
| **Forms** | **React Hook Form**, **Zod**, **@hookform/resolvers** |
| **Toasts** | **Sonner** |
| **Themes** | **next-themes** (dark/light) |

### Backend & Data

| Purpose | Technology |
|--------|------------|
| **Backend / Auth / DB / Storage** | **Supabase** |
| **Client** | `@supabase/supabase-js` (auth, REST, Realtime) |
| **Data fetching** | **TanStack React Query** (used in parts of the app), plus direct Supabase calls in `src/services/` |

### Other Libraries

- **date-fns** — dates
- **recharts** — admin charts
- **react-helmet-async** — SEO meta tags
- **three** / **@types/three** — optional 3D/visuals
- **embla-carousel-react** — additional carousels
- **class-variance-authority**, **clsx**, **tailwind-merge** — class names and variants

### Dev & Quality

- **ESLint** (TypeScript, React, React Hooks)
- **Vitest** + **Testing Library** — unit/integration tests
- **PostCSS**, **Autoprefixer** — CSS pipeline

---

## Project Structure (high level)

```
src/
├── App.tsx                 # Routes, providers, lazy-loaded pages
├── main.tsx
├── components/             # Shared UI
│   ├── ui/                 # Buttons, dialogs, cards, carousel, stacked-cards, etc.
│   ├── admin/              # Admin layout, protected route
│   ├── HeroSection.tsx
│   ├── LeadCaptureModal.tsx
│   ├── ReelsSection.tsx
│   └── ...
├── contexts/               # SiteConfigContext, AdminContext
├── pages/                  # Public: Index, Contact, Gallery, Events, Collaborations, etc.
├── pages/admin/            # Dashboard, Events, Albums, Gallery, Services, Collaborations,
│                           # Testimonials, Inquiries, Content, ContentMedia, Team, Settings
├── services/               # API / Supabase
│   ├── supabase (lib)      # Supabase client
│   ├── inquiries.ts        # Lead/inquiry create + admin CRUD
│   ├── formOptions.ts      # Venue (from collaborations) & event type (from events) for forms
│   ├── events.ts, albums.ts, gallery.ts, collaborations.ts
│   ├── contentMedia.ts     # Hero videos, reels
│   ├── siteContent.ts, pageHeroContent.ts
│   └── ...
├── lib/                    # utils, supabase client, admin menu
└── supabase/
    └── migrations/         # DB schema, RLS, grants (e.g. inquiries)
```

---

## Main Features (by area)

### Public site

- **Homepage**: Hero with stacked video cards (front plays, back show thumbnails; advance on end), sections (venues/collaborations, reels, about, services, testimonials, etc.), lead capture modal (session/local storage so it shows once).
- **Gallery**: Event-type listing → albums → images.
- **Events**: Event types and detail pages.
- **Collaborations**: Partner venues with detail pages.
- **Contact**: Form with event type, venue (from collaborations), message; submits to Supabase and can open WhatsApp.

### Forms & lead capture

- **Lead capture modal**: Name, phone, email, event type, venue (dropdown from collaborations + “Other”), optional Instagram/message; stored in `inquiries` (Supabase).
- **Contact page**: Same venue/event options; inquiry + optional WhatsApp redirect.
- **Form options**: `formOptions.ts` — `getVenueOptions()` (from active collaborations) and `getEventTypeOptions()` (from active events); “Other” with custom field where needed.

### Admin

- **Auth**: Supabase Auth; admin routes protected by `admin_users` table.
- **Inquiries**: List/filter/read/update/delete; realtime for new entries.
- **Content**: Site content keys (e.g. home-hero), content media (hero videos, reels).
- **Events, Albums, Gallery, Services, Collaborations, Testimonials, Team, Settings**: CRUD and configuration that drive the public site.

### Video behavior

- **Hero stacked cards**: One front video plays; back cards show thumbnails (`preload="metadata"`). On front video end, active index advances and next video plays. Mute/unmute on front card.
- **Reels (“Moments We've Crafted”)**: Carousel rotates only; no autoplay. Play icon on center slide; click plays that video with sound and stops rotation. On end, carousel advances and next center video plays.

---

## Data (Supabase)

- **Tables (examples)**: `inquiries`, `events`, `event_images`, `albums`, `gallery_images`, `collaborations`, `collaboration_images`, `content_media`, `site_content`, `admin_users`, etc.
- **Auth**: Supabase Auth; admin access gated by `admin_users`.
- **RLS**: Used on tables (e.g. `inquiries`: anon can INSERT only, admins SELECT/UPDATE/DELETE).
- **Realtime**: Optional for `inquiries` (admin notifications).

---

## Environment

- **Vite env**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (use anon/public key in the app).
- **Supabase**: Project URL and anon key from Project Settings → API.

---

## Scripts

| Command | Purpose |
|--------|--------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |

---

## Summary

We're building a **React + TypeScript + Vite** front end with **Tailwind** and **Radix/shadcn**-style components, **Framer Motion** and **Swiper** for motion and carousels, and **Supabase** for auth, database, storage, and optional realtime. The app serves as the main marketing and operations site for Phoenix Events & Production, with a clear split between public pages (hero, gallery, events, collaborations, contact, lead capture) and an admin dashboard for content and inquiries.
