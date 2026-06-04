# Website Mobile & Tablet UX — Optimization Guide

**Purpose:** Paste this into another Cursor project to make an **existing website** properly optimized for phone and tablet. That project already has its own colors, fonts, and theme — this doc covers **only layout, navigation, touch behavior, responsive patterns, and interaction rules**.

**Source reference:** Patterns extracted from the Phoenix Brilliance public marketing site.

**Do not use this doc for:** color palettes, typography choices, dark/light theme styling, or brand visual identity.

---

## 1. Golden rules

| Rule | Why |
|------|-----|
| **Morph layouts by breakpoint** | Phone gets a different *structure* (carousel, snap scroll, stacked CTAs), not a zoomed-out desktop page. |
| **Never rely on hover** | Desktop hover reveals (expand panels, show buttons, swap images) must have a mobile equivalent (tap, carousel, always-visible control). |
| **Conversion always reachable** | Primary actions (contact, book, call, chat) stay fixed or one tap away on phone. |
| **44px minimum touch targets** | Menu, call, social, close, and icon buttons ≥ 44×44px. |
| **Pad for fixed chrome** | Any fixed top nav or bottom bar needs matching `padding-top` / `padding-bottom` on page content. |
| **Respect safe areas** | Use `env(safe-area-inset-top/bottom)` for notched phones and installed PWAs. |
| **Disable heavy motion on small screens** | Scroll parallax, hover-driven animation, and long stagger chains off or reduced on phone. |
| **Lazy-load below the fold** | Hero + nav first; heavy sections load after first paint. |

---

## 2. Breakpoints (Tailwind-style)

Use these as the standard cutoffs when adapting an existing desktop site:

| Breakpoint | Width | Typical website behavior |
|------------|-------|---------------------------|
| **Phone** | `< 640px` | 1 column, stacked buttons, bottom action bar, hamburger nav, 2-col photo grids max |
| **`sm`** | `≥ 640px` | 2-col form fields, 2-col stat grids, side-by-side CTAs |
| **`md`** | `≥ 768px` | Tablet: some desktop patterns start (multi-column cards, footer on all pages) |
| **`lg`** | `≥ 1024px` | **Desktop nav** replaces hamburger; hero 2-column; complex hover layouts |
| **`xl`** | `≥ 1280px` | Wider containers, full multi-column grids |

**Important:** Public marketing sites often switch nav at **`lg` (1024px)**, not `md`. Tablet portrait may still use the mobile menu unless you explicitly want inline nav from `md`.

**JS hooks (when CSS alone is not enough):**

```ts
const MOBILE_NAV_BREAKPOINT = 1024; // lg — show hamburger below this
const DISABLE_PARALLAX_BELOW = 1024; // scroll-linked motion only at lg+
const BOTTOM_BAR_HIDDEN_FROM = 768;  // md — hide fixed bottom bar on tablet+
```

---

## 3. Page shell — what every page needs

### 3.1 Fixed top navigation

```
Phone / tablet (< lg):
┌─────────────────────────────┐
│ [Logo]              [≡]    │  ← fixed, z-50, h-16 (sm: h-20)
├─────────────────────────────┤
│                             │
│   Content (pt-24 or pt-28)  │  ← clears fixed header
│                             │
└─────────────────────────────┘

Desktop (≥ lg):
┌─────────────────────────────┐
│ [Logo]  Link Link Link  [CTA]│
├─────────────────────────────┤
│   Content (pt-20)           │
└─────────────────────────────┘
```

**Scroll behavior (recommended):**

- Hide navbar when user scrolls **down** (after ~100px from top).
- Show navbar when user scrolls **up** or is near top.
- **Always show** while mobile menu is open.
- Use passive scroll listener for performance.

**Content offset:**

```tsx
// Match your header height
<main className="pt-24 sm:pt-28 lg:pt-20">
```

### 3.2 Mobile full-screen menu

Do **not** use a tiny dropdown. Use a full overlay:

```
┌─────────────────────────────┐
│ [Logo]              [✕]    │  ← navbar stays
├─────────────────────────────┤
│  ┌ Home                 ┐  │
│  ├ Services             ┤  │  ← each link: min-h ~52px, py-4, full width
│  ├ Gallery              ┤  │
│  ├ About                ┤  │
│  └ Contact              ┘  │
│  [ Primary CTA — full width ]│
└─────────────────────────────┘
```

