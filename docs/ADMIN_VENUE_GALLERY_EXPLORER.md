# Admin Venue Gallery Explorer — Folder & File Operations

This document describes the **PC-style gallery explorer** used in the Phoenix admin dashboard for **venue** and **album** galleries. It is the reference for how folders look, how uploads work, and how **select / copy / cut / paste / delete / drag** behave on **desktop vs mobile**.

**Where it lives**

| Location | Path |
|----------|------|
| Admin UI | **Venues** → edit a venue → **Gallery** tab |
| Same explorer | **Albums** → edit an album → **Gallery** tab |
| Component | `src/components/admin/AdminMediaExplorer.tsx` |
| Data helpers | `src/lib/mediaFolderTree.ts`, `src/lib/explorerMediaOps.ts` |

Related UX docs: [`ADMIN_DASHBOARD_MOBILE_TABLET_UX.md`](./ADMIN_DASHBOARD_MOBILE_TABLET_UX.md), [`ADMIN_DASHBOARD_DESIGN_SYSTEM.md`](./ADMIN_DASHBOARD_DESIGN_SYSTEM.md).

---

## 1. Concept — “This PC” for photos

The gallery is modeled after **Windows File Explorer / “This PC”**:

| Explorer idea | Gallery equivalent |
|---------------|-------------------|
| **This PC / drive root** | **Gallery** root — shows **Categories** (top-level folders) |
| **Folder** | **Category** (root) or **Subfolder** (nested inside a category) |
| **Files** | **Photos** and **YouTube videos** inside a folder |
| **Address bar** | Breadcrumb: `Gallery › Wedding › Haldi` |
| **Navigation pane** | Left **folder tree** (tablet/desktop only) |
| **Clipboard** | **Copy / Cut / Paste** moves or duplicates media between folders |

**Important rules**

- You **cannot upload at gallery root**. Create or open a **category/folder** first, then upload inside it.
- There is **no “Uncategorized” folder tile**. Photos with no `folder_id` appear at gallery root under **“Not in any folder”** (see §10).
- **Categories** can be shown/hidden on the public site with the **Public** toggle per folder.

---

