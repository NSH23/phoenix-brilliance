import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import EventsPageHero from "@/components/EventsPageHero";
import { EventTypeCard } from "@/components/ui/event-type-card";
import { SEO } from "@/components/SEO";
import { getActiveEvents, Event } from "@/services/events";
import { getAllAlbums, getAlbumMediaCounts } from "@/services/albums";
import { getPageHeroContent } from "@/services/pageHeroContent";

type EventStats = {
  albumCount: number;
  photoCount: number;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [heroContent, setHeroContent] = useState<Awaited<ReturnType<typeof getPageHeroContent>> | null>(null);

  useEffect(() => {
    loadEvents();
    getPageHeroContent("events").then(setHeroContent).catch(() => setHeroContent(null));
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const [activeEvents, albums] = await Promise.all([getActiveEvents(), getAllAlbums()]);
      setEvents(activeEvents);

      const mediaCounts = await getAlbumMediaCounts(albums.map((a) => a.id)).catch(
        () => ({} as Record<string, number>),
      );

      const stats: Record<string, EventStats> = {};
      for (const album of albums) {
        if (!stats[album.event_id]) {
          stats[album.event_id] = { albumCount: 0, photoCount: 0 };
        }
        stats[album.event_id].albumCount += 1;
        stats[album.event_id].photoCount += mediaCounts[album.id] ?? 0;
      }
      setEventStats(stats);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    const albumCount = Object.values(eventStats).reduce((sum, s) => sum + s.albumCount, 0);
    const photoCount = Object.values(eventStats).reduce((sum, s) => sum + s.photoCount, 0);
    return { albumCount, photoCount };
  }, [eventStats]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.display_order - b.display_order),
    [events],
  );

  const heroDescription =
    heroContent?.description ||
    "Browse event types and open any gallery to see our work — weddings, birthdays, corporate events and more.";

  return (
    <>
      <SEO
        title="Events"
        description="Explore our premium event planning services including weddings, birthdays, corporate events, and celebrations in Pune, Maharashtra."
        keywords="event planning Pune, wedding planning, birthday parties, corporate events Maharashtra, event management"
        url="/events"
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <EventsPageHero
          eyebrow={heroContent?.title || "Our Events"}
          description={heroDescription}
          eventTypeCount={events.length}
          albumCount={totals.albumCount}
          photoCount={totals.photoCount}
        />

        <section className="pb-16 md:pb-20">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center text-muted-foreground">
                No events available at the moment.
              </div>
            ) : (
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {sortedEvents.map((event, index) => (
                  <EventTypeCard
                    key={event.id}
                    title={event.title}
                    slug={event.slug}
                    coverUrl={event.cover_image}
                    albumCount={eventStats[event.id]?.albumCount ?? 0}
                    photoCount={eventStats[event.id]?.photoCount ?? 0}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <WhatsAppButton />
      </div>
    </>
  );
};

export default Events;