**Required behaviors:**

1. `position: fixed; inset: 0; top: [header-height]` for overlay.
2. **`overflow: hidden` on `body`** while menu is open — prevents background scroll.
3. Each link is a **large row** (not inline text links).
4. Close menu on link tap / route change.
5. Primary CTA (call, book, contact) at bottom of menu — full width.
6. `aria-label` on hamburger/close; focus trap optional but recommended.

**Breakpoint class pattern:**

```tsx
<button className="lg:hidden" aria-label="Open menu" />
<nav className="hidden lg:flex">{/* desktop links */}</nav>
```

### 3.3 Fixed bottom action bar (phone only)

For lead-gen / service sites, a **bottom bar on phone** beats burying contact in the footer:

```
┌─────────────────────────────┐
│                             │
│         page content        │
│                             │
├─────────────────────────────┤
│ [ Chat — flex-1 ] [📞] [Book — flex-1 ] │  ← md:hidden, z-40
└─────────────────────────────┘
     + safe-area-inset-bottom
```

| Element | Spec |
|---------|------|
| Visibility | `fixed bottom-0 left-0 right-0 md:hidden` |
| Height | ~56–64px + safe area |
| Primary actions | 2 flex-1 text buttons + 1 square icon button (56×56px) |
| Press feedback | `active:scale-95` |
| z-index | Below modals, above content (e.g. z-40) |
| Entrance | Delay ~1–2s after load so it does not compete with hero |

**Desktop/tablet alternative:** Single floating action button (FAB) bottom-right — `hidden md:block`, ~56px circle, same primary action (chat/call).

**Content padding when bottom bar exists:**

```tsx
<section className="pb-20 sm:pb-24 md:pb-16">
// or precise:
pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0
```

---

## 4. Footer strategy

**Recommended pattern** (reduces clutter on small screens):

| Page type | Phone | Tablet+ |
|-----------|-------|---------|
| Homepage | Show compact footer | Full footer |
| Inner pages (contact, gallery, detail) | **Hide footer** — bottom bar + nav cover contact | Show footer |

```tsx
<footer className={isHomepage ? '' : 'hidden md:block'}>
```

If footer is always shown, increase bottom padding so it does not sit under the fixed action bar.

Footer mobile layout:

- `grid-cols-2` on phone → `lg:grid-cols-4` on desktop.
- Social icons: **44×44px** minimum.
- Center-align on phone; left-align from `lg`.

---

## 5. Section spacing & containers

Keep vertical rhythm consistent without naming any theme:

```tsx
// Section vertical padding — scale up with viewport
className="py-16 sm:py-20 lg:py-24"

// Inner content width
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

**Headings on phone:** Use fluid size (`clamp()` or responsive classes like `text-3xl sm:text-4xl lg:text-5xl`) — never a fixed desktop-only size that overflows 320px width.

**Long homepage:** Sections can stack with **zero gap** between bands (`margin: 0`) for seamless scroll — optional, but common on landing pages.

---

## 6. Hero section — mobile vs tablet vs desktop

### Layout morph

| Viewport | Layout |
|----------|--------|
| Phone | **Single column:** headline → subcopy → CTAs → media (image/video/cards) |
| Tablet | Same or slightly wider; CTAs can sit side-by-side from `sm` |
| Desktop (`lg+`) | **Two columns:** copy left, media right |

### Mobile hero checklist

- [ ] `min-h-[85vh]` or `min-h-screen` with top padding for fixed nav (`pt-24+`).
- [ ] Headline centered on phone, left-aligned from `lg` if desired.
- [ ] **CTAs stacked** on phone: `flex flex-col sm:flex-row gap-3`.
- [ ] Button height **≥ 48px** (`h-12` minimum).
- [ ] Stats/trust row: horizontal with dividers, wraps if needed.
- [ ] **No scroll parallax** on phone — set motion offset to `0` below `lg`.
- [ ] Hero media: constrain max-width on phone so cards/video do not overflow viewport.
- [ ] `overflow-hidden` on phone hero container if decorative layers bleed.

### CTA button pattern

```tsx
<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
  <Button className="w-full sm:w-auto h-12 min-h-[48px]">Primary</Button>
  <Button className="w-full sm:w-auto h-12 min-h-[48px]" variant="outline">Secondary</Button>
