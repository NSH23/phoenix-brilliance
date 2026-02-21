import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, Navigate } from "react-router-dom";
import { Camera, Play, ArrowLeft, ArrowRight, Calendar, Images, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getActiveEvents, getEventBySlug, Event } from "@/services/events";
import { getAllAlbums, getAlbumsByEventId, getAlbumMedia, Album } from "@/services/albums";
import { logger } from "@/utils/logger";
import { SEO } from "@/components/SEO";

interface AlbumWithCount extends Album {
  mediaCount?: number;
  eventTitle?: string;
}

const GalleryEventType = () => {
  const { eventType } = useParams<{ eventType: string }>();
  const [hoveredAlbum, setHoveredAlbum] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [albums, setAlbums] = useState<AlbumWithCount[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle "all" case - show all albums
  const isAllAlbums = eventType === "all";

  useEffect(() => {
    loadData();
  }, [eventType]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      if (isAllAlbums) {
        // Load all albums
        const [albumsData, eventsData] = await Promise.all([
          getAllAlbums(),
          getActiveEvents()
        ]);
        
        setAllEvents(eventsData);
        
        // Load media count and event titles
        const albumsWithCounts = await Promise.all(
          albumsData.map(async (album: any) => {
            try {
              const media = await getAlbumMedia(album.id);
              const event = eventsData.find(e => e.id === album.event_id);
              return {
                ...album,
                mediaCount: media.length,
                eventTitle: event?.title || 'Unknown Event',
              };
            } catch (error) {
              const event = eventsData.find(e => e.id === album.event_id);
              return {
                ...album,
                mediaCount: 0,
                eventTitle: event?.title || 'Unknown Event',
              };
            }
          })
        );
        
        setAlbums(albumsWithCounts);
        setEvent(null);
      } else {
        // Load event and its albums
        const [eventData, albumsData, eventsData] = await Promise.all([
          getEventBySlug(eventType!),
          getAllAlbums(),
          getActiveEvents()
        ]);
        
        if (!eventData) {
          setIsLoading(false);
          return;
        }
        
        setEvent(eventData);
        setAllEvents(eventsData);
        
        // Filter albums for this event
        const eventAlbums = albumsData.filter((album: any) => album.event_id === eventData.id);
        
        // Load media count
        const albumsWithCounts = await Promise.all(
          eventAlbums.map(async (album: any) => {
            try {
              const media = await getAlbumMedia(album.id);
              return {
                ...album,
                mediaCount: media.length,
                eventTitle: eventData.title,
              };
            } catch (error) {
              return {
                ...album,
                mediaCount: 0,
                eventTitle: eventData.title,
              };
            }
          })
        );
        
        setAlbums(albumsWithCounts);
      }
    } catch (error: any) {
      logger.error('Error loading gallery event type', error, { component: 'GalleryEventType', action: 'loadData', eventType });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPhotos = albums.reduce((acc, album) => acc + (album.mediaCount || 0), 0);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  // If not "all" and event not found, redirect
  if (!isAllAlbums && !event) {
    return <Navigate to="/gallery" replace />;
  }

  const pageTitle = isAllAlbums ? "All Albums" : `${event?.title ?? eventType} Gallery`;
  const pageDescription = isAllAlbums
    ? "Browse our complete event photography gallery. Weddings, corporate events, and celebrations in Pune."
    : `${event?.title ?? eventType} event albums and photos in Pune. Premium event photography by Phoenix Events.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageTitle}
        description={pageDescription}
        url={eventType ? `/gallery/${eventType}` : "/gallery"}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {!isAllAlbums && event && (
            <>
              <img
                src={event.cover_image || '/placeholder.svg'}
                alt={event.title}
                className="w-full h-full object-cover opacity-20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
            </>
          )}
          <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-rose-gold/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground 
                       hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
                       bg-gradient-to-r from-primary/20 to-rose-gold/20 
                       border border-primary/30 backdrop-blur-sm mb-6"
            >
              <Images className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {isAllAlbums ? 'All Albums' : `${event?.title} Gallery`}
              </span>
            </motion.span>

            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">
              {isAllAlbums ? (
                <>All <span className="text-gradient-gold">Albums</span></>
              ) : (
                <>{event?.title} <span className="text-gradient-gold">Albums</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              {isAllAlbums 
                ? 'Browse through our complete collection of event albums'
                : event?.description || event?.short_description || ''}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Images className="w-4 h-4 text-primary" />
                {albums.length} Albums
              </span>
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                {totalPhotos}+ Photos
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Albums Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          {albums.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Images className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold mb-2">No Albums Yet</h3>
              <p className="text-muted-foreground mb-6">
                We're still adding albums to this category. Check back soon!
              </p>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                         bg-primary text-primary-foreground font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Gallery
              </Link>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {albums.map((album, index) => {
                const albumEvent = allEvents.find(e => e.id === album.event_id);
                
                return (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    onMouseEnter={() => setHoveredAlbum(album.id)}
                    onMouseLeave={() => setHoveredAlbum(null)}
                  >
                    <Link
                      to={`/gallery/${albumEvent?.slug || 'all'}/${album.id}`}
                      className="group block bg-card rounded-2xl overflow-hidden border border-border
                               hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 
                               transition-all duration-500"
                    >
                      {/* Cover Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={album.cover_image || '/placeholder.svg'}
                          alt={album.title}
                          className={`w-full h-full object-cover transition-all duration-700
                                    ${hoveredAlbum === album.id ? 'scale-110' : 'scale-100'}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
                        
                        {/* Featured Badge */}
                        {album.is_featured && (
                          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 
                                        bg-primary/90 rounded-full text-xs font-medium text-primary-foreground">
                            <Sparkles className="w-3.5 h-3.5" />
                            Featured
                          </div>
                        )}

                        {/* Video indicator */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-ivory/20 
                                      backdrop-blur-sm flex items-center justify-center
                                      opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-ivory fill-ivory" />
                        </div>

                        {/* Photo count */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 
                                      bg-charcoal/60 backdrop-blur-sm rounded-full text-xs text-ivory">
                          <Camera className="w-3.5 h-3.5" />
                          {album.mediaCount || 0}
                        </div>

                        {/* View button on hover */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: hoveredAlbum === album.id ? 1 : 0,
                            scale: hoveredAlbum === album.id ? 1 : 0.8
                          }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm
                                        flex items-center justify-center shadow-xl">
                            <ArrowRight className="w-6 h-6 text-primary-foreground" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Album Info */}
                      <div className="p-5 sm:p-6">
                        {isAllAlbums && album.eventTitle && (
                          <div className="text-xs text-primary font-medium mb-2">{album.eventTitle}</div>
                        )}
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground mb-2 
                                     group-hover:text-primary transition-colors line-clamp-1">
                          {album.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {album.description || 'No description'}
                        </p>
                        {album.event_date && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(album.event_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Other Event Types */}
      {!isAllAlbums && allEvents.length > 1 && (
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-8 text-center">
              Explore Other <span className="text-gradient-gold">Categories</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {allEvents
                .filter(e => e.id !== event?.id)
                .slice(0, 6)
                .map(otherEvent => (
                  <Link
                    key={otherEvent.id}
                    to={`/gallery/${otherEvent.slug}`}
                    className="px-5 py-2.5 rounded-full bg-card border border-border
                             hover:border-primary hover:bg-primary/10 transition-all duration-300
                             text-sm font-medium text-foreground"
                  >
                    {otherEvent.title}
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default GalleryEventType;
