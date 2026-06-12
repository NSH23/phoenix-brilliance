import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import EventDetailHero from "@/components/EventDetailHero";
import { getEventBySlug, Event } from "@/services/events";
import { getAlbumsByEventId, getAlbumMediaCounts, Album } from "@/services/albums";
import { GalleryFolderGrid } from "@/components/ui/gallery-folder-card";
import { PageContentSection } from "@/components/ui/page-content-section";
import { logger } from "@/utils/logger";
import { SEO } from "@/components/SEO";
import { publicAlbumPath } from "@/lib/publicGallery";

interface AlbumWithCount extends Album {
  mediaCount: number;
}

const EventDetail = () => {
  const { eventType } = useParams<{ eventType: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [albums, setAlbums] = useState<AlbumWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [eventType]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);

      if (!eventType) {
        setIsLoading(false);
        return;
      }

      const eventData = await getEventBySlug(eventType);

      if (!eventData) {
        setIsLoading(false);
        return;
      }

      setEvent(eventData);

      try {
        const albumsData = await getAlbumsByEventId(eventData.id);
        const mediaCounts = await getAlbumMediaCounts(albumsData.map((a) => a.id)).catch(
          () => ({} as Record<string, number>),
        );
        setAlbums(
          albumsData.map((album) => ({
            ...album,
            mediaCount: mediaCounts[album.id] ?? 0,
          })),
        );
      } catch (error) {
        logger.error("Error loading albums", error, {
          component: "EventDetail",
          action: "loadAlbums",
          eventId: eventData.id,
        });
        setAlbums([]);
      }
    } catch (error: unknown) {
      logger.error("Error loading event", error, {
        component: "EventDetail",
        action: "loadEvent",
        eventType,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <WhatsAppButton />
      </div>
    );
  }

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const eventSlug = event.slug || eventType || "";
  const eventDescription = event.short_description || event.description || "";
  const seoDescription = eventDescription
    ? `${eventDescription.slice(0, 155)}…`
    : `${event.title} event gallery in Pune. Premium décor and production by Phoenix Events.`;
  const totalPhotos = albums.reduce((sum, a) => sum + a.mediaCount, 0);
  const coverSrc = event.cover_image || "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={event.title}
        description={seoDescription}
        url={eventSlug ? `/events/${eventSlug}` : "/events"}
      />
      <Navbar />

      <EventDetailHero
        title={event.title}
        description={eventDescription}
        coverSrc={coverSrc}
        albumCount={albums.length}
        photoCount={totalPhotos}
      />

      {albums.length === 0 ? (
        <PageContentSection className="pb-16 md:pb-20" background="soft-mesh" band="white">
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card px-6 py-14 text-center shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-foreground">No albums yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re adding galleries for {event.title.toLowerCase()} events soon.
            </p>
            <Link
              to="/events"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse all events
            </Link>
          </div>
        </PageContentSection>
      ) : (
        <PageContentSection className="pb-16 md:pb-20" background="vignette-grid" band="linen">
          <GalleryFolderGrid
            variant="featured"
            compact={false}
            folders={albums.map((album) => ({
              id: album.id,
              name: album.title,
              count: album.mediaCount,
              coverUrl: album.cover_image,
              description:
                album.mediaCount > 0
                  ? `${album.mediaCount} photo${album.mediaCount !== 1 ? "s" : ""}`
                  : undefined,
              href: publicAlbumPath(event.slug, album.id),
              featured: album.is_featured,
            }))}
            className="mx-auto max-w-7xl grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
          />
        </PageContentSection>
      )}

      <WhatsAppButton />
    </div>
  );
};

export default EventDetail;