</div>
```

---

## 7. Section-by-section responsive patterns

When porting an existing desktop site, map each section type to a mobile strategy:

### 7.1 Card grids (services, team, portfolio)

```tsx
// Phone → tablet → desktop
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6
```

- Entire card clickable (`<a>` or `role="button"` + keyboard support).
- Card image aspect: `aspect-[4/3]` or `aspect-[3/4]` — consistent tiles on phone.
- Text: `line-clamp-2` on titles/descriptions to prevent uneven card heights.

### 7.2 Horizontal snap scroll (categories, logos, short lists)

Use when desktop shows a row of items side-by-side:

```tsx
<div className="overflow-x-auto overflow-y-hidden touch-pan-x
                [-ms-overflow-style:none] [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
                -mx-4 px-4 sm:mx-0 sm:px-0">
  <div className="flex gap-4 w-max snap-x snap-mandatory">
    {items.map(item => (
      <a className="snap-start flex-shrink-0 w-[230px] sm:w-[280px]" ... />
    ))}
  </div>
</div>
```

- `-mx-4 px-4` lets scroll bleed to screen edge on phone.
- Fixed card width (`w-[230px]`) — do not use `%` width inside horizontal scroll.
- Hide scrollbar but keep swipe — critical for discoverability via motion, not scrollbar.

### 7.3 Desktop hover-expand → mobile carousel

**Problem:** Desktop “ExpandingCards” or hover-to-expand panels need wide horizontal space.

**Solution:** Separate mobile component:

| Desktop (`md+` or `lg+`) | Mobile (`< md` or `< lg`) |
|--------------------------|---------------------------|
| Hover/tap expand panels | Auto-rotating carousel OR swipe carousel |
| Mouse enter switches content | One item visible; dots or swipe |

```tsx
<div className="hidden md:block"><ExpandingPanels /></div>
<div className="md:hidden min-h-[400px]"><SwipeCarousel /></div>
```

Never ship hover-only expand as the only mobile interaction.

### 7.4 Long text blocks (about, story)

**Desktop:** Full paragraphs visible.

**Mobile:** Truncate with expand:

```tsx
<div className="md:hidden">
  {!expanded ? (
    <p className="line-clamp-3">{preview}</p>
  ) : (
    <div>{fullContent}</div>
  )}
  <button onClick={toggle} className="mt-4 min-h-[44px]">
    {expanded ? 'Read less' : 'Read more'}
  </button>
</div>
<div className="hidden md:block">{fullContent}</div>
```

Optional: bordered panel wrapper only from `md:` — on phone, flat full-width text reads better.

### 7.5 Stats / trust metrics

```tsx
grid grid-cols-2 lg:grid-cols-4 gap-4
```

- 2×2 on phone is scannable; 4-in-a-row only from `lg`.
- Use `tabular-nums` for aligned numbers.

### 7.6 Testimonials

| Mobile | Desktop |
|--------|---------|
| Single-card carousel, height ~280–320px, swipe + dots | 2–3 column grid |
| Or slow horizontal marquee with edge fade | Static grid |

```tsx
<div className="block md:hidden max-w-sm mx-auto h-[300px]">{/* carousel */}</div>
<div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">{/* grid */}</div>
```

### 7.7 Image gallery / masonry

```tsx
grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5
```

- Phone: **2 columns** minimum (1 col feels too long; 3+ cols makes taps too small).
- Filter/category pills: horizontal scroll row (same pattern as §7.2).
- Desktop-only hover overlays (zoom icon, heart): hide on phone — **tap opens lightbox**.
- Featured badge: short label on phone (`★`), full word from `sm+`.

### 7.8 Video / reels / portrait media

- Carousel slide width: ~**300px phone**, ~400px desktop.
- Aspect **9/16** for portrait video.
- One playing video at a time; pause off-screen slides.
- Mute by default on mobile autoplay; unmute on user tap.

### 7.9 Before/after or comparison slider

Must work with **touch**, not mouse-only:

```tsx
// Use Pointer Events API
onPointerDown → setPointerCapture → update position from clientX
onPointerMove → update while dragging
onPointerUp → release capture
```

- Container: `touch-none select-none` to prevent page scroll while dragging.
- Tap anywhere on image to move handle (not only the handle).
- Reset control: `stopPropagation` so it does not trigger drag.
- Aspect ratio fixed (`aspect-[4/3]`) — stable on narrow screens.

### 7.10 Nested gallery / folders (venues, albums)

On phone, use **drill-down navigation** instead of sidebar + grid:

```
Level 1: folder grid (2 cols)
    ↓ tap folder
Level 2: subfolder grid OR photos
    ↓ tap photo
Lightbox
```

Each level shows:

- **Back button** (top-left, ≥44px).
- **Breadcrumb** (truncated with `truncate`).
- Folder tile: full card tappable, `aspect-[4/3]`, title + count overlay.

```tsx
grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4
```

---

## 8. Inner pages (contact, detail, listing)

### Contact / forms

```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* fields stack on phone, 2-col from sm */}
  </div>
  <button type="submit" className="w-full sm:w-auto min-h-[48px]">
    Submit
  </button>
