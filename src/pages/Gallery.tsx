import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Play, Images, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { mockEvents, mockAlbums } from "@/data/mockData";

const Gallery = () => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Get unique event types that have albums
  const eventTypes = mockEvents.filter(event => 
    event.isActive && mockAlbums.some(album => album.eventId === event.id)
  );

  // Get featured albums
  const featuredAlbums = mockAlbums.filter(album => album.isFeatured).slice(0, 3);

  // Stats
  const totalPhotos = mockAlbums.reduce((acc, album) => acc + album.mediaCount, 0);
  const totalAlbums = mockAlbums.length;
  const totalEvents = eventTypes.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-rose-gold/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
                       bg-gradient-to-r from-primary/20 to-rose-gold/20 
                       border border-primary/30 backdrop-blur-sm mb-6"
            >
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Our Portfolio</span>
            </motion.span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Moments We've{" "}
              <span className="text-gradient-gold">Captured</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Browse through our collection of stunning events, each album telling a unique story of celebration and joy.
            </p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center gap-8 sm:gap-16 mt-10"
            >
              {[
                { value: `${totalPhotos}+`, label: "Photos" },
                { value: totalAlbums, label: "Albums" },
                { value: totalEvents, label: "Event Types" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-serif font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Event Categories Grid */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Browse by <span className="text-gradient-gold">Event Type</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select an event category to explore our curated albums
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {eventTypes.map((event, index) => {
              const albumCount = mockAlbums.filter(a => a.eventId === event.id).length;
              const photoCount = mockAlbums
                .filter(a => a.eventId === event.id)
                .reduce((acc, a) => acc + a.mediaCount, 0);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/gallery/${event.slug}`}
                    className="group block relative rounded-2xl overflow-hidden aspect-[4/5]"
                    onMouseEnter={() => setHoveredEvent(event.id)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    {/* Image */}
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className={`w-full h-full object-cover transition-all duration-700
                                ${hoveredEvent === event.id ? 'scale-110' : 'scale-100'}`}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-ivory mb-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-ivory/70">
                        <span className="flex items-center gap-1">
                          <Images className="w-3.5 h-3.5" />
                          {albumCount} Albums
                        </span>
                        <span>•</span>
                        <span>{photoCount} Photos</span>
                      </div>

                      {/* Arrow on hover */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: hoveredEvent === event.id ? 1 : 0,
                          x: hoveredEvent === event.id ? 0 : -10 
                        }}
                        className="absolute top-4 right-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Border glow on hover */}
                    <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300
                                  ${hoveredEvent === event.id ? 'border-primary' : 'border-transparent'}`} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Albums */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-2">
                Featured <span className="text-gradient-gold">Albums</span>
              </h2>
              <p className="text-muted-foreground">Our most loved event collections</p>
            </div>
            <Link
              to="/gallery/all"
              className="hidden sm:flex items-center gap-2 text-primary hover:underline"
            >
              View All Albums <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAlbums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/gallery/${mockEvents.find(e => e.id === album.eventId)?.slug}/${album.id}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border
                           hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                    
                    {/* Featured Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 
                                  bg-primary/90 rounded-full text-xs font-medium text-primary-foreground">
                      <Sparkles className="w-3.5 h-3.5" />
                      Featured
                    </div>

                    {/* Play button if has video */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-ivory/20 
                                  backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-4 h-4 text-ivory fill-ivory" />
                    </div>

                    {/* Photo count */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 
                                  bg-charcoal/60 backdrop-blur-sm rounded-full text-xs text-ivory">
                      <Camera className="w-3.5 h-3.5" />
                      {album.mediaCount} Photos
                    </div>
                  </div>

                  {/* Album Info */}
                  <div className="p-5">
                    <div className="text-xs text-primary font-medium mb-2">{album.eventTitle}</div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-2 
                                 group-hover:text-primary transition-colors">
                      {album.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {album.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(album.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile View All */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/gallery/all"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                       bg-primary text-primary-foreground font-medium"
            >
              View All Albums <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Ready to Create Your Own <span className="text-gradient-gold">Story?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Let us help you create moments that you'll cherish forever.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full
                       bg-primary text-primary-foreground font-semibold
                       hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              Book Your Event <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Gallery;
