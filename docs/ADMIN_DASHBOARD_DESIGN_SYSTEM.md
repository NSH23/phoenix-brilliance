# Phoenix Admin Dashboard — Design System & UI Guide

Use this document to replicate the **look, feel, layout, and theme behavior** of the Phoenix Events admin dashboard in another project. The admin UI is intentionally **separate from the public marketing site**: neutral surfaces, restrained blue accent, glass panels, and CRM-style editing patterns.

---

## 1. Design philosophy

| Principle | What it means in practice |
|-----------|---------------------------|
| **Neutral first** | Backgrounds, cards, and sidebar use cool gray/slate tones. Color is not everywhere. |
| **Accent sparingly** | Blue (`--admin-accent`) is for CTAs, focus rings, active nav, small status chips, and thin top stripes — not large gradients on every card. |
| **Minimal & modern** | Generous whitespace, `rounded-2xl` panels, soft shadows, subtle backdrop blur on header/sidebar. |
| **CRM-grade editing** | Full-page record editors with back link, tabs (Details / Gallery), section panels, and sticky save actions. |
| **Mobile-native** | Bottom tab bar on phone, 44px touch targets, safe-area padding, PWA install on `/admin`. |
| **Scoped theming** | Admin tokens override shadcn CSS variables **only inside** `.admin-dashboard`, so the public site theme is untouched. |

---

## 2. Typography

### Font stack

| Role | Font | Where used |
|------|------|------------|
| **UI / body** | **Inter** (300–800) | All admin text, forms, tables, buttons |
| **Brand wordmark** | **Sora** (400–600) | “Phoenix” + “Admin” / “Agent” only |
| **Public site only** | Cormorant Garamond, Playfair Display | Not used in admin shell |

