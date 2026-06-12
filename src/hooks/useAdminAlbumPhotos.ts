import { useCallback, useRef, useState } from 'react';
import type { AlbumPhotoItem } from '@/components/admin/AdminAlbumPhotoGrid';
import {
  createAlbumMedia,
  deleteAlbumMedia,
  updateAlbumMedia,
  type AlbumMedia,
} from '@/services/albums';
import { toast } from 'sonner';

export const PHOTOS_AUTOSAVE_KEY = 'admin-album-photos-autosave';

export function mapAlbumPhotos(items: AlbumMedia[]): AlbumPhotoItem[] {
  return items
    .filter((m) => m.type === 'image' && m.url)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((m, i) => ({
      id: m.id,
      url: m.url!,
      display_order: m.display_order ?? i,
    }));
}

export function useAdminAlbumPhotos(albumId: string | null) {
  const [photos, setPhotos] = useState<AlbumPhotoItem[]>([]);
  const [autosavePhotos, setAutosavePhotos] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(PHOTOS_AUTOSAVE_KEY) !== 'false'
  );
  const photosAutosavingRef = useRef(false);
  const pendingPhotosAutosaveRef = useRef<AlbumPhotoItem[] | null>(null);
  const photosDbSnapshotRef = useRef<
    Array<{ id: string; url: string | null; display_order: number }>
  >([]);

  const initFromMedia = useCallback((items: AlbumMedia[]) => {
    const mapped = mapAlbumPhotos(items);
    setPhotos(mapped);
    photosDbSnapshotRef.current = items
      .filter((m) => m.type === 'image')
      .map((m) => ({
        id: m.id,
        url: m.url,
        display_order: m.display_order ?? 0,
      }));
  }, []);

  const persistPhotos = useCallback(
    async (photosToSave: AlbumPhotoItem[], opts?: { silent?: boolean; force?: boolean }) => {
      if (!albumId) return;
      if (photosAutosavingRef.current && !opts?.force) {
        pendingPhotosAutosaveRef.current = photosToSave;
        return;
      }
      photosAutosavingRef.current = true;

      try {
        const existing = photosDbSnapshotRef.current;
        const existingIds = new Set(existing.map((m) => m.id));
        const currentIds = new Set(photosToSave.filter((p) => p.id).map((p) => p.id!));

        let resultPhotos = photosToSave.map((p) => ({ ...p }));

        for (const item of photosToSave) {
          if (item.id && existingIds.has(item.id)) {
            const prev = existing.find((e) => e.id === item.id);
            const updates: Parameters<typeof updateAlbumMedia>[1] = {};
            if (prev?.url !== item.url) updates.url = item.url;
            if (prev && prev.display_order !== item.display_order) {
              updates.display_order = item.display_order;
            }
            if (Object.keys(updates).length > 0) {
              await updateAlbumMedia(item.id, updates);
            }
          } else if (!item.id) {
            const created = await createAlbumMedia({
              album_id: albumId,
              type: 'image',
              url: item.url,
              youtube_url: null,
              caption: null,
              is_featured: false,
              display_order: item.display_order,
              folder_id: null,
            });
            resultPhotos = resultPhotos.map((p) =>
              !p.id && p.url === item.url ? { ...p, id: created.id } : p
            );
          }
        }

        for (const e of existing) {
          if (!currentIds.has(e.id)) {
            await deleteAlbumMedia(e.id);
            resultPhotos = resultPhotos.filter((p) => p.id !== e.id);
          }
        }

        setPhotos(resultPhotos);
        photosDbSnapshotRef.current = resultPhotos
          .filter((p): p is AlbumPhotoItem & { id: string } => !!p.id)
          .map((p) => ({ id: p.id, url: p.url, display_order: p.display_order }));

        if (!opts?.silent) toast.success('Photos saved');
      } catch (err: unknown) {
        toast.error('Could not save photos', {
          description: err instanceof Error ? err.message : String(err),
        });
        throw err;
      } finally {
        photosAutosavingRef.current = false;
        const queued = pendingPhotosAutosaveRef.current;
        if (queued) {
          pendingPhotosAutosaveRef.current = null;
          void persistPhotos(queued, { silent: true, force: true });
        }
      }
    },
    [albumId]
  );

  const handlePhotosChange = useCallback(
    (next: AlbumPhotoItem[]) => {
      setPhotos(next);
      if (autosavePhotos) {
        void persistPhotos(next, { silent: true });
      }
    },
    [autosavePhotos, persistPhotos]
  );

  const toggleAutosavePhotos = useCallback((enabled: boolean) => {
    setAutosavePhotos(enabled);
    localStorage.setItem(PHOTOS_AUTOSAVE_KEY, enabled ? 'true' : 'false');
  }, []);

  return {
    photos,
    autosavePhotos,
    initFromMedia,
    persistPhotos,
    handlePhotosChange,
    toggleAutosavePhotos,
  };
}