</form>
```

- Inputs: **16px minimum font-size** on phone (`text-base`) — prevents iOS zoom on focus.
- Input height: `h-11` or `h-12` on mobile.
- Primary submit: **full width on phone**.
- Native `<select>` often better than custom dropdown on iOS.
- Page: `pt-24` for nav + `pb-20` for bottom action bar.

### Detail pages (event, product, venue)

- Hero image: full width, `aspect-video` or `aspect-[4/3]`.
- Timeline/process: vertical stack on phone with left line; horizontal steps only from `lg`.
- Related items: horizontal snap scroll on phone, grid on desktop.
- Lightbox/modals: `max-w-[95vw] max-h-[90dvh] overflow-y-auto` — never fixed pixel height that clips on small screens.

### Listing pages

- Filter row: `flex-col gap-4 sm:flex-row` — filters full width on phone.
- Search input: full width, `h-11` on mobile.

---

## 9. Modals, lightboxes, sheets

```tsx
// Dialog / lightbox content
className="w-[95vw] max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6"

// Full-height sheet (filters, detail)
className="max-h-[100dvh] flex flex-col overflow-hidden"
```

- Close button: top-right, **≥44px** hit area.
- Body scroll locked when open.
- Use `100dvh` (dynamic viewport height) instead of `100vh` on mobile browsers with shrinking URL bar.

---

## 10. Touch targets & feedback

| Element | Minimum size |
|---------|--------------|
| Nav hamburger / close | 44×44px |
| Bottom bar icon button | 56×56px |
| Bottom bar text buttons | min-height 48px, flex-1 |
| Form inputs | height 44–48px |
| Carousel dots | 44px tap area (padding around dot) |
| Social icons in footer | 44×44px |

**Press feedback:** `active:scale-95` or `active:scale-[0.98]` on buttons/cards — instant, no hover dependency.

**Accessibility:** Cards that navigate should support `Enter` / `Space` and `tabIndex={0}` when using `div` + `onClick`.

---

## 11. Safe areas & installed PWA

```css
/* Fixed top header */
padding-top: env(safe-area-inset-top, 0px);

/* Fixed bottom bar */
padding-bottom: env(safe-area-inset-bottom, 0px);