Google Fonts import (from `src/index.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sora:wght@400;500;600&display=swap');
```

Tailwind config (`tailwind.config.ts`):

```ts
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
  brand: ["Sora", "Inter", "system-ui", "sans-serif"],
}
```

Admin shell body (`src/index.css`):

```css
.admin-dashboard {
  font-family: Inter, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.011em;
}
.admin-dashboard .font-brand {
  font-family: Sora, Inter, system-ui, sans-serif;
}
```

### “Phoenix Admin” wordmark

Component: `src/components/admin/AdminBrand.tsx`

Structure:

```
Phoenix Admin
└─ "Phoenix"  → font-brand, font-semibold, text-foreground
└─ " Admin"   → font-brand, font-medium, admin-brand-accent (blue)
```

**Sizes:**

| Size | Title classes | Tagline |
|------|---------------|---------|
| `sm` | `text-lg tracking-[-0.03em]` | `text-[10px]` muted |
| `md` | `text-xl tracking-[-0.03em]` | `text-xs` muted |
| `lg` | `text-2xl sm:text-3xl tracking-[-0.02em]` | `text-xs` muted |

**Workspace variants:**

- Website workspace → **Phoenix Admin** — tagline: “Website content workspace”
- WP Agent workspace → **Phoenix Agent** — tagline: “WhatsApp lead workspace”

**Accent color for “Admin” / “Agent”:**

```css
.admin-brand-accent {
  color: hsl(var(--admin-accent));
}
```

**Replication tip:** Always split the wordmark into two spans — neutral weight on the product name, medium weight + accent on the portal suffix. Do not use a display serif for admin branding.

### Type scale (common patterns)

| Element | Classes / tokens |
|---------|------------------|
| Page title | `text-2xl font-semibold tracking-[-0.025em] md:text-3xl` (`adminPageTitleClass`) |
| Page subtitle | `text-sm text-muted-foreground md:text-base` |
| Section eyebrow | `text-[11px] font-semibold uppercase tracking-widest` + left accent bar |
| Section title (form) | `text-sm font-semibold tracking-tight` |
| Stat number | `text-[22px] font-extrabold tabular-nums md:text-3xl` |
| Nav group label | `text-[11px] font-semibold uppercase tracking-widest text-muted-foreground` |

---

## 3. Color system

All admin colors are **HSL components without `hsl()`** — consumed as `hsl(var(--token))`. Tokens are scoped with:

```css
html:has(.admin-dashboard) { /* light admin tokens */ }
html.dark:has(.admin-dashboard) { /* dark admin tokens */ }
```

Root wrapper on every admin page:

```tsx
<div className="admin-dashboard admin-shell-bg min-h-screen text-foreground">
```

### Core admin tokens

| Token | Light (HSL) | Dark (HSL) | Usage |
|-------|-------------|------------|-------|
| `--admin-accent` | `221 55% 46%` | `214 65% 58%` | Brand suffix, active nav, focus, stripes |
| `--admin-surface-2` | `220 14% 95%` | `224 16% 16%` | Explorer panes, nested surfaces |
| `--admin-border` | `220 13% 88%` | `224 12% 22%` | Stronger dividers |
| `--background` | `220 14% 96.5%` | `224 20% 9%` | Page background |
| `--foreground` | `224 18% 14%` | `210 18% 96%` | Primary text |
| `--card` | `0 0% 100%` | `224 18% 12.5%` | Cards, header, sidebar |
| `--muted` | `220 13% 93%` | `224 14% 16%` | Subtle fills |
| `--muted-foreground` | `220 9% 42%` | `220 10% 62%` | Secondary text |
| `--primary` | same as accent | same as accent | Buttons, links |
| `--border` | `220 13% 88%` | `224 12% 20%` | Borders |
| `--ring` | accent | accent | Focus rings |
| `--radius` | `0.75rem` | `0.75rem` | Base border radius (12px) |
| `--destructive` | `0 72% 51%` | `0 62% 50%` | Delete actions |

### Approximate hex (for design tools)

| Swatch | Light | Dark |
|--------|-------|------|
| Accent blue | `#3561c9` | `#5b9cf0` |
| Background | `#f4f5f7` | `#12151c` |
| Card | `#ffffff` | `#1a1f28` |
| Muted text | `#626a78` | `#949bab` |

### Dashboard stat card tones (optional color)

Overview cards use `data-tone` for **small** color hints only (top stripe + icon background + soft glow):

`blue` · `violet` · `cyan` · `amber` · `indigo` · `teal` · `rose` · `slate`

Each tone sets CSS variables: `--admin-icon-bg`, `--admin-icon-fg`, `--admin-card-stripe`, `--admin-card-glow`.

### Background atmosphere

Light mode shell uses **very subtle radial gradients** (blue, violet, cyan) on top of `--background`:

```css
.admin-dashboard.admin-shell-bg {
  background-color: hsl(var(--background));
  background-image:
    radial-gradient(ellipse 90% 55% at 100% -15%, hsl(221 85% 94% / 0.55), transparent 52%),
    radial-gradient(ellipse 70% 45% at 0% 105%, hsl(262 70% 94% / 0.35), transparent 48%),
    radial-gradient(ellipse 50% 40% at 50% 0%, hsl(199 80% 95% / 0.25), transparent 55%);
}
```

Dark mode uses deeper, low-opacity versions of the same hues. This gives depth without looking “colorful.”

---

## 4. Light & dark theme

### How it works

| Piece | File | Behavior |
|-------|------|----------|
| Storage key | `admin-theme` in `localStorage` | Values: `light` \| `dark` |
| Default | **Light** | Admin defaults to light even if OS prefers dark |
| Apply | `applyAdminTheme()` in `src/lib/adminTheme.ts` | Toggles `dark` class on `<html>` |
| Route sync | `AdminThemeSync.tsx` | On `/admin/*` → admin theme; leaving admin → public `theme` key |
| Toggle | Moon/Sun button in `AdminLayout` header | Persists to `admin-theme` |

**Important:** Public site uses `localStorage.theme`; admin uses `localStorage.admin-theme`. They do not fight each other.

### Implementation snippet (copy to new project)

```ts
const ADMIN_THEME_KEY = 'admin-theme';

export type AdminTheme = 'light' | 'dark';

export function getStoredAdminTheme(): AdminTheme {
  const stored = localStorage.getItem(ADMIN_THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function applyAdminTheme(theme: AdminTheme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
```

```tsx
// On admin routes only
useEffect(() => {
  if (pathname.startsWith('/admin')) {
    applyAdminTheme(getStoredAdminTheme());
  } else {
    applyPublicTheme(); // restore marketing site preference
  }
}, [pathname]);
```

### Visual differences light → dark

| Surface | Light | Dark |
|---------|-------|------|
| Shell bg | Soft gray + pastel radials | Near-black + muted radials |
| Cards | White, light shadow | `#1a1f28`, stronger shadow |
| Header / sidebar | `card / 0.86–0.98` + blur | Same structure, darker card |
| Glass shadow | `rgba(15,23,42,0.04–0.05)` | `rgba(0,0,0,0.35)` |
| Active nav | Blue tint + left inset bar | Brighter blue accent |

---

## 5. Layout architecture

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar 280px / 80px collapsed]  │  Main column          │
│  ┌──────────────────────────────┐  │  ┌──────────────────┐ │
│  │ Logo + Phoenix Admin         │  │  │ Sticky header    │ │
│  │ Nav groups                   │  │  │ Search · WS · 🔔 │ │
│  │ User + Logout                │  │  └──────────────────┘ │
│  └──────────────────────────────┘  │  Page title + actions │
│                                     │  Content max-w-7xl   │
│                                     │  [Mobile bottom nav] │
└─────────────────────────────────────────────────────────────┘
```

### Key layout constants

| Area | Spec |
|------|------|
| Sidebar width | **280px** expanded · **80px** collapsed |
| Sidebar transition | `width 0.3s ease` |
| Main content max width | `max-w-7xl` (~1280px), centered |
| Main padding | `px-4 md:px-8`, `pt-4 md:pt-6` |
| Mobile bottom padding | `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` |
| Header | Sticky, glass, min-height ~64px on desktop |
| Breakpoint | Sidebar hidden on `< md`; bottom nav shown `md:hidden` |

### Shell components

| Component | Purpose |
|-----------|---------|
| `AdminLayout` | Header + page title + `{children}` |
| `AdminSidebar` | Desktop left nav |
| `AdminBottomNav` | Mobile tab bar (Home, Events, Gallery, Alerts) |
| `AdminWorkspaceSwitcher` | Website ↔ WP Agent toggle in header |
| `AdminRecordEditShell` | Full-page CRM editor (back, tabs, save) |
| `AdminFormSection` | White panel with titled header strip |

---

## 6. Surface & glass patterns

### Glass header (`.admin-glass-header`)

- Background: `hsl(var(--card) / 0.86)` (dark: `/ 0.9`)
- `backdrop-filter: blur(16px) saturate(110%)`
- Soft box shadow from `--glass-shadow`
- **Signature detail:** 1px bottom gradient line (blue → violet → cyan fade)

### Glass sidebar (`.admin-glass-sidebar`)

- Background: `hsl(var(--card) / 0.98)`
- Same blur as header
- Right border: `border-border`

### Panel card (`.admin-panel-card`)

Used for form sections, stat areas, CRM blocks:

```css
.admin-panel-card {
  border-radius: 1rem; /* rounded-2xl */
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--card));
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 0 0 1px hsl(var(--admin-accent) / 0.04);
}
```

Form section header inside panel:

```
border-b border-border/50 bg-muted/20 px-5 py-3.5
```

### Active navigation (`.admin-nav-link-active`)

- Background: linear gradient from `admin-accent/12` to `accent`
- **Left inset bar:** `box-shadow: inset 3px 0 0 hsl(var(--admin-accent))`
- Icon color: accent blue
- Font weight: 600

### Mobile bottom nav active item

- Small **2px accent line** on top of icon
- `aria-current="page"` for accessibility

---

## 7. Motion & interaction

| Pattern | Implementation |
|---------|----------------|
| Page enter | `.admin-animate-in` — fade + 10px up, 450ms, ease `[0.22,0.61,0.36,1]` |
| Card hover | `hover:shadow-md`, `hover:border-border`, optional `active:scale-[0.98]` |
| Sidebar collapse | Framer Motion on main `marginLeft` (80 ↔ 280) |
| Stat cards | Staggered `motion.div` with 30ms delay cap |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables admin enter animation |

Keep motion **subtle**. No bouncy springs on data tables.

---

## 8. Component patterns to copy

### Page header (inside AdminLayout)

```tsx
<h1 className="text-2xl font-semibold tracking-[-0.025em] md:text-3xl">{title}</h1>
<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
```

Back link sits **above** title (left), not in the right action cluster:

```tsx
<Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
  <ArrowLeft /> Back to list
