# Phoenix Admin Dashboard â€” Mobile & Tablet UX Guide

Use this document to replicate **how the Phoenix admin dashboard works on phones and tablets**: navigation, touch targets, responsive layouts, and interaction patterns.

**Public website mobile UX (layout only, no colors/fonts/theme):** see [`WEBSITE_MOBILE_TABLET_UX.md`](./WEBSITE_MOBILE_TABLET_UX.md) â€” paste that file into another project to optimize an existing site for mobile/tablet.

Complements [`ADMIN_DASHBOARD_DESIGN_SYSTEM.md`](./ADMIN_DASHBOARD_DESIGN_SYSTEM.md) (admin colors, typography, desktop shell).

Written for **another projectâ€™s Cursor/agent** â€” patterns and rules to copy, not Phoenix business logic.

---

# Admin Dashboard

## A1. Core philosophy

| Principle | Implementation |
|-----------|----------------|
| **Mobile-native admin** | Phone gets a **bottom tab bar**, not a cramped sidebar. Primary tasks are 1 thumb away. |
| **Tablet = simplified desktop** | From `md` (768px) upward, sidebar returns; bottom bar hides. |
| **Cards over tables on small screens** | Dense data (leads, inquiries) uses **card stacks** on mobile and **table rows** on large screens. |
| **Whole card is tappable** | List items navigate to full-page editors on tap â€” no tiny â€œEditâ€-only targets. |
| **Touch-first sizing** | Minimum **44Ã—44px** hit areas; inputs often **44px (h-11)** tall on mobile. |
| **Safe areas respected** | Notch, home indicator, and PWA standalone padding via `env(safe-area-inset-*)`. |
| **No hover-only actions** | Anything visible on desktop `:hover` must still be reachable on touch (menus, delete on images). |

---

## A2. Breakpoint strategy

Uses Tailwind defaults:

| Breakpoint | Width | Admin behavior |
|------------|-------|----------------|
| **Default (phone)** | `< 640px` | Bottom nav, stacked header, compact grids, card layouts |
| **`sm`** | `â‰¥ 640px` | Slightly wider search, 2-column grids where needed |
| **`md`** | `â‰¥ 768px` | **Desktop sidebar visible**, bottom nav **hidden**, main content gets left margin |
| **`lg`** | `â‰¥ 1024px` | Table layouts, side-by-side explorer panes, lead list as rows |
| **`xl`** | `â‰¥ 1280px` | Dashboard stat strip expands to 8 columns |

Detection in shell (`AdminLayout`):

```ts
const isMobile = window.innerWidth < 768; // md breakpoint
// Sidebar margin: 0 on mobile, 80 or 280 on desktop
```

**Rule for new screens:** Design mobile layout first, then add `md:` / `lg:` enhancements â€” never only shrink a desktop table.

---

## A3. Shell layout by device

### Phone (`< md`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [Logo] [Search]    ðŸ”” ðŸŒ™   â”‚  â† sticky glass header
â”‚     [ Website | WP Agent ]  â”‚  â† workspace switcher full width row 2
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Page title + subtitle      â”‚
â”‚  Content (pb for bottom nav)â”‚
â”‚                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Home Events Gallery Alerts Menuâ”‚  â† fixed bottom bar (md:hidden)
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     safe-area-inset-bottom
```

- **No left sidebar** â€” `hidden md:block` on sidebar wrapper.
- Main column **full width** (`marginLeft: 0`).
- Content bottom padding:  
  `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]`  
  so lists arenâ€™t hidden behind the tab bar.

### Tablet / laptop (`â‰¥ md`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Sidebar  â”‚ Header (logo, search, WS, tools)   â”‚
â”‚ 280/80px â”‚ Page title + actions             â”‚
â”‚          â”‚ Content max-w-7xl                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Collapsible sidebar: **280px** expanded, **80px** icon-only.
- Bottom nav **removed** (`admin-bottom-nav md:hidden`).

### Header grid (responsive)

Mobile uses a **2-row CSS grid**; desktop becomes **3 columns in 1 row**:

| Zone | Mobile | Desktop (`md+`) |
|------|--------|-----------------|
| Logo + search | Row 1, left | Col 1 |
| Workspace switcher | Row 2, centered full width | Col 2, centered |
| Bell + theme toggle | Row 1, right | Col 3, right |

Header also uses `pt-[env(safe-area-inset-top,0px)]` for notched phones in PWA.

---

## A4. Bottom navigation (primary mobile nav)

**Component:** `AdminBottomNav.tsx`  
**Visibility:** `md:hidden` only.

### Website workspace tabs

| Tab | Route | Icon |
|-----|-------|------|
| Home | `/admin/dashboard` | LayoutDashboard |
| Events | `/admin/events` | Calendar |
| Gallery | `/admin/gallery` | Images |
| Alerts | `/admin/notifications` | Mail |
| **Menu** | Opens sheet | Menu |

### WP Agent workspace tabs

Home Â· Leads Â· Alerts Â· Stats Â· Media (5 tabs, no overflow menu â€” all fit on bar).

### Tab item anatomy

```tsx
className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5 
           rounded-xl px-1 py-1.5 text-[10px] font-medium active:scale-95"
