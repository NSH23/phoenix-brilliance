import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, X, ChevronLeft, ChevronRight,
  Loader2, Play
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import VenueDetailHero, { VenueBannerNativeVideo, VenueBannerVideoPoster } from "@/components/VenueDetailHero";
import { getCollaborationById } from "@/services/collaborations";
import { resolvePublicStorageUrl } from "@/services/storage";
import { getYouTubeNocookieEmbedUrl, getYouTubeThumbnail, isYouTubeValue } from "@/lib/youtube";
import { SEO } from "@/components/SEO";
import PhoneGalleryExplorer from "@/components/PhoneGalleryExplorer";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef(0);
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
        <SEO title="Partner Not Found" description="This collaboration may no longer be available." url={partnerId ? `/collaborations/${partnerId}` : "/collaborations"} />
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-serif font-semibold mb-2 text-foreground">Partner Not Found</h1>
            <p className="text-muted-foreground mb-6">This collaboration may no longer be available.</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const collaborationName = (collaboration as { name?: string })?.name ?? "Partner";
  const collaborationDescription = (collaboration as { description?: string })?.description ?? undefined;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
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

  const closeLightbox = () => setLightboxOpen(false);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setLightboxIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox('prev');
    if (e.key === 'ArrowRight') navigateLightbox('next');
  };

  // Touch swipe for lightbox (mobile)
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX.current;
    if (delta > 50) navigateLightbox('prev');
    else if (delta < -50) navigateLightbox('next');
  };

  return (
    <div className="min-h-screen bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
      <SEO
        title={collaborationName}
        description={collaborationDescription ? `${collaborationDescription.slice(0, 155)}${collaborationDescription.length > 155 ? "…" : ""}` : `${collaborationName} – partner venue in Pune. Premium event collaborations.`}
        url={partnerId ? `/collaborations/${partnerId}` : "/collaborations"}
      />
      <Navbar />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-2 pt-24"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </div>

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
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 md:mb-8"
            >
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
                Venue gallery <span className="text-primary">— take a virtual tour</span>
              </h2>
            </motion.div>

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
          </div>
        </section>
      )}

      {/* CTA Section – card-style so it doesn’t look like an unfinished strip */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(232,175,193,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] py-10 sm:py-12 px-6 sm:px-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold mb-4 sm:mb-6">
              Ready to Book <span className="text-gradient-gold">{collaboration.name}</span>?
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Contact us to get exclusive partner rates and a personalized experience
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-primary text-primary-foreground 
                       font-semibold hover:bg-primary/90 transition-colors text-base"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />

      {/* Lightbox — fullscreen on mobile, swipe to navigate */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Top bar: close + counter */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-6 z-10 bg-gradient-to-b from-black/70 to-transparent">
              <button
                type="button"
                className="p-2 rounded-full text-white/90 hover:bg-white/20 transition-colors"
                onClick={closeLightbox}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-sm text-white/80">
                {lightboxIndex + 1} / {images.length}
              </span>
              <div className="w-10" />
            </div>

            {/* Nav arrows — visible on desktop, larger tap targets on mobile */}
            <button
              type="button"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button
              type="button"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            {/* Content: swipeable area, fullscreen on mobile */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col items-center justify-center p-4 pt-16 pb-20 md:max-w-5xl md:max-h-[85vh] md:py-4"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
            >
              {isCollabYouTubeVideo(images[lightboxIndex]) ? (
                <iframe
                  key={images[lightboxIndex].id}
                  src={getYouTubeNocookieEmbedUrl(images[lightboxIndex].image_url, { autoplay: true })}
                  title={images[lightboxIndex].caption || "YouTube video"}
                  className="w-full max-w-4xl aspect-video max-h-[70vh] md:max-h-[80vh] rounded-lg border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              ) : images[lightboxIndex].media_type === 'video' ? (
                <video
                  key={resolveCollaborationMediaUrl(images[lightboxIndex].image_url)}
                  src={resolveCollaborationMediaUrl(images[lightboxIndex].image_url)}
                  className="w-full h-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={resolveCollaborationMediaUrl(images[lightboxIndex].image_url)}
                  alt={images[lightboxIndex].caption || "Collaboration media"}
                  className="w-full h-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg select-none"
                  draggable={false}
                  style={{ touchAction: 'none' }}
                  loading="lazy"
                  decoding="async"
                />
              )}
              {(images[lightboxIndex].caption || "").trim() && (
                <p className="text-center mt-3 text-white/90 text-sm md:text-base max-w-lg">
                  {images[lightboxIndex].caption}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}