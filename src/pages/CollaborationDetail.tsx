import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import GalleryMediaLightbox, { type GalleryLightboxSlide } from "@/components/GalleryMediaLightbox";
import VenueDetailHero, { VenueBannerNativeVideo, VenueBannerVideoPoster } from "@/components/VenueDetailHero";
import { getCollaborationById } from "@/services/collaborations";
import { resolvePublicStorageUrl } from "@/services/storage";
import { getYouTubeThumbnail, isYouTubeValue } from "@/lib/youtube";
import { SEO } from "@/components/SEO";
import { VENUES_LIST_PATH, venueDetailPath } from "@/lib/venueRoutes";
import PhoneGalleryExplorer from "@/components/PhoneGalleryExplorer";
import { PageContentSection } from "@/components/ui/page-content-section";
import type { ExplorerFolder, ExplorerMediaItem } from "@/lib/mediaFolderTree";

function resolveCollaborationMediaUrl(urlOrPath: string): string {
  return resolvePublicStorageUrl(urlOrPath, "gallery-images");
}

type CollaborationDetail = Awaited<ReturnType<typeof getCollaborationById>>;
type CollabImage = { id: string; image_url: string; caption: string | null; folder_id?: string | null; media_type?: 'image' | 'video' };

function isCollabYouTubeVideo(m: CollabImage): boolean {
  return m.media_type === "video" && isYouTubeValue(m.image_url);
}

function collabGalleryPosterSrc(m: CollabImage): string {
  if (isCollabYouTubeVideo(m)) {
    const thumb = getYouTubeThumbnail(m.image_url);
    return thumb || "/placeholder.svg";
  }
  return resolveCollaborationMediaUrl(m.image_url);
}
type CollabFolder = { id: string; parent_id: string | null; name: string; display_order: number; is_enabled?: boolean; cover_image_url?: string | null };
type CollabStep = { id: string; step_number: number; title: string; description: string | null };