```

- Icon: `h-5 w-5`; active tab uses heavier stroke `stroke-[2.25]`.
- Label: truncated `max-w-[4.5rem]`.
- Active indicator: **2px accent line** on top (`.admin-bottom-nav-item[aria-current='page']::before`).

### Overflow â€œMenuâ€ sheet (website only)

Tapping **Menu** opens a **left sheet** (`w-[min(88vw,320px)]`) with `AdminSidebar mobile mobileOverflowMenu`.

**Overflow logic** (`adminMobileNav.ts`):

- Items already on the bottom bar are **excluded** from the sheet.
- Website pinned tabs: Dashboard, Events, Gallery, Notifications.
- Sheet shows: Venues, Albums, Services, Team, Settings, Manage Videos, etc.

If every item is on the bar, show: *â€œAll sections are on the bar below.â€*

### Mobile sidebar link sizing

When sidebar is used inside sheet:

```tsx
mobile && 'min-h-[48px] py-3 text-base'
```

Larger tap targets and readable labels vs desktop `py-2.5 text-sm`.

---

## A5. Touch targets & feedback

### Global utility

```css
.admin-dashboard .touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

Apple HIG / Material baseline: **44px minimum**.

### Common mobile sizing patterns

| Element | Mobile class | Desktop |
|---------|--------------|---------|
| Header icon buttons | `h-11 w-11 min-h-[44px] min-w-[44px]` | `h-9 w-9` |
| Form inputs | `max-md:h-11` | `h-9` or `h-10` |
| Primary buttons | `max-md:w-full max-md:h-11` | auto width |
| Bottom nav items | `touch-target` + `active:scale-95` | N/A |
| Nav links (sheet) | `min-h-[48px]` | `py-2.5` |

### Press feedback

- **`active:scale-95`** or **`active:scale-[0.98]`** on cards and tabs â€” subtle press without lag.
- Cards use **`cursor-pointer`** + **`role="button"`** + **keyboard** `Enter`/`Space` for accessibility.

---

## A6. Safe areas & PWA

### Bottom inset

Main content padding accounts for fixed bottom nav + iPhone home indicator:

```tsx
pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]
```

Desktop drops extra bottom padding: `md:pb-6`.

### Top inset

Sticky header: `pt-[env(safe-area-inset-top,0px)]`.

### Bottom nav

```css
.admin-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### Install banner (admin PWA)

Floated **above** bottom nav on mobile:

```tsx
bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]
md:bottom-6
```

Admin PWA is scoped to `/admin` â€” installable on phone and desktop Chrome without replacing the public site PWA.

---

## A7. Clickable cards & list pages

### Pattern: card-as-button â†’ full-page editor

Used on Events, Venues, Albums, Services, Moments, etc.

```tsx
<Card
  className="cursor-pointer ..."
  onClick={() => navigate(`/admin/events/${id}/edit`)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { ... } }}
>
```

**Mobile UX wins:**

- Large image hero (`h-40` phone, `md:h-48` tablet+).
- Title overlaid on image â€” scannable at a glance.
- Footer row: status + **Switch** for visibility (`onClick stopPropagation` on switch).
- **â‹® menu** on card: use `stopPropagation` so menu doesnâ€™t trigger navigation.

**Note:** Hover-only controls (e.g. â‹® fading in on `group-hover`) are acceptable for desktop; primary action remains **tap entire card**.

### Grid responsiveness

Example events grid:

```tsx
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
```

- Phone: **1 column** full-width cards.
- Small tablet: 2 columns.
- Desktop: 3 columns.

---

## A8. Dual layout: cards (mobile) vs rows (desktop)

**Best example:** `WpLeads.tsx`

| Viewport | Layout |
|----------|--------|
| `< lg` | Stacked **cards** â€” avatar, name, badges, message preview, action footer |
| `â‰¥ lg` | **Table-style rows** â€” same data in horizontal columns |

Mobile card structure:

1. **Tappable header** (`button.w-full.p-4.text-left`) â†’ opens detail sheet.
2. **Avatar chip** 44px (`h-11 w-11`).
3. **Message preview** in muted rounded box.
4. **Footer actions** separated by `border-t` â€” status `Select` full width, Send/Delete in **2-column grid**, buttons `h-10`.

```tsx
<article className="... lg:flex lg:items-center ...">
  <div className="lg:hidden">{/* mobile card */}</div>
  <div className="hidden lg:contents">{/* desktop row */}</div>