## 2. Layout anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  [Gallery › Category › Subfolder]     (breadcrumb) │
│ [New category/folder] [Upload] [Copy][Cut][Paste] …       │  ← toolbar (desktop)
│ [Category] [Upload] [⋮ More]                                │  ← toolbar (mobile)
├──────────────┬──────────────────────────────────────────────┤
│ Navigation   │  Category / folder header (name, Public, 🗑) │
│ (md+ only)   │  ┌────┐ ┌────┐ ┌────┐                           │
│ All categories│  │ 📁 │ │ 📁 │ │ 📁 │  ← folder tiles        │
│ ▶ Wedding    │  └────┘ └────┘ └────┘                           │
│   ▶ Haldi    │  ┌────┐ ┌────┐ ┌────┐                           │
│ ▶ Reception  │  │ 🖼 │ │ 🖼 │ │ 🖼 │  ← photo/video tiles      │
│              │  └────┘ └────┘ └────┘                           │
│              │  Status: N categories · M files · K selected   │
└──────────────┴──────────────────────────────────────────────┘
```

### Toolbar

| Control | Purpose |
|---------|---------|
| **Back** | Up one level (subfolder → parent category → gallery root). Disabled at root. |
| **Gallery** (breadcrumb) | Jump to root (all categories). |
| **Breadcrumb segments** | Jump to any ancestor folder. |
| **New category** (at root) / **New folder** (inside a folder) | Opens dialog to create folder. |
| **Upload** | Shows in-folder upload panel (`ImageUpload`). Only when inside a folder. |
| **Copy / Cut / Paste** | Clipboard operations on **selected files** (desktop toolbar; mobile selection bar / ⋮ menu). |
| **Add video** | YouTube URL form (inside folders only). |
| **⋮ (mobile)** | Overflow: Copy/Cut/Paste, Add video, Import standard categories. |

### Navigation pane (≥ `md` / 768px)

- Fixed left column with **All categories** and expandable **tree**.
- Chevron expands/collapses subfolders; clicking a name **opens** that folder.
- Hidden on phone — use breadcrumb + folder tiles only.

### Content pane

- **At gallery root:** grid of **category** folder tiles + optional **Not in any folder** file grid.
- **Inside a folder:** child **subfolder** tiles (if any) + **Files in this folder** grid.
- **Empty states:** dashed boxes with shortcuts to create folder or upload.

### Status bar (footer)

Shows counts: categories, subfolders, total files, selection count, upload progress, hidden-folder hint.

---

## 3. How folders and files look

### Folder tile

- Amber **folder icon**, folder **name**, **item count** (includes nested subfolders + files).
- **Selected:** primary border + ring (when selected in multi-select mode).
- **Drop target:** highlighted border when dragging files onto it (desktop).
- **Hidden category:** small **eye-off** badge on folder icon when `is_enabled` is false.

### Photo / video tile

- Square thumbnail grid (`3` columns on phone, up to `6` on large screens).
- **Video:** YouTube thumbnail + caption strip at bottom.
- **Selected:** primary ring + **✓** badge (top-left).
- **Desktop hover:** subtle border highlight.

### Folder header (when inside a folder)

- Folder name, type label (**Category** or **Folder**), total item count.
- **Public** switch — controls visibility on the public venue/album page.
- **Delete folder** (trash icon) — removes folder; contents become **Not in any folder** until moved or deleted.

---

## 4. Folder hierarchy

| Level | Created with | Shown on public site as |
|-------|--------------|-------------------------|
| **Category** | **New category** at gallery root | Top-level section (e.g. Wedding, Reception) |
| **Subfolder** | **New folder** inside a category or subfolder | Nested group inside that category |
| **Nesting** | Unlimited depth via `parent_id` | Tree follows same structure |

**Import standard categories** (⋮ menu, venues only): seeds preset category names (Wedding, Haldi, etc.) — enable the ones you need.

---

## 5. Autosave toggle

Above the explorer (venue/album edit page):

| Setting | Behavior |
|---------|----------|
| **Autosave ON** (default) | Uploads and gallery edits persist to the server automatically (~700ms debounce). Upload toast only; no extra “gallery saved” spam on silent saves. |
| **Autosave OFF** | Changes stay in the browser until **Save changes** on the page header. |

Venue **name, logo, banner**, etc. always require **Save changes** regardless of autosave.

Preference is stored in `localStorage` (`admin-venue-gallery-autosave` / `admin-album-gallery-autosave`).

---

## 6. Uploading

### A. Upload button → panel

1. Open a **category or subfolder** (not gallery root).
2. Click **Upload**.
3. **ImageUpload** panel appears: drag-and-drop or file picker, up to **40 images** per batch, immediate upload to Cloudinary when `uploadOnSelect` is on.

### B. Drag-and-drop from desktop (PC only)

| Drop target | Result |
|-------------|--------|
| **Inside an open folder** (content area) | Files upload into **current folder** |
| **Onto a folder tile** | Files upload **into that folder** |
| **Gallery root** | Toast: *Create a category folder first…* — no upload |

Supported types: **images** and **videos**. Progress overlay shows batch number, filename, and percentage.

### C. YouTube video

1. Inside a folder → **Add video** (toolbar or mobile ⋮).
2. Enter URL or 11-character ID + optional title.
3. Video appears as a tile with YouTube thumbnail.

---

## 7. Selection — desktop (PC)

Breakpoint: **`md` and above** (`≥ 768px`). Behaves like Windows Explorer.

### Files (photos/videos)

| Action | Result |
|--------|--------|
| **Click** | Select **one** file (clears other selection) |
| **Ctrl + click** (⌘ on Mac) | Toggle file in **multi-selection** |
| **Shift + click** | **Range select** between last clicked file and this one |
| **Click empty area** | Clear selection |
| **Drag** | Move selected file(s) — drop on folder tile to move |
| **Right-click** | Context menu: Copy, Cut, Paste (if clipboard has items), Delete |

### Folder tiles (categories at root or subfolders)

| Action | Result |
|--------|--------|
| **Click** | Select folder tile (for paste target or multi-select) |
| **Ctrl + click** | Toggle folder in selection |
| **Shift + click** | Range select among visible folder tiles |
| **Double-click** | **Open** folder |
| **Right-click** | Open, Paste into folder, Delete folder |

### Desktop toolbar when files selected

**Copy**, **Cut** appear in toolbar. **Paste** appears when clipboard has items **and** a valid paste target exists (see §8).

---

## 8. Clipboard — Copy, Cut, Paste

Works like Windows clipboard for **files only** (not folders).

| Operation | Effect |
|-----------|--------|
| **Copy** | Stores selected files in clipboard (duplicate on paste) |
| **Cut** | Stores selected files; **removes from source on paste** (move) |
| **Paste** | Inserts clipboard files into **target folder** |

### Paste target rules

Paste goes into:

1. **Exactly one selected folder tile**, OR  
2. **The folder you currently have open** (if no folder tile is selected)

Paste **fails** with a toast if:

- **More than one** folder tile is selected → *Select only one folder to paste into*
- **No folder** is selected or open → *Select one folder to paste into*
- Target is **gallery root** → *Open or select a folder to paste into*

**Copy** duplicates images in the target folder (new rows, no DB id until save). **Cut** updates `folder_id` to the target.

### Typical workflows

**Move photos to another category (desktop)**

1. Open source folder → select files → **Cut**
2. Open target category (or select its folder tile at root) → **Paste**

**Duplicate photos into another folder**

1. Select files → **Copy**
2. Open target folder → **Paste**

---

## 9. Delete

### Delete files

| Platform | How |
|----------|-----|
| **Desktop** | Right-click → Delete, or select + Delete key via context menu |
| **Mobile** | Long-press → selection mode → **Delete** on sticky bar |

Removes from gallery state; persisted on autosave or **Save changes**.

### Delete folder

| Platform | How |
|----------|-----|
| **Desktop** | Folder header trash icon, or right-click folder tile → Delete folder |
| **Mobile (folder select mode)** | Long-press category at root → select one folder → **Delete** on sticky bar |

Confirm dialog warns that contents will appear as **Not in any folder**. Subfolders are removed with the category.

### Delete all unassigned

At gallery root, section **Not in any folder** has **Delete all** — removes every file with no `folder_id`.

---

## 10. “Not in any folder” (unassigned media)

There is **no** separate “Uncategorized” folder in the UI.

When photos have **no folder** (`folder_id` is null) — e.g. after deleting a category, or legacy data — they appear at **gallery root** in:

**Not in any folder · N**

- Same photo tiles as inside folders (preview, select, delete).
- **Delete all** clears the entire unassigned set.
- To organize: **Cut/Copy** selected files → open a category → **Paste**.

---

## 11. Selection — mobile (phone & narrow tablet)

Breakpoint: **below `md` (`< 768px`)**. Touch-first; no drag-and-drop.

Long-press duration: **~480ms** (slight haptic feedback when supported).

### Files

| Action | Result |
|--------|--------|
| **Tap** | **Preview** full-screen (photos) or open YouTube (videos) |
| **Long-press** | Enter **file selection mode** — sticky bar appears |
| **Tap** (while in selection mode) | Toggle file in/out of selection |
| **Cancel** on sticky bar | Exit selection mode, clear selection |

**Sticky bar (file selection mode):** Cancel · **N selected** · Copy · Cut · Paste (if valid) · Delete

### Categories / folder tiles (at root)

| Action | Result |
|--------|--------|
| **Tap** | **Open** folder |
| **Long-press** | Enter **folder selection mode** |
| **Tap** (while in folder selection mode) | Toggle folder tile selection |

**Sticky bar (folder selection mode):** Cancel · **N selected** · Paste (if clipboard + one folder) · **Delete** (exactly one folder selected)

### Mobile ⋮ overflow menu

When **not** in selection mode, use **⋮** for Copy/Cut/Paste (if files already selected from a prior action), Add video, Import categories.

### Mobile hints (shown under grids)

- *Tap to preview · Long-press to select multiple*
- *Tap to open a category · Long-press to select folders*
- *Move into a category with Cut/Copy + Paste* (unassigned section)

---

## 12. Desktop vs mobile — quick reference

| Feature | Desktop (≥768px) | Mobile (<768px) |
|---------|------------------|-----------------|
| **Folder tree (left nav)** | Visible | Hidden — use breadcrumbs + tiles |
| **Open folder** | Double-click tile or tree | Single **tap** |
| **Select files** | Click / Ctrl / Shift | **Long-press** → tap more |
| **Select folders** | Click / Ctrl / Shift on tiles | **Long-press** at root → tap more |
| **Preview photo** | Right-click context (no lightbox by default) | **Tap** → full-screen dialog |
| **Copy / Cut / Paste** | Toolbar + right-click | Selection sticky bar + ⋮ menu |
| **Move files** | Drag to folder tile | Cut → open folder → Paste |
| **Upload** | Toolbar + drag-drop from OS | Toolbar **Upload** + ImageUpload panel |
| **Delete folder** | Header trash or right-click | Folder selection bar **Delete** (one folder) |
| **Multi-select drag** | Yes | **Disabled** (drag off on touch) |

---

## 13. Context menus (desktop right-click)

### On a file

- Copy · Cut · Paste (if clipboard) · **Delete**

### On a folder tile

- **Open** · Paste (if clipboard) · **Delete folder**

---

## 14. Public visibility

Each folder has **Public** toggle in the folder header:

| Public | Public venue/album page |
|--------|-------------------------|
| **ON** | Category/folder and its enabled children can appear |
| **OFF** | Hidden from visitors; still visible in admin |

Status bar may show *Hidden from website* when the open folder is disabled.

---

## 15. Data & persistence

| Item | Storage |
|------|---------|
| Folder structure | `collaboration_folders` / `album_folders` |
| Media rows | `collaboration_images` / `album_media` |
| File binary | Cloudinary (`gallery-images` / `album-images` buckets) |
| `folder_id` | `null` = unassigned (shown at root, not in a folder tile) |

Gallery saves diff inserts/updates/deletes against the server. With **autosave**, each meaningful change triggers a debounced persist with a **snapshot** of current media/folders (avoids stale React state).

---

## 16. Manual test checklist

Use Chrome DevTools device mode or a real phone.

### Setup

1. Admin → **Venues** → edit a venue with gallery → **Gallery** tab.
2. Repeat key flows on **Albums** → edit → **Gallery** (same explorer).

### Folders

- [ ] Create **category** at root; create **subfolder** inside it.
- [ ] Breadcrumb and **Back** navigate correctly.
- [ ] **Public** toggle saves; hidden folder noted in status bar.
- [ ] Delete category → photos appear under **Not in any folder**.

### Upload

- [ ] Upload inside folder via **Upload** button.
- [ ] **Desktop:** drag files from desktop onto folder tile and into open folder.
- [ ] **Root drop** shows “create category first” message.
- [ ] Add **YouTube video** inside a folder.

### Desktop selection & clipboard

- [ ] Click, Ctrl+click, Shift+click on files.
- [ ] Copy → Paste into another folder (duplicate).
- [ ] Cut → Paste (move).
- [ ] Drag files onto another folder tile.
- [ ] Right-click → Delete.

### Mobile selection & clipboard

- [ ] Tap photo → preview dialog.
- [ ] Long-press → select multiple → Copy/Cut → open folder → Paste.
- [ ] Long-press category → select one → Delete.
- [ ] **⋮** menu: Add video, Paste when clipboard active.

### Unassigned

- [ ] **Not in any folder** section lists orphan photos.
- [ ] **Delete all** works.
- [ ] Cut from unassigned → Paste into category.

### Autosave

- [ ] Toggle off → upload → only persists after **Save changes**.
- [ ] Toggle on → upload → persists without full page reload losing images.

---

## 17. Implementation map (for developers)

| Concern | File |
|---------|------|
| Explorer UI & interactions | `src/components/admin/AdminMediaExplorer.tsx` |
| Venue wiring + autosave | `src/pages/admin/VenueEdit.tsx` |
| Album wiring + autosave | `src/pages/admin/AlbumEdit.tsx` |
| Tree helpers | `src/lib/mediaFolderTree.ts` |
| Copy/cut/paste/move | `src/lib/explorerMediaOps.ts` |
| Mobile breakpoint hook | `src/hooks/use-mobile.ts` (`< 768px`) |
| Bulk upload UI inside folder | `src/components/admin/ImageUpload.tsx` |

---

*Last updated to match Phoenix Brilliance admin gallery explorer (venue + album), including mobile long-press selection, tap-to-preview, unassigned media at root, and autosave.*