export default function CollaborationDetail() {
  const { partnerId } = useParams();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [collaboration, setCollaboration] = useState<CollaborationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const rawImages = useMemo<CollabImage[]>(() => {
    const c = collaboration as Record<string, unknown> | null | undefined;
    if (!c) return [];
    const imgs = c.collaboration_images ?? c.collaborationImages;
    return Array.isArray(imgs) ? (imgs as CollabImage[]) : [];
  }, [collaboration]);
  const rawFolders = useMemo<CollabFolder[]>(() => {
    const c = collaboration as Record<string, unknown> | null | undefined;
    if (!c) return [];
    const folders = c.collaboration_folders ?? c.collaborationFolders;
    const arr = Array.isArray(folders) ? (folders as CollabFolder[]) : [];
    const sorted = [...arr].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return sorted.filter(f => f.is_enabled !== false);
  }, [collaboration]);
  const steps = useMemo<CollabStep[]>(
    () => ((collaboration as any)?.collaboration_steps || []).slice().sort((a: CollabStep, b: CollabStep) => a.step_number - b.step_number),
    [collaboration]
  );

  const explorerFolders = useMemo<ExplorerFolder[]>(
    () =>
      rawFolders.map((f) => ({
        id: f.id,
        parent_id: f.parent_id,
        name: f.name,
        display_order: f.display_order,
        is_enabled: f.is_enabled !== false,
        cover_image_url: f.cover_image_url ?? null,
      })),
    [rawFolders]
  );

  const explorerMedia = useMemo<ExplorerMediaItem[]>(() => {
    const sortByOrder = (a: CollabImage, b: CollabImage) =>
      ((a as { display_order?: number }).display_order ?? 0) - ((b as { display_order?: number }).display_order ?? 0);
    return [...rawImages].sort(sortByOrder).map((img, i) => ({
      id: img.id,
      url: img.image_url,
      folder_id: img.folder_id ?? null,
      display_order: (img as { display_order?: number }).display_order ?? i,
      media_type: img.media_type === 'video' ? 'video' : 'image',
      caption: img.caption,
    }));
  }, [rawImages]);

  const images = useMemo<CollabImage[]>(() => {
    const sortByOrder = (a: CollabImage, b: CollabImage) =>
      ((a as { display_order?: number }).display_order ?? 0) - ((b as { display_order?: number }).display_order ?? 0);
    const byId = new Map(rawImages.map((img) => [img.id, img]));
    const ordered: CollabImage[] = [];
    const visitFolder = (folderId: string) => {
      explorerMedia
        .filter((m) => m.folder_id === folderId)
        .forEach((m) => {
          const img = byId.get(m.id!);
          if (img) ordered.push(img);
        });
      rawFolders.filter((f) => f.parent_id === folderId).forEach((f) => visitFolder(f.id));
    };
    rawFolders.filter((f) => !f.parent_id).forEach((f) => visitFolder(f.id));
    rawImages.filter((img) => !img.folder_id).sort(sortByOrder).forEach((img) => ordered.push(img));
    return ordered.length > 0 ? ordered : [...rawImages].sort(sortByOrder);
  }, [rawImages, rawFolders, explorerMedia]);

  const lightboxSlides = useMemo<GalleryLightboxSlide[]>(
    () =>
      images.map((image) => {
        if (isCollabYouTubeVideo(image)) {
          return {
            id: image.id,
            caption: image.caption,
            kind: 'youtube' as const,
            src: image.image_url,
            thumbSrc: collabGalleryPosterSrc(image),
          };
        }
        if (image.media_type === 'video') {
          return {
            id: image.id,
            caption: image.caption,
            kind: 'native-video' as const,
            src: resolveCollaborationMediaUrl(image.image_url),
            thumbSrc: resolveCollaborationMediaUrl(image.image_url),
          };
        }
        return {
          id: image.id,
          caption: image.caption,
          kind: 'image' as const,
          src: resolveCollaborationMediaUrl(image.image_url),
          thumbSrc: resolveCollaborationMediaUrl(image.image_url),
        };
      }),
    [images]
  );

  useEffect(() => {
    if (!partnerId) { setLoading(false); return; }
    getCollaborationById(partnerId)
      .then(setCollaboration)
      .catch(() => setCollaboration(null))
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!collaboration) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title="Venue Not Found" description="This venue may no longer be available." url={partnerId ? venueDetailPath(partnerId) : VENUES_LIST_PATH} />
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-serif font-semibold mb-2 text-foreground">Venue Not Found</h1>
            <p className="text-muted-foreground mb-6">This venue may no longer be available.</p>
            <Link
              to={VENUES_LIST_PATH}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Back to Venues
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const collaborationName = (collaboration as { name?: string })?.name ?? "Partner";
  const collaborationDescription = (collaboration as { description?: string })?.description ?? undefined;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const bannerSrc = (() => {
    const b = collaboration.banner_url || images[0]?.image_url;
    const logo = collaboration.logo_url;
    if (b) return resolvePublicStorageUrl(b, "gallery-images");
    if (logo) return resolvePublicStorageUrl(logo, "partner-logos");
    return "/placeholder.svg";
  })();

  const logoSrc = collaboration.logo_url
    ? resolvePublicStorageUrl(collaboration.logo_url, "partner-logos")
    : "/placeholder.svg";

  const bannerMedia = (() => {
    if (images[0] && isCollabYouTubeVideo(images[0]) && !collaboration.banner_url) {
      return (
        <VenueBannerVideoPoster
          posterSrc={collabGalleryPosterSrc(images[0])}
          alt={collaborationName}
          onPlay={() => openLightbox(0)}
        />
      );
    }
    if (images[0]?.media_type === "video" && !collaboration.banner_url) {
      return <VenueBannerNativeVideo src={resolveCollaborationMediaUrl(images[0].image_url)} />;
    }
    return undefined;
  })();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={collaborationName}
        description={collaborationDescription ? `${collaborationDescription.slice(0, 155)}${collaborationDescription.length > 155 ? "…" : ""}` : `${collaborationName} – partner venue in Pune. Premium event collaborations.`}
        url={partnerId ? venueDetailPath(partnerId) : VENUES_LIST_PATH}
      />
      <Navbar />

      <VenueDetailHero
        name={collaborationName}
        description={collaboration.description ?? ""}
        location={collaboration.location ?? ""}
        logoSrc={logoSrc}
        bannerSrc={bannerSrc}
        bannerAlt={collaborationName}
        mediaCount={images.length}
        mapUrl={collaboration.map_url}
        bannerMedia={bannerMedia}
      />

      {/* Venue Gallery – folders and images */}
      {images.length > 0 && (
        <PageContentSection
          className="border-t border-border/40 py-10 md:py-14"
          background="soft-mesh"
          band="white"
        >
          <div className="mb-6 md:mb-8">
            <h2 className="font-serif text-xl font-semibold text-foreground md:text-2xl">Venue gallery</h2>
            <p className="mt-1 text-sm text-muted-foreground">Explore the space through photos and videos.</p>
          </div>

          {explorerFolders.length > 0 || explorerMedia.some((m) => !m.folder_id) ? (
            <PhoneGalleryExplorer
              folders={explorerFolders}
              media={explorerMedia}
              resolveUrl={resolveCollaborationMediaUrl}
              isVideo={(item) => item.media_type === 'video'}
              getPoster={(item) => {
                const img = rawImages.find((r) => r.id === item.id);
                return img ? collabGalleryPosterSrc(img) : resolveCollaborationMediaUrl(item.url);
              }}
              onOpenLightbox={(index, folderPhotos) => {
                const target = folderPhotos[index];
                const globalIndex = target?.id ? images.findIndex((img) => img.id === target.id) : index;
                openLightbox(globalIndex >= 0 ? globalIndex : index);
              }}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {images.map((image, index) => {
                const mediaSrc = resolveCollaborationMediaUrl(image.image_url);
                const poster = collabGalleryPosterSrc(image);
                const yt = isCollabYouTubeVideo(image);
                return (
                <motion.div key={image.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.02 }} className="aspect-square min-h-0">
                  <div className="relative h-full w-full cursor-pointer overflow-hidden rounded-xl bg-muted/20 group" onClick={() => openLightbox(index)}>
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                    {yt ? (
                      <>
                        <img src={poster} alt={image.caption || "YouTube video"} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                          <Play className="w-10 h-10 text-white drop-shadow-md" fill="currentColor" />
                        </div>
                      </>
                    ) : (image as CollabImage).media_type === 'video' ? (
                      <video src={mediaSrc} className="max-h-full max-w-full object-contain bg-black/80 transition-transform duration-300 group-hover:scale-[1.02]" playsInline preload="metadata" />
                    ) : (
                      <img src={mediaSrc} alt={image.caption || "Collaboration media"} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
                    )}
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
              })}
            </div>
          )}
        </PageContentSection>
      )}

      <WhatsAppButton />

      <GalleryMediaLightbox
        slides={lightboxSlides}
        activeIndex={lightboxIndex}
        onActiveIndexChange={setLightboxIndex}
      />
    </div>
  );
}