</Button>
```

### CRM edit shell tabs

```tsx
<TabsList className="mb-6 h-auto w-full justify-start gap-1 rounded-lg border bg-muted/30 p-1 sm:w-auto">
  <TabsTrigger className="rounded-md px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
    Details
  </TabsTrigger>
</TabsList>
```

### Buttons

| Action | Variant |
|--------|---------|
| Primary save | `Button` default (filled accent) |
| Secondary | `Button variant="outline"` |
| Delete | `Button variant="outline"` + `text-destructive` or icon-only trash |
| Ghost nav | `Button variant="ghost"` for back links |

### Lists → cards on admin index pages

- Image hero on card, gradient overlay, title on image
- Hover shadow, entire card clickable → full-page editor
- Overflow menu (⋮) on hover for extra actions

### Status / badges

- Active: `Badge variant="default"`
- Hidden/draft: `Badge variant="secondary"`
- New notification dot: `bg-[hsl(var(--admin-accent))]`

---

## 9. Iconography

- Library: **Lucide React** (outline icons, 16–20px in UI, 24px in empty states)
- Stroke weight: default; active mobile tabs use `stroke-[2.25]`
- Icon containers on stat cards: `rounded-lg` with tone-specific `--admin-icon-bg`

---

## 10. Spacing & radius cheat sheet

| Token | Value |
|-------|-------|
| Base radius | `0.75rem` (12px) |
| Cards / panels | `rounded-2xl` (16px) or `rounded-xl` (12px) |
| Buttons / inputs | `rounded-md` / `rounded-lg` |
| Section padding | `px-5 py-4` body, `px-5 py-3.5` header |
| Grid gaps | `gap-4` to `gap-6` for forms; `gap-1` for dense folder grids |
| Touch targets | min **44×44px** (`.touch-target`) |

---

## 11. Tech stack (for reference)

| Layer | Choice |
|-------|--------|
| Framework | React + Vite |
| Routing | React Router |
| Styling | Tailwind CSS 3 + CSS variables |
| Components | shadcn/ui (Radix primitives) |
| Animation | Framer Motion (layout + lists) |
| Icons | Lucide |
| Dark mode | `class` strategy on `<html>` |

---

## 12. File map (this repo)

| Concern | Path |
|---------|------|
| All admin CSS tokens & utilities | `src/index.css` (section “Admin dashboard only”) |
| Theme persistence | `src/lib/adminTheme.ts` |
| Route theme sync | `src/components/admin/AdminThemeSync.tsx` |
| Layout shell | `src/components/admin/AdminLayout.tsx` |
| Brand wordmark | `src/components/admin/AdminBrand.tsx` |
| Shared class names | `src/components/admin/adminStyles.ts` |
| Form sections | `src/components/admin/AdminFormSection.tsx` |
| Full-page editor | `src/components/admin/AdminRecordEditShell.tsx` |
| Sidebar / mobile nav | `AdminSidebar.tsx`, `AdminBottomNav.tsx` |
| Tailwind fonts | `tailwind.config.ts` |

---

## 13. Porting checklist (new dashboard)

1. **Add fonts:** Inter + Sora (Google Fonts or `@fontsource`).
2. **Add wrapper:** `.admin-dashboard.admin-shell-bg` on root admin layout.
3. **Copy CSS block:** Admin token overrides under `html:has(.admin-dashboard)` (light + dark).
4. **Configure Tailwind:** `darkMode: ['class']`, map colors to `hsl(var(--token))`.
5. **Separate theme storage:** `admin-theme` key, sync on route enter/exit.
6. **Build layout:** Collapsible sidebar (280/80) + sticky glass header + `max-w-7xl` content.
7. **Brand component:** Two-part wordmark with `.font-brand` + accent suffix.
8. **Panels:** Use `.admin-panel-card` + section headers with `bg-muted/20`.
9. **Navigation:** Active state with left accent inset bar, not full solid fill.
10. **Mobile:** Bottom nav + safe-area padding; hide sidebar below `md`.
11. **Use accent sparingly:** Primary buttons, focus, active nav, small chips — not full-page backgrounds.
12. **Optional:** Subtle radial background gradients on shell for polish.

---

## 14. What makes it feel “nice” (summary)

1. **Cool neutral base** — not pure white/black; slightly blue-gray backgrounds.
2. **One accent color** — consistent blue for actions and wayfinding.
3. **Sora only on the brand** — everything else Inter keeps it professional.
4. **Tight tracking on headings** — `-0.025em` to `-0.03em` feels modern.
5. **Glass + thin gradient hairline** on header — premium without clutter.
6. **Rounded-2xl cards** with whisper shadows and accent hairline ring.
7. **Clear hierarchy** — eyebrow labels, page title, muted subtitle, then content panels.
8. **Full-page editors** — not modal dialogs for complex records.
9. **Responsive parity** — real mobile nav, not shrunk desktop.
10. **Independent dark mode** — admin defaults to light; user toggles persist separately from marketing site.

---

**Companion docs:** [`ADMIN_DASHBOARD_MOBILE_TABLET_UX.md`](./ADMIN_DASHBOARD_MOBILE_TABLET_UX.md) (admin) · [`WEBSITE_MOBILE_TABLET_UX.md`](./WEBSITE_MOBILE_TABLET_UX.md) (public website mobile layout — no theme/colors)

*Generated from the Phoenix Brilliance codebase (`phoenix-brilliance`). Update this doc when admin tokens or layout components change.*