/* Main content clearance */
padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
```

Test with iPhone notch and “Add to Home Screen” — fixed bars must not sit under home indicator.

---

## 12. Performance (mobile UX, not visual theme)

1. **Lazy-load** below-fold sections (`React.lazy` + `Suspense` or dynamic import).
2. **Disable scroll-linked parallax** below `lg` — use `style={{ y: isDesktop ? y1 : 0 }}`.
3. **`prefers-reduced-motion`:** disable autoplay carousels, marquee, long transitions.
4. **`loading="lazy"`** on images below fold; hero image/video eager.
5. **Cap animation stagger** on lists: `delay: Math.min(index * 0.03, 0.2)`.
6. **Passive scroll listeners:** `{ passive: true }`.
7. Avoid stacking many full-viewport blur layers on phone — hurts GPU and scroll FPS.

---

## 13. Anti-patterns — do NOT do these

| Anti-pattern | Fix |
|--------------|-----|
| Desktop table on phone with horizontal page scroll | Card stack per row |
| Tiny text links for primary actions | Full-width buttons or bottom bar |
| Hover-only “View” / “Edit” on cards | Whole card tappable |
| Same component for expand-on-hover and phone | Separate carousel / snap scroll |
| Fixed `text-6xl` headings on all breakpoints | Responsive / clamp sizes |
| `100vh` full-screen modals on mobile Safari | `100dvh` + scrollable body |
| Footer + bottom bar covering last content | `pb-20+` on main sections |
| Custom dropdown for every `<select>` on iOS | Native select or tested mobile drawer |
| Autoplay video with sound on mobile | Muted until tap |

---

## 14. Implementation checklist (paste into other project)

Use this as the task list for Cursor when optimizing an existing site:

### Global chrome
- [ ] Fixed header with correct `pt-*` on all pages
- [ ] Hamburger + full-screen menu below `lg`; body scroll lock when open
- [ ] Nav hides on scroll down, shows on scroll up
- [ ] Phone-only fixed bottom action bar with 2–3 primary actions
- [ ] FAB or header CTA on `md+` (hide duplicate with bottom bar)
- [ ] Content `padding-bottom` clears bottom bar on phone
- [ ] Safe-area insets on fixed top/bottom chrome

### Layout
- [ ] Hero: single column phone, two column `lg+`
- [ ] CTAs stacked on phone, row from `sm`
- [ ] All grids use responsive `grid-cols-*`
- [ ] Horizontal lists use snap scroll + hidden scrollbar
- [ ] Hover-expand sections have mobile carousel alternative
- [ ] Long copy has read-more on phone
- [ ] Stats: 2-col phone, 4-col desktop

### Touch & interaction
- [ ] All interactive elements ≥ 44px
- [ ] Sliders use Pointer Events
- [ ] Gallery: tap opens lightbox; no hover-only controls on phone
- [ ] Nested folders: drill-down + back button on phone

### Forms & modals
- [ ] Form fields stack on phone; 2-col from `sm`
- [ ] Submit full width on phone
- [ ] Input font-size ≥ 16px
- [ ] Modals: 95vw / 90dvh max, scrollable

### Performance
- [ ] Below-fold sections lazy-loaded
- [ ] Parallax off on phone
- [ ] Reduced-motion respected
- [ ] Images lazy-loaded below fold

### QA devices
- [ ] iPhone Safari (portrait + landscape)
- [ ] Android Chrome
- [ ] iPad portrait (confirm nav breakpoint behavior)
- [ ] Keyboard open on contact form (layout does not break)
- [ ] Installed PWA safe areas (if applicable)

---

## 15. Quick pattern reference

| UI block | Phone | Tablet | Desktop |
|----------|-------|--------|---------|
| Primary nav | Hamburger overlay | Hamburger or inline (your choice at `md`) | Inline links |
| Lead CTAs | Fixed bottom bar | Bottom bar or FAB | FAB / header button |
| Hero | 1 col, stacked CTAs | 1 col, wider | 2 col |
| Category row | Horizontal snap scroll | Snap or 2-row grid | Full row |
| Expand panels | Swipe carousel | Carousel or simplified grid | Hover expand |
| Gallery | 2-col grid + scroll filters | 3-col | 4-col + hover hints |
| Testimonials | 1 carousel | 2-col or carousel | 3-col grid |
| Footer | Compact / hidden on inner pages | Full | Full |
| Data tables | Card list | Card list | Table |

---

## 16. Reference implementation (Phoenix repo)

If you need to see working code for any pattern above:

| Pattern | File |
|---------|------|
| Navbar + mobile menu | `src/components/Navbar.tsx` |
| Bottom action bar | `src/components/MobileCTA.tsx` |
| Desktop FAB | `src/components/WhatsAppButton.tsx` |
| Footer show/hide rules | `src/components/Footer.tsx` |
| Hero responsive | `src/components/HeroSection.tsx` |
| Snap scroll categories | `src/components/EventsSection.tsx` |
| Carousel vs expand | `src/components/ServicesSection.tsx` |
| Read more text | `src/components/AboutSection.tsx` |
| Gallery grid + filters | `src/components/GallerySection.tsx` |
| Folder drill-down | `src/components/PhoneGalleryExplorer.tsx` |
| Pointer compare slider | `src/components/BeforeAfterSection.tsx` |
| Contact form grid | `src/components/ContactForm.tsx` |
| Homepage lazy sections | `src/pages/Index.tsx` |

---

*UX and layout patterns only — apply with your project’s existing theme, colors, and fonts.*