</article>
```

**Replication rule:** One component, two DOM branches with `lg:hidden` / `hidden lg:contents` â€” shared handlers, no duplicate data fetching.

---

## A9. Dashboard overview (responsive stats)

**Mobile:** compact **3Ã—2 grid** for first 6 stats, then **2-column row** for remainder.

```tsx
<div className="grid grid-cols-3 grid-rows-2 gap-1.5 sm:hidden">
  {overviewCards.slice(0, 6).map(... compact />}
</div>
<div className="grid grid-cols-2 gap-1.5 sm:hidden">
  {overviewCards.slice(6).map(... compact />}
</div>
```

**Tablet+:**

```tsx
<div className="hidden sm:grid grid-cols-4 gap-2 xl:grid-cols-8">
  {overviewCards.map(... full size)}
</div>
```

Compact mode uses smaller padding (`p-2`), smaller icons (`h-6 w-6`), shortened labels (â€œGalleryâ€ vs â€œGallery Imagesâ€), `text-base` values.

Below stats: **2-column panel grid** on desktop (`lg:grid-cols-2`), stacks on phone.

---

## A10. Full-page CRM editors on mobile

**Component:** `AdminRecordEditShell.tsx`

Works on phone without modals:

| Element | Mobile behavior |
|---------|-----------------|
| Back link | Full-width ghost button **above** title (not crammed in header right) |
| Title | `text-2xl` scales fine; subtitle wraps |
| Tabs | `TabsList` full width, horizontal scroll if needed |
| Form sections | `AdminFormSection` stacks vertically â€” single column |
| Save / Delete | In header actions row; remain reachable (icon delete + text save) |
| Sidebar preview | `lg:sticky` aside â€” on mobile, preview **stacks below** form (`grid lg:grid-cols-[1fr_320px]`) |

Gallery tab (`AdminMediaExplorer`) on mobile:

- Toolbar **wraps** (`flex-wrap`).
- Explorer: **column layout** until `lg` â€” nav tree on top (`max-h-[200px] scroll`), files below.
- Folder grid: `grid-cols-3` minimum on phone, scales up to 8 on xl.
- File grid: 3 columns phone â†’ 6 on lg.

---

## A11. Forms, settings & dialogs

### Settings / tabbed pages

Horizontal **scrollable pill tabs** on mobile:

```tsx
TabsList className="max-md:flex-row max-md:overflow-x-auto max-md:flex-nowrap"
TabsTrigger className="max-md:px-4 max-md:py-2 max-md:rounded-full max-md:whitespace-nowrap"
```

### Inputs & buttons

Consistent mobile enlargement:

```tsx
Input className="max-md:h-11"
Button className="max-md:w-full max-md:h-11"
```

Stack filter rows vertically:

```tsx
flex flex-col gap-4 sm:flex-row
SelectTrigger className="max-md:w-full max-md:h-11"
```

### Dialogs

```tsx
DialogContent className="max-md:w-[95vw] max-md:max-h-[90vh] max-md:overflow-y-auto"
```

Full viewport width on phone, scrollable body, never clipped off-screen.

### Lead / inquiry detail

Prefer **Sheet** or full-height dialog:

```tsx
SheetContent className="max-h-[100dvh] ... overflow-hidden flex flex-col"
```

Use `100dvh` (dynamic viewport height) to handle mobile browser chrome correctly.

---

## A12. Notifications & alerts UI

- Search input: `max-md:h-11`
- Filter select: `max-md:w-full`
- Card padding: `max-md:p-4`
- Action buttons: full width on mobile `max-md:w-full max-md:h-11`
- Detail dialog: scrollable, full width

Unread badges on bottom nav / sidebar use min 16px circles with `99+` cap.

---

## A13. Media & image upload on touch

### ImageUpload

- Delete button on thumbnails: **`max-md:opacity-100`** â€” always visible on touch (desktop may use hover).
- Optional **crop dialog** before upload â€” mobile-friendly full-screen cropper.
- Bulk select/delete supported for gallery management.

### Drag-and-drop

Desktop/laptop: drag files onto folder tiles.  
Mobile: **Upload button** + native file picker (drag less common on phone). Progress overlay shows **percentage** and batch count.

---

## A14. Login & auth screens

- Centered card `max-w-md w-full mx-4 px-4 py-8`.
- Glass card padding: `p-8 md:p-10`.
- Large logo + `AdminBrand size="lg"`.
- Inputs and submit: full width, comfortable height.
- Uses same `admin-dashboard` wrapper for theme tokens.

---

## A15. Motion & performance on mobile

- Page enter: light fade-up (`admin-animate-in`) â€” **disabled** for `prefers-reduced-motion`.
- Bottom nav / card press: scale only, no heavy blur animations.
- Sidebar width transition: 300ms ease â€” skipped on mobile (sidebar not shown).
- List stagger animations capped (`delay: min(index * 0.03, 0.2)`) so long lists donâ€™t cascade slowly.

---

## A16. Accessibility checklist (mobile)

- [ ] All interactive targets â‰¥ 44px
- [ ] `aria-current="page"` on active nav tabs
- [ ] `aria-label` on icon-only header buttons
- [ ] Card navigation supports keyboard
- [ ] Sheet titles: `SheetTitle` (sr-only ok for overflow menu)
- [ ] Color contrast maintained in light & dark admin themes
- [ ] No critical actions hidden behind hover-only UI

---

## A17. File reference (admin)

| Concern | Path |
|---------|------|
| Shell + header grid + safe padding | `src/components/admin/AdminLayout.tsx` |
| Bottom tab bar | `src/components/admin/AdminBottomNav.tsx` |
| Overflow menu filter | `src/lib/adminMobileNav.ts` |
| Sidebar (desktop + mobile sheet) | `src/components/admin/AdminSidebar.tsx` |
| Touch target CSS | `src/index.css` â†’ `.touch-target`, `.admin-bottom-nav` |
| Dashboard responsive grids | `src/pages/admin/Dashboard.tsx` |
| Card + dual layout example | `src/pages/admin/WpLeads.tsx` |
| Card click â†’ edit | `src/pages/admin/Events.tsx`, `Collaborations.tsx`, â€¦ |
| CRM editor shell | `src/components/admin/AdminRecordEditShell.tsx` |
| Media explorer responsive | `src/components/admin/AdminMediaExplorer.tsx` |
| Admin PWA install banner | `src/components/admin/AdminPwaManager.tsx` |
| Settings mobile forms | `src/pages/admin/Settings.tsx` |

---

## A18. Porting checklist (new dashboard)

1. **Add bottom nav** at `< md` with 4â€“5 primary destinations + optional â€œMoreâ€ sheet.
2. **Hide sidebar** on phone; show from `md:` up with animated margin on main.
3. **Pad main content** for bottom nav + safe area.
4. **Pad header** for safe-area-inset-top.
5. **Enforce 44px** on icons, nav items, and primary buttons (`h-11`, `touch-target`).
6. **Stack header** into 2 rows on small screens (tools row + workspace row).
7. **Use card-first lists** â€” entire card navigates; switches/menus use `stopPropagation`.
8. **Dual layouts** for complex lists: cards `< lg`, table rows `â‰¥ lg`.
9. **Responsive stat grids**: dense multi-column on phone, full grid tablet+.
10. **Full-width mobile buttons** in forms and dialogs.
11. **Dialogs** at `95vw` max height `90dvh` with scroll.
12. **Never rely on hover** for essential actions on touch devices.
13. **Horizontal scroll tabs** when many settings sections exist.
14. **PWA**: scoped manifest + install prompt above bottom nav.
15. **Test** on real iPhone (Safari + Add to Home Screen) and Android Chrome.

---

## A19. Summary â€” why admin feels good on mobile

1. **Thumb zone navigation** â€” bottom bar for daily tasks, not hamburger-only.
2. **Overflow sheet** â€” infrequent pages still reachable without cluttering the bar.
3. **Big cards, big taps** â€” edit content by tapping the card, not a 12px link.
4. **Layout morphs by breakpoint** â€” cards â†’ rows, stacked â†’ side-by-side, not just zoomed out.
5. **Forms respect fingers** â€” taller inputs, full-width primary actions.
6. **Safe areas & PWA** â€” works installed on home screen with notch/home bar.
7. **Same visual language as desktop** â€” glass header, accent nav, panel sections â€” so it feels like one product, not a separate â€œmobile site.â€


---

*Admin dashboard only. Public website mobile UX: [WEBSITE_MOBILE_TABLET_UX.md](./WEBSITE_MOBILE_TABLET_UX.md)*
