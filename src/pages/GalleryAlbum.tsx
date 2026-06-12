import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, Navigate } from "react-router-dom";
import { 
  Play, Heart,
  Images, ExternalLink, Loader2 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import GalleryMediaLightbox, { type GalleryLightboxSlide } from "@/components/GalleryMediaLightbox";
import AlbumDetailHero from "@/components/AlbumDetailHero";
import { getEventBySlug, Event } from "@/services/events";
import { getAlbumById, getAlbumWithMedia, AlbumMedia, AlbumFolder } from "@/services/albums";
import { Album } from "@/services/albums";
import PhoneGalleryExplorer from "@/components/PhoneGalleryExplorer";
import type { ExplorerFolder, ExplorerMediaItem } from "@/lib/mediaFolderTree";
import { logger } from "@/utils/logger";
import { SEO } from "@/components/SEO";
import { getYouTubeId, getYouTubeNocookieEmbedUrl, getYouTubeThumbnail } from "@/lib/youtube";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { publicEventGalleryListingPath } from "@/lib/publicGallery";

function AlbumYoutubeLazyCard({ video, animationDelay }: { video: AlbumMedia; animationDelay: number }) {
  const [played, setPlayed] = useState(false);
  const id = video.youtube_url ? getYouTubeId(video.youtube_url) : "";
  const valid = /^[a-zA-Z0-9_-]{11}$/.test(id);
  const poster =
    video.url && /^https?:\/\//i.test(video.url.trim())
      ? video.url.trim()
      : valid
        ? getYouTubeThumbnail(id)
        : "";
  const watchHref = valid ? `https://www.youtube.com/watch?v=${id}` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="group rounded-xl overflow-hidden bg-card border border-border"
    >
      <div className="aspect-video bg-muted">
        {valid && !played ? (
          <button
            type="button"
            className="relative w-full h-full block text-left group/btn"
            onClick={() => setPlayed(true)}
            aria-label={video.caption ? `Play video: ${video.caption}` : "Play video"}
          >
            {poster ? (
              <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/btn:bg-black/40 transition-colors">
              <Play className="w-14 h-14 text-white drop-shadow-lg" />
            </div>
          </button>
        ) : valid ? (
          <iframe
            src={getYouTubeNocookieEmbedUrl(id, { autoplay: true })}
            title={video.caption || "Video"}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-medium text-foreground mb-1">{video.caption || "Video"}</h4>
        {watchHref && (
          <a
            href={watchHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

const GalleryAlbum = () => {
  const { eventType, albumId } = useParams<{ eventType: string; albumId: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [event, setEvent] = useState<Event | null>(null);
  const [album, setAlbum] = useState<any | null>(null);
  const [media, setMedia] = useState<AlbumMedia[]>([]);
  const [albumFolders, setAlbumFolders] = useState<AlbumFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlbum();
  }, [eventType, albumId]);

  const loadAlbum = async () => {
    try {
      setIsLoading(true);
      
      if (!albumId) {
        setIsLoading(false);
        return;
      }

      // Load album with media
      const albumData = await getAlbumWithMedia(albumId);
      
      if (!albumData) {
        setIsLoading(false);
        return;
      }

      setAlbum(albumData);
      setMedia(albumData.album_media || []);
      setAlbumFolders((albumData as { album_folders?: AlbumFolder[] }).album_folders || []);

      // Load event if eventType is provided
      if (eventType && eventType !== 'all') {
        try {
          const eventData = await getEventBySlug(eventType);
          setEvent(eventData);
        } catch (error) {
          // If event not found by slug, try to get from album
          if (albumData.events) {
            setEvent(albumData.events);
          }
        }
      } else if (albumData.events) {
        setEvent(albumData.events);
      }
    } catch (error: any) {
      logger.error('Error loading album', error, { component: 'GalleryAlbum', action: 'loadAlbum', eventType, albumId });
    } finally {
      setIsLoading(false);
    }
  };

  // Get photos and videos
  const photos = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');

  const explorerFolders = useMemo<ExplorerFolder[]>(
    () =>
      albumFolders
        .filter((f) => f.is_enabled !== false)
        .map((f) => ({
          id: f.id,
          parent_id: f.parent_id,
          name: f.name,
          display_order: f.display_order,
          is_enabled: f.is_enabled !== false,
          cover_image_url: f.cover_image_url ?? null,
        })),
    [albumFolders]
  );

  const explorerPhotos = useMemo<ExplorerMediaItem[]>(
    () =>
      photos.map((p, i) => ({
        id: p.id,
        url: p.url || '',
        folder_id: p.folder_id ?? null,
        display_order: p.display_order ?? i,
        media_type: 'image' as const,
        caption: p.caption,
      })),
    [photos]
  );

  const hasFolderGallery = explorerFolders.length > 0 || explorerPhotos.some((p) => p.folder_id);

  const lightboxSlides = useMemo<GalleryLightboxSlide[]>(
    () =>
      photos.map((photo) => ({
        id: photo.id,
        caption: photo.caption,
        kind: 'image' as const,
        src: photo.url || '',
        thumbSrc: photo.url || '',
      })),
    [photos]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <WhatsAppButton />
      </div>
    );
  }

  // If not found or hidden, redirect
  if (!album || album.is_active === false) {
    const fallback = event?.slug ? publicEventGalleryListingPath(event.slug) : "/events";
    return <Navigate to={fallback} replace />;
  }

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const eventSlug = event?.slug || eventType || 'all';
  const canonicalPath = eventType && albumId ? `/gallery/${eventType}/${albumId}` : '/gallery';
  const albumDescription = album.description
    ? `${album.description.slice(0, 155)}${album.description.length > 155 ? "…" : ""}`
    : `${album.title} – event album photos in Pune by Phoenix Events.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={album.title}
        description={albumDescription}
        url={canonicalPath}
      />
      <Navbar />

      <AlbumDetailHero
        albumTitle={album.title}
        albumDescription={album.description}
        coverSrc={album.cover_image || "/placeholder.svg"}
        eventTitle={event?.title}
        eventSlug={event?.slug || (eventType !== "all" ? eventType : undefined)}
        eventDate={album.event_date}
        photoCount={photos.length}
        videoCount={videos.length}
      />

      {/* Tab Navigation */}
      <section className="sticky top-[72px] z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3">
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "photos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Images className="h-4 w-4" aria-hidden />
              Photos ({photos.length})
            </button>
            {videos.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "videos"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Play className="h-4 w-4" aria-hidden />
                Videos ({videos.length})
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Media Grid */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          {activeTab === 'photos' ? (
            photos.length === 0 ? (
              <div className="text-center py-16">
                <Images className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-serif font-semibold mb-2">No Photos Yet</h3>
                <p className="text-muted-foreground">Photos will appear here once they're added to this album.</p>
              </div>
            ) : hasFolderGallery ? (
              <PhoneGalleryExplorer
                folders={explorerFolders}
                media={explorerPhotos}
                resolveUrl={(url) => url || '/placeholder.svg'}
                onOpenLightbox={(index, folderPhotos) => {
                  const target = folderPhotos[index];
                  const globalIndex = target?.id ? photos.findIndex((p) => p.id === target.id) : index;
                  setLightboxIndex(globalIndex >= 0 ? globalIndex : index);
                }}
              />
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="mb-3 sm:mb-4 break-inside-avoid"
                  >
                    <div
                      onClick={() => setLightboxIndex(index)}
                      className="group relative cursor-pointer rounded-xl overflow-hidden
                               bg-muted aspect-auto"
                    >
                      <OptimizedImage
                        src={photo.url || '/placeholder.svg'}
                        alt={photo.caption || 'Photo'}
                        preset="card"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="w-full h-auto max-h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Like button */}
                      <button
                        onClick={(e) => toggleLike(photo.id, e)}
                        className={`absolute top-2 right-2 w-9 h-9 rounded-full backdrop-blur-sm
                                  flex items-center justify-center transition-all duration-300
                                  opacity-0 group-hover:opacity-100
                                  ${likedImages.has(photo.id) 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-charcoal/50 text-ivory hover:bg-red-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${likedImages.has(photo.id) ? 'fill-current' : ''}`} />
                      </button>

                      {/* Caption */}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-3
                                      opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-sm text-ivory line-clamp-1">{photo.caption}</p>
                        </div>
                      )}

                      {/* Featured badge */}
                      {photo.is_featured && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full
                                      bg-primary text-primary-foreground text-xs font-medium">
                          Featured
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            videos.length === 0 ? (
              <div className="text-center py-16">
                <Play className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-serif font-semibold mb-2">No Videos Yet</h3>
                <p className="text-muted-foreground">Videos will appear here once they're added to this album.</p>
              </div>
            ) : (
              // Videos Grid
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video, index) => (
                  <AlbumYoutubeLazyCard key={video.id} video={video} animationDelay={index * 0.1} />
                ))}
              </div>
            )
          )}
        </div>
      </section>

      <WhatsAppButton />

      <GalleryMediaLightbox
        slides={lightboxSlides}
        activeIndex={lightboxIndex}
        onActiveIndexChange={setLightboxIndex}
      />
    </div>
  );
};

export default GalleryAlbum;
